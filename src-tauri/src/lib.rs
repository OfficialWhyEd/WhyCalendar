use std::io::{Read, Write};
use std::net::TcpListener;
use std::process::Command;

fn extract_code_from_request(request: &str) -> Option<String> {
    let path = request.lines().next()?.split_whitespace().nth(1)?;
    let query = path.split('?').nth(1)?;
    for param in query.split('&') {
        let mut parts = param.splitn(2, '=');
        if parts.next()? == "code" {
            return Some(urlencoding_decode(parts.next()?));
        }
    }
    None
}

fn urlencoding_decode(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next().unwrap_or('0');
            let h2 = chars.next().unwrap_or('0');
            if let Ok(byte) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                result.push(byte as char);
            }
        } else if c == '+' {
            result.push(' ');
        } else {
            result.push(c);
        }
    }
    result
}

#[tauri::command]
async fn wait_for_oauth_callback(port: u16) -> Result<String, String> {
    let listener =
        TcpListener::bind(format!("127.0.0.1:{}", port)).map_err(|e| e.to_string())?;

    let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;

    let mut buf = [0u8; 8192];
    let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]).to_string();

    let code =
        extract_code_from_request(&request).ok_or("Codice OAuth non trovato nel callback")?;

    let html = r#"<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{background:#050505;color:#00E5FF;font-family:monospace;display:flex;
align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;}
h1{font-size:24px;letter-spacing:.2em;}p{color:#777;font-size:14px;}</style></head>
<body><h1>✓ WHYCALENDAR</h1><p>Autorizzato. Puoi chiudere questa finestra.</p>
<script>setTimeout(()=>window.close(),2000)</script></body></html>"#;

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html.len(),
        html
    );
    stream.write_all(response.as_bytes()).ok();
    Ok(code)
}

#[tauri::command]
async fn ask_claude(prompt: String) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_default();

    // Cerca claude in tutti i posti possibili (nvm, homebrew, locale)
    let mut candidates = vec![
        format!("{}/claude", home),
        "/usr/local/bin/claude".to_string(),
        "/opt/homebrew/bin/claude".to_string(),
    ];

    // Aggiungi tutte le versioni node in nvm
    let nvm_dir = format!("{}/.nvm/versions/node", home);
    if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
        for entry in entries.flatten() {
            let bin = entry.path().join("bin/claude");
            candidates.push(bin.to_string_lossy().to_string());
            // claude.exe (Bun binary)
            let exe_path = entry.path()
                .join("lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe");
            candidates.push(exe_path.to_string_lossy().to_string());
        }
    }

    let claude_bin = candidates
        .iter()
        .find(|p| std::path::Path::new(p.as_str()).exists())
        .cloned()
        .ok_or_else(|| "claude non trovato. Assicurati che Claude Code sia installato.".to_string())?;

    let output = Command::new(&claude_bin)
        .args(["-p", &prompt, "--output-format", "text"])
        .env("HOME", &home)
        .env("PATH", format!("/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:{}/.nvm/versions/node/v24.15.0/bin", home))
        .output()
        .map_err(|e| format!("Impossibile avviare claude: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Errore claude: {}", err))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![wait_for_oauth_callback, ask_claude])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
