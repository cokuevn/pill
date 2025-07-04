#!/usr/bin/env python3
"""
Create PNG icons for the PWA app
"""
import os
import base64
from PIL import Image, ImageDraw
from io import BytesIO

def create_pill_icon(size):
    """Create a simple pill icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin], 
                 fill=(79, 166, 255, 255))  # Blue color
    
    # Pill shape
    pill_margin = size // 4
    pill_width = size - 2 * pill_margin
    pill_height = size // 2
    
    # Draw pill body
    pill_x = pill_margin
    pill_y = (size - pill_height) // 2
    
    # Left semicircle
    draw.ellipse([pill_x, pill_y, pill_x + pill_height, pill_y + pill_height], 
                 fill=(255, 255, 255, 255))
    
    # Right semicircle
    draw.ellipse([pill_x + pill_width - pill_height, pill_y, 
                  pill_x + pill_width, pill_y + pill_height], 
                 fill=(255, 255, 255, 255))
    
    # Middle rectangle
    draw.rectangle([pill_x + pill_height//2, pill_y, 
                    pill_x + pill_width - pill_height//2, pill_y + pill_height], 
                   fill=(255, 255, 255, 255))
    
    # Middle divider line
    line_x = pill_x + pill_width // 2
    draw.line([line_x, pill_y + 4, line_x, pill_y + pill_height - 4], 
              fill=(79, 166, 255, 255), width=2)
    
    return img

def save_icon(size, filename):
    """Save icon as PNG"""
    icon = create_pill_icon(size)
    icon.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # Create icons directory if it doesn't exist
    icons_dir = "/app/frontend/public"
    
    # Create icons
    save_icon(192, os.path.join(icons_dir, "icon-192.png"))
    save_icon(512, os.path.join(icons_dir, "icon-512.png"))
    
    print("Icons created successfully!")