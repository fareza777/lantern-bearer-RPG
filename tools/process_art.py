"""Turns raw generated art into transparent WebP game assets.

Usage: python tools/process_art.py <raw_dir> <artmap.txt>
artmap lines:  key=file.png            (single portrait)
               SHEET file.png=k1,...,k9 (3x3 icon sheet, row-major)
"""
import os
import sys

import cv2
import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = {
    'foe': os.path.join(ROOT, 'assets', 'foe'),
    'hero': os.path.join(ROOT, 'assets', 'hero'),
    'items': os.path.join(ROOT, 'assets', 'items'),
}


def load_premul(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if a.ndim == 2:
        a = cv2.cvtColor(a, cv2.COLOR_GRAY2BGR)
    rgb = a[..., :3].astype(np.float32) / 255
    if a.shape[2] == 4:
        al = a[..., 3].astype(np.float32) / 255
        rgb = rgb * al[..., None]
    return rgb


def extract_alpha(rgb, thresh=0.085, holes=False):
    """Background = dark pixels connected to the border. Glows outside the subject keep a luminance alpha.
    holes=True also clears large enclosed near-black areas (e.g. the inside of a necklace loop)."""
    mx = rgb.max(-1)
    dark = mx < thresh
    lab, n = ndimage.label(dark)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bg = np.isin(lab, border)
    if holes and n:
        ids = np.arange(1, n + 1)
        area = ndimage.sum(np.ones_like(mx), lab, ids)
        mean = ndimage.mean(mx, lab, ids)
        bg |= np.isin(lab, ids[(area > 600) & (mean < 0.035)])
    solid = (~bg).astype(np.float32)
    solid = cv2.erode(solid, np.ones((3, 3), np.uint8))
    solid = cv2.GaussianBlur(solid, (0, 0), 1.3)
    glow = np.clip((mx - 0.03) / 0.35, 0, 1) ** 1.1
    return np.maximum(solid, glow), ~bg


def unpremul(rgb, alpha):
    out = np.where(alpha[..., None] > 0.004, rgb / np.maximum(alpha[..., None], 0.004), 0)
    return np.clip(out, 0, 1)


def fit(rgb, alpha, size, pad, anchor='center'):
    ys, xs = np.where(alpha > 0.1)
    if not len(xs):
        raise ValueError('empty image')
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    h, w = alpha.shape
    inner = size - 2 * pad
    s = inner / max(h, w)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    interp = cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC
    rgb = cv2.resize(rgb, (nw, nh), interpolation=interp)
    alpha = cv2.resize(alpha, (nw, nh), interpolation=interp)
    canvas = np.zeros((size, size, 4), np.float32)
    ox = (size - nw) // 2
    oy = size - pad - nh if anchor == 'bottom' else (size - nh) // 2
    canvas[oy:oy + nh, ox:ox + nw, :3] = unpremul(rgb, np.clip(alpha, 0, 1))
    canvas[oy:oy + nh, ox:ox + nw, 3] = np.clip(alpha, 0, 1)
    return canvas


def save(canvas, path, q=86):
    bgra = (np.clip(canvas, 0, 1) * 255 + 0.5).astype(np.uint8)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cv2.imwrite(path, bgra, [cv2.IMWRITE_WEBP_QUALITY, q])


def do_single(key, path):
    rgb = load_premul(path)
    alpha, _ = extract_alpha(rgb)
    if key.startswith('hero_'):
        c = fit(rgb, alpha, 400, 8, 'bottom')
        save(c, os.path.join(OUT['hero'], key[5:] + '.webp'))
    else:
        c = fit(rgb, alpha, 440, 10, 'bottom')
        save(c, os.path.join(OUT['foe'], key + '.webp'))


def do_sheet(path, keys):
    rgb = load_premul(path)
    alpha, solid = extract_alpha(rgb, holes=True)
    H, W = alpha.shape
    # Merge nearby fragments of one object, then assign each blob to the cell containing its centroid.
    blob = cv2.dilate(solid.astype(np.uint8), np.ones((5, 5), np.uint8))
    lab, n = ndimage.label(blob)
    yy, xx = np.mgrid[0:H, 0:W]
    cellid = np.minimum(2, yy * 3 // H) * 3 + np.minimum(2, xx * 3 // W)
    masks = [np.zeros((H, W), bool) for _ in range(9)]
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None:
            continue
        pix = lab[sl] == i
        if pix.sum() < 150:
            continue
        cids = cellid[sl][pix]
        share = np.bincount(cids, minlength=9) / len(cids)
        if (share > 0.12).sum() <= 1:
            masks[int(share.argmax())][sl] |= pix
        else:
            # Objects that touch across cells are split along the grid lines.
            for c in np.where(share > 0.02)[0]:
                masks[c][sl] |= pix & (cellid[sl] == c)
    for idx, key in enumerate(keys):
        if not key or key == '-':
            continue
        m = masks[idx].astype(np.float32)
        if not m.any():
            print('  no blob for', key)
            continue
        m = cv2.GaussianBlur(cv2.dilate(m, np.ones((9, 9), np.uint8)), (0, 0), 4)
        a = alpha * np.clip(m * 1.5, 0, 1)
        c = fit(rgb * np.clip(m * 1.5, 0, 1)[..., None], a, 160, 8)
        save(c, os.path.join(OUT['items'], key + '.webp'), 88)


def main():
    raw, mapfile = sys.argv[1], sys.argv[2]
    for line in open(mapfile, encoding='utf-8'):
        line = line.strip()
        if not line or '=' not in line:
            continue
        left, right = line.split('=', 1)
        if left.startswith('SHEET '):
            f = left[6:].strip()
            print('sheet', f)
            do_sheet(os.path.join(raw, f), [k.strip() for k in right.split(',')])
        else:
            print('single', left)
            do_single(left.strip(), os.path.join(raw, right.strip()))


if __name__ == '__main__':
    main()
