from PIL import Image
import cv2
import numpy as np
import os

base = r"C:\Users\fekadu\Documents\ticketingSystem\frontend\public\images"
src = Image.open(os.path.join(base, "_crops", "hero_only.png")).convert("RGB")
bgr = cv2.cvtColor(np.array(src), cv2.COLOR_RGB2BGR)
h, w = bgr.shape[:2]

# Only the baked search pill (not the bus)
mask = np.zeros((h, w), np.uint8)
cv2.ellipse(mask, (30 + 26, 224), (26, 26), 0, 90, 270, 255, -1)
cv2.rectangle(mask, (56, 198), (540, 250), 255, -1)
cv2.ellipse(mask, (540, 224), (28, 26), 0, -90, 90, 255, -1)
# don't eat the bus nose
mask[:, 575:] = 0
mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=1)

filled = cv2.inpaint(bgr, mask, 4, cv2.INPAINT_TELEA)

rgb = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)
out = Image.fromarray(rgb)
out.save(os.path.join(base, "hero-banner.png"))
out.save(os.path.join(base, "_crops", "hero_search_removed.png"))
print("ok", out.size)
