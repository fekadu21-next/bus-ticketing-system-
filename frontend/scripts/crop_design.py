from PIL import Image
import os

src = r"C:\Users\fekadu\Documents\ticketingSystem\frontend\public\images\image.png"
base = r"C:\Users\fekadu\Documents\ticketingSystem\frontend\public\images"
im = Image.open(src)

ops = [
    ("selam-bus.png", (42, 610, 253, 672)),
    ("abay-association.png", (280, 610, 491, 672)),
    ("gebeya-bus.png", (518, 610, 729, 672)),
    ("mekelle-transport.png", (756, 610, 967, 672)),
]
for name, box in ops:
    im.crop(box).save(os.path.join(base, "operators", name))
    print(name, im.crop(box).size)

phones = im.crop((322, 800, 706, 1070))
phones.save(os.path.join(base, "mobile-app-mockup.png"))
print("phones", phones.size)
