#!/usr/bin/env python3
"""Create EXACT logo from user's image and generate macOS iconset."""

import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

SCRIPTS_DIR = os.path.dirname(__file__)
ICONSET_DIR = '/tmp/icon.iconset'
ICNS_PATH = os.path.join(SCRIPTS_DIR, '..', 'src-tauri', 'icons', 'icon.icns')
ICONS_DIR = os.path.join(SCRIPTS_DIR, '..', 'src-tauri', 'icons')

SIZES = [
    ('icon_16x16.png', 16),
    ('icon_16x16@2x.png', 32),
    ('icon_32x32.png', 32),
    ('icon_32x32@2x.png', 64),
    ('icon_128x128.png', 128),
    ('icon_128x128@2x.png', 256),
    ('icon_256x256.png', 256),
    ('icon_256x256@2x.png', 512),
    ('icon_512x512.png', 512),
    ('icon_512x512@2x.png', 1024),
]

def create_logo(size):
    """Create EXACT logo: black bg, white 'whycalendar', green 'By Whyed' OVER it."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # Load fonts
    try:
        mono_font = ImageFont.truetype('/System/Library/Fonts/SF-Mono-Bold.otf', int(size * 0.10))
    except:
        try:
            mono_font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', int(size * 0.10))
        except:
            mono_font = ImageFont.load_default()
    
    try:
        script_font = ImageFont.truetype('/System/Library/Fonts/Apple Chancery.ttf', int(size * 0.09))
    except:
        try:
            script_font = ImageFont.truetype('/System/Library/Fonts/SnellRoundhand.ttc', int(size * 0.09))
        except:
            script_font = mono_font
    
    # "whycalendar" in white, centered
    text = 'whycalendar'
    bbox = draw.textbbox((0, 0), text, font=mono_font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) / 2
    y = (size - text_height) / 2  # Center vertically
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=mono_font)
    
    # "By Whyed" in green, script, OVER the text (slightly offset)
    signature = 'By Whyed'
    sig_bbox = draw.textbbox((0, 0), signature, font=script_font)
    sig_width = sig_bbox[2] - sig_bbox[0]
    sig_height = sig_bbox[3] - sig_bbox[1]
    sig_x = (size - sig_width) / 2 - size * 0.05
    sig_y = (size - sig_height) / 2 - size * 0.02
    green = (57, 255, 20, 255)
    draw.text((sig_x, sig_y), signature, fill=green, font=script_font)
    
    return img

def create_rounded_mask(size):
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = size * 0.18
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=255)
    return mask

def process_icon(size):
    logo = create_logo(size)
    mask = create_rounded_mask(size)
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(logo, mask=mask)
    return output

def main():
    print("Creating EXACT logo and generating macOS iconset...")
    os.makedirs(ICONSET_DIR, exist_ok=True)
    
    for filename, size in SIZES:
        img = process_icon(size)
        output_path = os.path.join(ICONSET_DIR, filename)
        img.save(output_path, 'PNG')
        print(f"  Created {filename} ({size}x{size})")
    
    print("\nCreating .icns file...")
    result = subprocess.run(
        ['iconutil', '-c', 'icns', '-o', ICNS_PATH, ICONSET_DIR],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"✓ Successfully created {ICNS_PATH}")
    else:
        print(f"✗ Error: {result.stderr}")
        return 1
    
    for png_name, size in [('32x32.png', 32), ('128x128.png', 128), ('128x128@2x.png', 256)]:
        img = process_icon(size)
        img.save(os.path.join(ICONS_DIR, png_name), 'PNG')
        print(f"  Created {png_name} for Tauri")
    
    subprocess.run(['rm', '-rf', ICONSET_DIR])
    print("Done!")
    return 0

if __name__ == '__main__':
    exit(main())
