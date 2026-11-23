"""Render the existing BV lettermark; requires Pillow and Arial Bold on macOS."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[1]
for name, size in [('bv-192.png',192),('bv-512.png',512),('bv-maskable-512.png',512),('apple-touch-icon.png',180)]:
    scale = 4
    image = Image.new('RGB', (size*scale,size*scale), '#0E2D69')
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', round(size*scale*.37))
    bounds = draw.textbbox((0,0),'BV',font=font)
    draw.text(((size*scale-(bounds[2]-bounds[0]))/2-bounds[0],(size*scale-(bounds[3]-bounds[1]))/2-bounds[1]),'BV',font=font,fill='white')
    image.resize((size,size),Image.Resampling.LANCZOS).save(root/'public'/'icons'/name)
