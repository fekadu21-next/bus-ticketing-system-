from PIL import Image
import os
import cv2
import numpy as np

base = r"C:\Users\fekadu\Documents\ticketingSystem\frontend\public\images"
im = Image.open(os.path.join(base, "image.png")).convert("RGB")

# Hero only: below navbar, above the features strip
hero = im.crop((0, 54, 1024, 352))
hero.save(os.path.join(base, "_crops", "hero_only.png"))
print("hero_only", hero.size)

bgr = cv2.cvtColor(np.array(hero), cv2.COLOR_RGB2BGR)
h, w = bgr.shape[:2]
hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

mask = np.zeros((h, w), np.uint8)

# Dark/navy/blue headline glyphs on the left
left = hsv[:, :560]
dark = (
    (left[:, :, 2] < 140)
    & (left[:, :, 1] > 40)
)
mask[:, :560][dark] = 255

# Expand glyph mask so inpaint covers anti-alias
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
mask = cv2.dilate(mask, kernel, iterations=2)

# White search bar: bright rounded rect around y 210-270, x 20-560
search_roi = gray[195:275, 20:575]
sb = np.zeros_like(gray)
sb[195:275, 20:575] = (search_roi > 210).astype(np.uint8) * 255
sb = cv2.dilate(sb, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)), iterations=2)
mask = cv2.bitwise_or(mask, sb)

# Keep the bus untouched (right side from ~540)
mask[:, 560:] = 0
# Keep sky top-right
mask[:30, :] = 0

cv2.imwrite(os.path.join(base, "_crops", "hero_mask.png"), mask)

filled = cv2.inpaint(bgr, mask, 3, cv2.INPAINT_TELEA)
filled = cv2.inpaint(filled, mask, 3, cv2.INPAINT_NS)

# Slight left brightness so navy type stays readable, without turning it white
vignette = filled.astype(np.float32)
for x in range(0, 480):
    t = 1.0 - (x / 480.0)
    lift = 18 * t * t
    vignette[:, x] = np.clip(vignette[:, x] + lift, 0, 255)
filled = vignette.astype(np.uint8)

rgb = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)
out = Image.fromarray(rgb)
dest = os.path.join(base, "hero-scene.jpg")
out.save(dest, quality=95)
print("wrote", dest)
