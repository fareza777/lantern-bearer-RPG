"""Package imagegen output for the game without removing its alpha channel.

Usage: python tools/install-generated-art.py source.png assets/foe/id.webp
Only format conversion and proportional sizing; no creative image edits.
"""
from pathlib import Path
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
target = (root / sys.argv[2]).resolve()
if not target.is_relative_to(root / 'assets'):
    raise ValueError('Destination must be within project assets')
if target.exists():
    raise FileExistsError(target)
size = 440 if target.parent.name == 'foe' else 160
with Image.open(source) as original:
    artwork = original.convert('RGBA')
    artwork.thumbnail((size - 16, size - 16), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size))
    canvas.paste(artwork, ((size - artwork.width) // 2, (size - artwork.height) // 2))
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, 'WEBP', quality=90, method=6)
print(str(target))
