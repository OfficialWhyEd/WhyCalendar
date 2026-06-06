/**
 * WhySpidey v8 — Rebuilt from research
 *
 * Sources:
 *  - Angoli zampe: ±30°,±60°,±100°,±140° dal verticale (spider facing up)
 *  - Colori: viola bioluminescente su sfondo scuro (leggibile, carino)
 *  - Zampe: quadratic bezier (non linee dritte → più organiche)
 *  - Occhi: bianchi con pupilla nera → segnale vitale principale
 *  - World-space feet: piedi in coordinate schermo, non SVG
 *  - Step solo durante il movimento reale
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GCalEvent } from '../core/google/calendar'

type Mood = 'idle' | 'sleeping' | 'thinking' | 'dancing' | 'excited' | 'success' | 'error'
type EyeShape = 'normal' | 'happy' | 'closed' | 'star' | 'x' | 'surprised'

// ─── Palette: viola bioluminescente — visibile su dark UI ─────────────────
const P = {
  ceph:    '#7C3AED',   // viola vivido - torace
  abd:     '#5B21B6',   // viola scuro - addome
  leg:     '#A78BFA',   // viola chiaro - zampe
  legGlow: 'rgba(167,139,250,0.3)',
  joint:   '#C4B5FD',
  tip:     '#DDD6FE',
  eyeW:    '#FFFFFF',
  eyeP:    '#1E0038',
  eyeR:    '#EDE9FE',
  markW:   '#EDE9FE',
  out:     'rgba(0,0,20,0.6)',
  glow:    '#8B5CF6',
} as const

const ACCENT: Record<Mood, string> = {
  idle:     '#A78BFA',
  sleeping: '#6D28D9',
  thinking: '#22D3EE',
  dancing:  '#F472B6',
  excited:  '#FB923C',
  success:  '#34D399',
  error:    '#F87171',
}

// ─── SVG: 200×180, corpo centrato a (100, 90) ──────────────────────────────
const SVW = 200, SVH = 180
const BCX = 100, BCY = 90   // centro corpo nel SVG

// Corpo
const CRX = 15, CRY = 14   // torace (ellisse)
const ARX = 21, ARY = 18   // addome (ellisse)
const ABDX = BCX, ABDY = BCY + 30  // centro addome

// Occhi
const ELX = BCX - 12, ERX = BCX + 3, EY = BCY - 10, EW = 9, EH = 8

// Vita
const WAIST_Y = BCY + CRY - 1
const WAIST_H = ABDY - ARY - WAIST_Y + 2

// W mark
const W_CELLS: [number, number][] = [
  [0,0],[4,0],[0,1],[4,1],[0,2],[2,2],[4,2],[1,3],[3,3],
]
const WS = 3, WP = 2.1
const W_OX = ABDX - (4*WS)/2
const W_OY = ABDY - (3*WS)/2 - 3

// ─── Zampe ─────────────────────────────────────────────────────────────────
const L1 = 30, L2 = 22   // lunghezze segmenti px

// Offset spalle in SVG (relative a BCX, BCY)
const SHOULDER_OFF = [
  { dx: -13, dy: -10, isLeft: true,  gait: 0 },  // front-left
  { dx: -14, dy: -3,  isLeft: true,  gait: 1 },
  { dx: -14, dy:  4,  isLeft: true,  gait: 0 },
  { dx: -12, dy:  11, isLeft: true,  gait: 1 },  // back-left
  { dx:  13, dy: -10, isLeft: false, gait: 1 },  // front-right
  { dx:  14, dy: -3,  isLeft: false, gait: 0 },
  { dx:  14, dy:  4,  isLeft: false, gait: 1 },
  { dx:  12, dy:  11, isLeft: false, gait: 0 },  // back-right
]

// Angoli corretti: ±30°,±60°,±100°,±140° dal verticale (spider facing up = -π/2)
// Left side (going left from up): up + (-30°), (-60°), (-100°), (-140°)
// Right side (going right from up): up + (+30°), (+60°), (+100°), (+140°)
const BASE_ANGLES = [
  -Math.PI/2 - 30*Math.PI/180,  // L0: -2.094 (upper-left front)
  -Math.PI/2 - 60*Math.PI/180,  // L1: -2.618 (left)
  -Math.PI/2 - 100*Math.PI/180, // L2: 2.967  (lower-left)
  -Math.PI/2 - 140*Math.PI/180, // L3: 2.269  (lower-left back)
  -Math.PI/2 + 30*Math.PI/180,  // R0: -1.047 (upper-right front)
  -Math.PI/2 + 60*Math.PI/180,  // R1: -0.524 (right)
  -Math.PI/2 + 100*Math.PI/180, // R2:  0.174 (lower-right)
  -Math.PI/2 + 140*Math.PI/180, // R3:  0.872 (lower-right back)
]

const REACH = (L1 + L2 * 0.82)  // ~48px

// Posizione di riposo piede in WORLD SPACE
function worldRest(si: number, bx: number, by: number) {
  const s = SHOULDER_OFF[si]
  const a = BASE_ANGLES[si]
  return {
    rx: bx + s.dx + Math.cos(a) * REACH,
    ry: by + s.dy + Math.sin(a) * REACH + 4,
  }
}

// IK 2-joint (law of cosines)
function ik2(sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, ku: boolean) {
  const dx = tx-sx, dy = ty-sy
  let d = Math.hypot(dx, dy)
  if (d < 0.01) return { kx: sx, ky: sy-l1 }
  d = Math.min(d, l1+l2-0.5)
  const c = Math.max(-1, Math.min(1, (d*d+l1*l1-l2*l2)/(2*d*l1)))
  const ka = Math.atan2(dy, dx) + (ku?-1:1)*Math.acos(c)
  return { kx: sx+l1*Math.cos(ka), ky: sy+l1*Math.sin(ka) }
}

// World → SVG conversion
// SVG origin su schermo = (bx - BCX, by - BCY)
function w2s(wx: number, wy: number, bx: number, by: number) {
  return { sx: wx-bx+BCX, sy: wy-by+BCY }
}

// ─── Tipi ──────────────────────────────────────────────────────────────────
type Foot = {
  wx: number; wy: number
  stepping: boolean; stepT: number
  fromX: number; fromY: number
  toX: number; toY: number; stepH: number
}

type AS = {
  bx: number; by: number
  feet: Foot[]
  curX: number; curY: number
  lastNear: boolean
  lpx: number; lpy: number
  fn: number
}

// ─── Wrapper / SVG sizing ──────────────────────────────────────────────────
const WRAP = 80         // wrapper px
const SVG_SCREEN = 200  // SVG renderizzato a 200px (1:1 con viewBox)
const SOX = WRAP/2 - BCX   // -60
const SOY = WRAP/2 - BCY   // -50

// ─── Zone ──────────────────────────────────────────────────────────────────
const ZONES = [
  { xp:  2, yp: 84, name: 'home'      },
  { xp:  2, yp: 52, name: 'clock'     },
  { xp:  2, yp: 20, name: 'topleft'   },
  { xp: 22, yp: 84, name: 'timeline'  },
  { xp: 44, yp: 84, name: 'timeline2' },
  { xp: 30, yp: 20, name: 'dayview'   },
  { xp: 58, yp: 55, name: 'chat'      },
]
const zt = (z: typeof ZONES[0]) => ({
  x: window.innerWidth * z.xp/100 + WRAP/2,
  y: window.innerHeight * z.yp/100 - WRAP/2,
})

// ─── Widget ────────────────────────────────────────────────────────────────
interface Widget { id:string; x:number; y:number; icon:string; title:string; body:string; color:string }

const SF = '-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif'

function WidgetCard({w}:{w:Widget}) {
  return (
    <motion.div key={w.id}
      initial={{opacity:0,scale:0.82,y:6}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.82,y:6}}
      transition={{type:'spring',damping:16,stiffness:220}}
      style={{
        position:'absolute',
        left:Math.max(8,Math.min(window.innerWidth-215,w.x)),
        top:Math.max(8,Math.min(window.innerHeight-90,w.y)),
        background:'rgba(5,0,20,0.95)',border:`1px solid ${w.color}45`,
        borderRadius:10,padding:'9px 13px',minWidth:150,maxWidth:215,
        backdropFilter:'blur(16px)',
        boxShadow:`0 0 18px ${w.color}20,0 6px 26px rgba(0,0,0,0.8)`,
        pointerEvents:'none',zIndex:9980,
      }}
    >
      <div style={{position:'absolute',top:-13,left:'50%',width:1,height:15,
        background:`linear-gradient(to bottom,transparent,${w.color}60)`,transform:'translateX(-50%)'}}/>
      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
        <span style={{fontSize:12}}>{w.icon}</span>
        <span style={{fontFamily:SF,fontSize:9,fontWeight:700,
          color:w.color,letterSpacing:'0.1em',textTransform:'uppercase'}}>{w.title}</span>
      </div>
      <div style={{fontFamily:SF,fontSize:11,color:'rgba(255,255,255,0.82)',lineHeight:1.4}}>{w.body}</div>
    </motion.div>
  )
}

function Eye({x,y,shape,accent,pdx=0,pdy=0}:{x:number;y:number;shape:EyeShape;accent:string;pdx?:number;pdy?:number}) {
  const cx=x+EW/2,cy=y+EH/2
  const cl=(v:number,m:number)=>Math.max(-m,Math.min(m,v))
  if (shape==='closed') return <rect x={x} y={cy-1.2} width={EW} height={2.4} rx={1.2} fill={P.eyeP}/>
  if (shape==='happy')  return <rect x={x} y={y+EH*0.42} width={EW} height={EH*0.58} rx={2} fill={P.eyeP}/>
  if (shape==='x') return <g>
    <rect x={x+1} y={cy-1.8} width={EW-2} height={3.6} rx={1.5} fill={P.eyeP} transform={`rotate(40 ${cx} ${cy})`}/>
    <rect x={x+1} y={cy-1.8} width={EW-2} height={3.6} rx={1.5} fill={P.eyeP} transform={`rotate(-40 ${cx} ${cy})`}/>
  </g>
  if (shape==='star') return <g>
    <rect x={x} y={cy-1.8} width={EW} height={3.6} rx={1.5} fill={accent}/>
    <rect x={cx-1.8} y={y} width={3.6} height={EH} rx={1.5} fill={accent}/>
  </g>
  if (shape==='surprised') return <>
    <ellipse cx={cx} cy={cy} rx={EW/2+1} ry={EH/2+1} fill={P.eyeP}/>
    <ellipse cx={cx-1} cy={cy-1} rx={EW/2-2} ry={EH/2-2} fill={P.eyeW} opacity={0.5}/>
  </>
  return <g>
    <rect x={x} y={y} width={EW} height={EH} rx={3} fill={P.eyeW}/>
    <rect x={x+1.5+cl(pdx,2.5)} y={y+1.5+cl(pdy,2.5)} width={5} height={5} rx={1.5} fill={P.eyeP}/>
    <rect x={x+2+cl(pdx,1.5)} y={y+2+cl(pdy,1.5)} width={2} height={2} rx={0.5} fill={P.eyeR} opacity={0.9}/>
  </g>
}


// ─── Component ─────────────────────────────────────────────────────────────
interface WhySpideyProps { mood?:Mood; eventsFor?:(d:Date)=>GCalEvent[] }

export default function WhySpidey({mood:fm,eventsFor}:WhySpideyProps) {
  const [mood,setMood]         = useState<Mood>('idle')
  const [blink,setBlink]       = useState(false)
  const [widgets]              = useState<Widget[]>([])
  const [pupil,setPupil]       = useState({dx:0,dy:0})
  const [curNear,setCurNear]   = useState(false)

  const wRef  = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Path refs per zampe (bezier) — 8 zampe × 2 segmenti
  const upPaths = useRef<(SVGPathElement|null)[]>(Array(8).fill(null))
  const loPaths = useRef<(SVGPathElement|null)[]>(Array(8).fill(null))
  const gloPaths = useRef<(SVGPathElement|null)[]>(Array(8).fill(null))  // glow
  const kDots   = useRef<(SVGCircleElement|null)[]>(Array(8).fill(null))
  const fDots   = useRef<(SVGCircleElement|null)[]>(Array(8).fill(null))
  const glowEl  = useRef<SVGEllipseElement>(null)
  // bodyGEl reserved for future body glow ref

  const aRef = useRef<AS>({
    bx:-400,by:-400,
    feet:SHOULDER_OFF.map((_,i)=>{
      const r=worldRest(i,-400,-400)
      return {wx:r.rx,wy:r.ry,stepping:false,stepT:0,fromX:r.rx,fromY:r.ry,toX:r.rx,toY:r.ry,stepH:0}
    }),
    curX:-999,curY:-999,
    lastNear:false,lpx:0,lpy:0,fn:0,
  })
  const mRef = useRef(mood)
  useEffect(()=>{mRef.current=mood},[mood])

  const computeMood = useCallback(():Mood=>{
    if (fm) return fm
    const now=new Date(),h=now.getHours()
    if (h<7||h>=23) return 'sleeping'
    if (eventsFor) {
      const cur=h+now.getMinutes()/60
      for (const ev of eventsFor(now)) {
        const eh=ev.start.getHours()+ev.start.getMinutes()/60
        if (eh<=cur||eh>cur+8) continue
        const t=ev.title.toLowerCase()
        if (/music|concert|ballo|danc|club|party/.test(t)) return 'dancing'
        if (/gym|palest|sport|fit|allenamento/.test(t)) return 'excited'
        if (/meeting|call|riunione|standup/.test(t)) return 'thinking'
      }
    }
    return 'idle'
  },[fm,eventsFor])

  useEffect(()=>{
    setMood(computeMood())
    const id=setInterval(()=>setMood(computeMood()),60_000)
    return ()=>clearInterval(id)
  },[computeMood])

  useEffect(()=>{
    const h=(e:MouseEvent)=>{aRef.current.curX=e.clientX;aRef.current.curY=e.clientY}
    window.addEventListener('mousemove',h,{passive:true})
    return ()=>window.removeEventListener('mousemove',h)
  },[])

  // Blink
  useEffect(()=>{
    if (mood==='sleeping') return
    let t:ReturnType<typeof setTimeout>
    const go=()=>{t=setTimeout(()=>{setBlink(true);setTimeout(()=>{setBlink(false);go()},90)},2000+Math.random()*3000)}
    go();return ()=>clearTimeout(t)
  },[mood])

  // RAF — solo occhi, no posizione
  useEffect(()=>{
    const a=aRef.current
    // Posizione fissa: calcolata una volta e mai toccata
    const home=zt(ZONES[0])
    a.bx=home.x; a.by=home.y
    // Init piedi statici
    for (let i=0;i<8;i++) {
      const r=worldRest(i,a.bx,a.by)
      a.feet[i]={wx:r.rx,wy:r.ry,stepping:false,stepT:0,fromX:r.rx,fromY:r.ry,toX:r.rx,toY:r.ry,stepH:0}
    }
    // Disegna zampe una volta sola (statiche)
    for (let i=0;i<8;i++) {
      const s=SHOULDER_OFF[i]
      const foot=a.feet[i]
      const svgSX=BCX+s.dx, svgSY=BCY+s.dy
      const {sx:svgFX,sy:svgFY}=w2s(foot.wx,foot.wy,a.bx,a.by)
      const {kx,ky}=ik2(svgSX,svgSY,svgFX,svgFY,L1,L2,!s.isLeft)
      const u_cpx=(svgSX+kx)/2+(svgSY-kx)*0.12
      const u_cpy=(svgSY+ky)/2+(kx-svgSX)*0.12
      const l_cpx=(kx+svgFX)/2+(ky-svgFX)*0.08
      const l_cpy=(ky+svgFY)/2+(svgFX-kx)*0.08
      const upD=`M${svgSX.toFixed(1)},${svgSY.toFixed(1)} Q${u_cpx.toFixed(1)},${u_cpy.toFixed(1)} ${kx.toFixed(1)},${ky.toFixed(1)}`
      const loD=`M${kx.toFixed(1)},${ky.toFixed(1)} Q${l_cpx.toFixed(1)},${l_cpy.toFixed(1)} ${svgFX.toFixed(1)},${svgFY.toFixed(1)}`
      upPaths.current[i]?.setAttribute('d',upD)
      loPaths.current[i]?.setAttribute('d',loD)
      gloPaths.current[i]?.setAttribute('d',upD+' '+loD)
      kDots.current[i]?.setAttribute('cx',kx.toFixed(1))
      kDots.current[i]?.setAttribute('cy',ky.toFixed(1))
      fDots.current[i]?.setAttribute('cx',svgFX.toFixed(1))
      fDots.current[i]?.setAttribute('cy',svgFY.toFixed(1))
    }

    let rid:number
    const tick=()=>{
      a.fn++
      // Solo occhi
      const cdx=a.curX-a.bx,cdy=a.curY-a.by,cd=Math.hypot(cdx,cdy)
      const near=cd<150
      if (near!==a.lastNear) { a.lastNear=near; setCurNear(near) }
      if (a.fn%4===0 && cd<300) {
        const nd=Math.min(1,cd/120)
        const npx=cd>5?(cdx/cd)*nd*2.5:0,npy=cd>5?(cdy/cd)*nd*2.5:0
        if (Math.abs(npx-a.lpx)>0.35||Math.abs(npy-a.lpy)>0.35) {a.lpx=npx;a.lpy=npy;setPupil({dx:npx,dy:npy})}
      }
      rid=requestAnimationFrame(tick)
    }
    rid=requestAnimationFrame(tick)
    return ()=>{cancelAnimationFrame(rid)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const accent=ACCENT[mood]
  const eye:EyeShape=
    blink?'closed':mood==='sleeping'?'closed':mood==='dancing'?'happy':
    mood==='excited'?'surprised':mood==='success'?'star':mood==='error'?'x':'normal'

  return (<>
    <AnimatePresence>{widgets.map(w=><WidgetCard key={w.id} w={w}/>)}</AnimatePresence>

    <div ref={wRef}
      onClick={()=>{}}
      style={{position:'fixed',bottom:20,left:20,width:WRAP,height:WRAP,
        pointerEvents:'auto',cursor:'pointer'}}
    >
      <svg ref={svgRef} width={SVG_SCREEN} height={SVG_SCREEN}
        viewBox={`0 0 ${SVW} ${SVH}`}
        style={{position:'absolute',left:SOX,top:SOY,overflow:'visible',
          transformOrigin:`${BCX}px ${BCY}px`}}
      >
        <defs>
          <filter id="sg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Glow zampe (stroke largo semitrasparente) */}
        {Array.from({length:8},(_,i)=>(
          <path key={`gl${i}`} ref={el=>{gloPaths.current[i]=el}}
            fill="none" stroke={P.legGlow} strokeWidth={10} strokeLinecap="round" d="M0,0"/>
        ))}

        {/* Zampe superiori (arto 1) */}
        {Array.from({length:8},(_,i)=>(
          <path key={`up${i}`} ref={el=>{upPaths.current[i]=el}}
            fill="none" stroke={P.leg} strokeWidth={4.5} strokeLinecap="round" d="M0,0"/>
        ))}

        {/* Zampe inferiori (arto 2) */}
        {Array.from({length:8},(_,i)=>(
          <path key={`lo${i}`} ref={el=>{loPaths.current[i]=el}}
            fill="none" stroke={P.leg} strokeWidth={3} strokeLinecap="round"
            style={{opacity:0.8}} d="M0,0"/>
        ))}

        {/* Ginocchia */}
        {Array.from({length:8},(_,i)=>(
          <circle key={`k${i}`} ref={el=>{kDots.current[i]=el}}
            r={3} fill={P.joint} cx={0} cy={0}/>
        ))}

        {/* Punte piedi */}
        {Array.from({length:8},(_,i)=>(
          <circle key={`f${i}`} ref={el=>{fDots.current[i]=el}}
            r={2} fill={P.tip} cx={0} cy={0} opacity={0.7}/>
        ))}

        {/* Ground glow */}
        <ellipse ref={glowEl} cx={ABDX} cy={ABDY+ARY+8} rx={28} ry={7}
          fill={accent} opacity={0.15}/>

        {/* Vita */}
        <rect x={BCX-4.5} y={WAIST_Y} width={9} height={WAIST_H+1} rx={3.5} fill={P.abd}/>

        {/* Addome: glow halo */}
        <ellipse cx={ABDX} cy={ABDY} rx={ARX+4} ry={ARY+4} fill={P.glow} opacity={0.12}/>
        {/* Addome: corpo */}
        <ellipse cx={ABDX} cy={ABDY} rx={ARX} ry={ARY} fill={P.abd} filter="url(#sg)"/>
        {/* Highlight */}
        <ellipse cx={ABDX-5} cy={ABDY-6} rx={8} ry={5.5} fill="rgba(255,255,255,0.12)"/>
        {/* Outline */}
        <ellipse cx={ABDX} cy={ABDY} rx={ARX} ry={ARY}
          fill="none" stroke="rgba(196,181,253,0.3)" strokeWidth={1.5}/>
        {/* W mark */}
        {W_CELLS.map(([c,r],i)=>(
          <rect key={i} x={W_OX+c*WS} y={W_OY+r*WS} width={WP} height={WP} rx={0.7}
            fill={P.markW} opacity={0.85}/>
        ))}

        {/* Torace: glow halo */}
        <ellipse cx={BCX} cy={BCY} rx={CRX+4} ry={CRY+4} fill={P.glow} opacity={0.18}/>
        {/* Torace: corpo */}
        <ellipse cx={BCX} cy={BCY} rx={CRX} ry={CRY} fill={P.ceph} filter="url(#sg)"/>
        <ellipse cx={BCX-4} cy={BCY-4} rx={6} ry={4} fill="rgba(255,255,255,0.15)"/>
        <ellipse cx={BCX} cy={BCY} rx={CRX} ry={CRY}
          fill="none" stroke="rgba(196,181,253,0.35)" strokeWidth={1.5}/>

        {/* Occhi */}
        <Eye x={ELX} y={EY} shape={eye} accent={accent} pdx={pupil.dx} pdy={pupil.dy}/>
        <Eye x={ERX} y={EY} shape={eye} accent={accent} pdx={pupil.dx} pdy={pupil.dy}/>
        <ellipse cx={BCX+1} cy={EY+EH/2} rx={18} ry={10} fill={accent}
          opacity={curNear?0.18:0.06}/>

        {/* Chelicere */}
        <ellipse cx={BCX-4} cy={BCY+CRY} rx={3} ry={4.5} fill={P.ceph}/>
        <ellipse cx={BCX+4} cy={BCY+CRY} rx={3} ry={4.5} fill={P.ceph}/>
      </svg>
    </div>
  </>)
}
