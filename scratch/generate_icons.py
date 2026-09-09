import os
import math
from PIL import Image, ImageDraw, ImageFilter

out_dir = r"c:\xampp\htdocs\Vape Website\assets\images\icons"
os.makedirs(out_dir, exist_ok=True)

def create_pwa_icon(size, is_maskable=False):
    # Oversample 4x for super crisp antialiasing
    scale = 4
    img_size = size * scale
    img = Image.new("RGBA", (img_size, img_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = img_size / 2
    cy = img_size / 2

    # Background
    bg_color = (7, 10, 15, 255) # #070A0F deep obsidian
    if is_maskable:
        # Full bleed for maskable icons
        draw.rectangle([0, 0, img_size, img_size], fill=bg_color)
    else:
        # Sleek squircle / rounded rect for standard icons
        corner_r = int(img_size * 0.22)
        draw.rounded_rectangle([0, 0, img_size, img_size], radius=corner_r, fill=bg_color)

    # Subtle concentric radial emerald glow
    glow_color = (0, 229, 153) # #00E599
    glow_radii = [0.42, 0.36, 0.28]
    glow_alphas = [14, 25, 45]
    for r_ratio, alpha in zip(glow_radii, glow_alphas):
        r = img_size * r_ratio
        glow_layer = Image.new("RGBA", (img_size, img_size), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_layer)
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*glow_color, alpha))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=int(r * 0.25)))
        img = Image.alpha_composite(img, glow_layer)
        draw = ImageDraw.Draw(img)

    # Outer luxury gold/cyan border ring on standard icon
    if not is_maskable:
        border_box = [int(scale * 4), int(scale * 4), img_size - int(scale * 4), img_size - int(scale * 4)]
        draw.rounded_rectangle(border_box, radius=int(img_size * 0.20), outline=(0, 229, 153, 45), width=int(scale * 2))

    # Lightning Bolt Coordinates (viewBox 0 0 24 24 mapped to target)
    # Path: M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2z
    # Scale factor for bolt: for maskable icons, keep within 65% safe zone
    bolt_scale = 0.52 if is_maskable else 0.58
    target_h = img_size * bolt_scale
    
    # Original bounds: x: 4.5..19 (w=14.5), y: 2..22 (h=20)
    # Center of original: x_center = (4.5+19)/2 = 11.75, y_center = (2+22)/2 = 12
    orig_points = [
        (13.0, 2.0),
        (4.5, 13.5),
        (11.0, 13.5),
        (9.5, 22.0),
        (19.0, 9.5),
        (12.5, 9.5),
        (13.0, 2.0)
    ]
    
    s = target_h / 20.0
    ox = cx - 11.75 * s
    oy = cy - 12.0 * s

    scaled_points = [(ox + px * s, oy + py * s) for px, py in orig_points]

    # Bolt Shadow / Ambient Glow
    bolt_glow = Image.new("RGBA", (img_size, img_size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bolt_glow)
    bg_draw.polygon(scaled_points, fill=(0, 229, 153, 160))
    bolt_glow = bolt_glow.filter(ImageFilter.GaussianBlur(radius=int(scale * 7)))
    img = Image.alpha_composite(img, bolt_glow)
    draw = ImageDraw.Draw(img)

    # Primary Sharp Lightning Bolt
    draw.polygon(scaled_points, fill=(0, 229, 153, 255))

    # Inner Core Gradient / Highlight (slightly brighter upper-right)
    # Highlight facet
    facet_points = [
        scaled_points[0], # (13, 2)
        scaled_points[4], # (19, 9.5)
        scaled_points[5], # (12.5, 9.5)
        scaled_points[0]
    ]
    draw.polygon(facet_points, fill=(180, 255, 230, 230))

    # Downsample using Lanczos
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Generate all icons
sizes = {
    "icon-192.png": (192, False),
    "icon-512.png": (512, False),
    "icon-maskable-192.png": (192, True),
    "icon-maskable-512.png": (512, True),
    "apple-touch-icon.png": (180, False),
    "favicon-32.png": (32, False),
}

for filename, (sz, maskable) in sizes.items():
    filepath = os.path.join(out_dir, filename)
    icon = create_pwa_icon(sz, is_maskable=maskable)
    icon.save(filepath, "PNG")
    print(f"Generated {filepath} ({sz}x{sz}, maskable={maskable})")

print("All PWA icons successfully generated!")
