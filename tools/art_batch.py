# -*- coding: utf-8 -*-
"""Batch art generator (fal.ai FLUX via gen_fal.py) + processing into game assets, run in parallel.

Usage: python tools/art_batch.py jobs.json [--force] [--workers N]
jobs.json: [{"key": "...", "type": "hero|foe|icon|zone|cine", "prompt": "full prompt text"}, ...]
Outputs: hero -> assets/hero/<key>.webp (400px), foe -> assets/foe/<key>.webp (440px), icon -> assets/items/<key>.webp (160px),
zone -> assets/img/<key>.jpg (900x600 cover), cine -> assets/img/<key>.jpg (720x1280 cover). Existing outputs are skipped unless --force.
Requires FAL_KEY in the environment.
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import process_art as pa  # noqa: E402

ROOT = os.path.dirname(HERE)
RAW = os.path.join(os.environ.get('TEMP', HERE), 'gloamtest', 'raw_act3')
os.makedirs(RAW, exist_ok=True)


def out_path(job):
    k, t = job['key'], job['type']
    if t == 'hero':
        return os.path.join(ROOT, 'assets', 'hero', k + '.webp')
    if t == 'foe':
        return os.path.join(ROOT, 'assets', 'foe', k + '.webp')
    if t == 'icon':
        return os.path.join(ROOT, 'assets', 'items', k + '.webp')
    return os.path.join(ROOT, 'assets', 'img', k + '.jpg')


def cover(a, tw, th):
    h, w = a.shape[:2]
    s = max(tw / w, th / h)
    a = cv2.resize(a, (round(w * s) + 1, round(h * s) + 1), interpolation=cv2.INTER_AREA)
    h, w = a.shape[:2]
    x, y = (w - tw) // 2, (h - th) // 2
    return a[y:y + th, x:x + tw]


def gen(job):
    key, t = job['key'], job['type']
    size = {'zone': 'landscape_4_3', 'cine': 'portrait_16_9'}.get(t, 'square_hd')
    raw = os.path.join(RAW, key + '.png')
    for attempt in range(4):
        try:
            subprocess.run([sys.executable, os.path.join(HERE, 'gen_fal.py'), raw, job['prompt'], size],
                           check=True, timeout=420, capture_output=True)
            break
        except Exception as e:
            print('retry', key, attempt, str(e)[:80], flush=True)
    else:
        print('FAILED', key, flush=True)
        return
    try:
        if t == 'hero':
            rgb = pa.load_premul(raw)
            alpha, _ = pa.extract_alpha(rgb)
            pa.save(pa.fit(rgb, alpha, 400, 8, 'bottom'), out_path(job))
        elif t == 'foe':
            pa.do_single(key, raw)
        elif t == 'icon':
            rgb = pa.load_premul(raw)
            alpha, _ = pa.extract_alpha(rgb, holes=True)
            pa.save(pa.fit(rgb, alpha, 160, 8), out_path(job), 88)
        else:
            a = cv2.imread(raw)
            tw, th = (900, 600) if t == 'zone' else (720, 1280)
            cv2.imwrite(out_path(job), cover(a, tw, th), [cv2.IMWRITE_JPEG_QUALITY, 82])
        print('ok', key, flush=True)
    except Exception as e:
        print('PROCESS-FAILED', key, str(e)[:100], flush=True)


def main():
    jobs = json.load(open(sys.argv[1], encoding='utf-8-sig'))
    force = '--force' in sys.argv
    workers = 4
    if '--workers' in sys.argv:
        workers = int(sys.argv[sys.argv.index('--workers') + 1])
    todo = [j for j in jobs if force or not os.path.exists(out_path(j))]
    print('jobs', len(jobs), 'todo', len(todo), flush=True)
    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(gen, todo))
    print('DONE', flush=True)


if __name__ == '__main__':
    main()
