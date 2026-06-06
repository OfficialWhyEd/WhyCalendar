#!/usr/bin/env python3
"""Generate macOS iconset using Pillow and create .icns file."""

import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Paths
ICONSET_DIR = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons', 'icon.iconset')
ICNS_PATH = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons', 'icon.icns')

# Required sizes for macOS iconset
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

def create_icon(size):
    """Create a single icon image at the given size."""
    # Create black background with rounded corners
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Draw rounded rectangle background
    draw = ImageDraw.Draw(img)
    radius = size * 0.18
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=(0, 0, 0, 255)
    )
    
    # Try to load fonts
    try:
        # Use system fonts
        mono_font = ImageFont.truetype("/System/Library/Fonts/SF-Mono-Regular.otf", int(size * 0.12))
        mono_font_bold = ImageFont.truetype("/System/Library/Fonts/SF-Mono-Bold.otf", int(size * 0.12))
    except:
        try:
            mono_font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", int(size * 0.12))
            mono_font_bold = mono_font
        except:
            mono_font = ImageFont.load_default()
            mono_font_bold = mono_font
    
    try:
        script_font = ImageFont.truetype("/System/Library/Fonts/Apple Chancery.ttf", int(size * 0.1))
    except:
        try:
            script_font = ImageFont.truetype("/System/Library/Fonts/SnellRoundhand.ttc", int(size * 0.1))
        except:
            script_font = mono_font
    
    # Draw "whycalendar" text
    text = "whycalendar"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=mono_font_bold)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center text horizontally, position at ~45% from top
    x = (size - text_width) / 2
    y = size * 0.42 - text_height / 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=mono_font_bold)
    
    # Draw "By Whyed" signature in green
    signature = "By Whyed"
    sig_bbox = draw.textbbox((0, 0), signature, font=script_font)
    sig_width = sig_bbox[2] - sig_bbox[0]
    sig_height = sig_bbox[3] - sig_bbox[1]
    
    sig_x = (size - sig_width) / 2
    sig_y = size * 0.62 - sig_height / 2
    
    # Green color (#39FF14)
    green = (57, 255, 20, 255)
    draw.text((sig_x, sig_y), signature, fill=green, font=script_font)
    
    # Draw decorative underline
    line_y = sig_y + sig_height + size * 0.02
    line_start_x = size * 0.25
    line_end_x = size * 0.75
    draw.line(
        [(line_start_x, line_y), (line_end_x, line_y)],
        fill=(57, 255, 20, 150),
        width=max(1, size // 200)
    )
    
    return img

def main():
    print("Generating macOS iconset...")
    
    # Create iconset directory
    os.makedirs(ICONSET_DIR, exist_ok=True)
    
    # Generate each size
    for filename, size in SIZES:
        img = create_icon(size)
        output_path = os.path.join(ICONSET_DIR, filename)
        img.save(output_path, 'PNG')
        print(f"  Created {filename} ({size}x{size})")
    
    # Create .icns using iconutil
    print("\nCreating .icns file...")
    result = subprocess.run(
        ['iconutil', '-c', 'icns', '-o', ICNS_PATH, ICONSET_DIR],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"✓ Successfully created {ICNS_PATH}")
    else:
        print(f"✗ Error creating .icns: {result.stderr}")
        return 1
    
    # Clean up iconset directory
    subprocess.run(['rm', '-rf', ICONSET_DIR])
    print("Cleaned up iconset directory")
    
    return 0

if __name__ == '__main__':
    exit(main())
