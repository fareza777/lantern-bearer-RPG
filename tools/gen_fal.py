"""Generate one image with fal.ai (FLUX schnell) using the FAL_KEY env var.

Usage: python tools/gen_fal.py <out.png> <prompt-file-or-text>
"""
import json
import os
import sys
import time
import urllib.request

KEY = os.environ.get('FAL_KEY')
if not KEY:
    sys.exit('FAL_KEY is not set')
MODEL = 'fal-ai/flux/schnell'


def req(method, url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method,
                               headers={'Authorization': 'Key ' + KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(r, timeout=120) as resp:
        return json.load(resp)


def main():
    out, prompt = sys.argv[1], sys.argv[2]
    size = sys.argv[3] if len(sys.argv) > 3 else 'square_hd'
    if os.path.exists(prompt):
        prompt = open(prompt, encoding='utf-8').read().strip()
    sub = req('POST', f'https://queue.fal.run/{MODEL}', {
        'prompt': prompt, 'image_size': size, 'num_images': 1, 'enable_safety_checker': True})
    status, resp_url = sub['status_url'], sub['response_url']
    for _ in range(120):
        time.sleep(2)
        st = req('GET', status)
        if st.get('status') == 'COMPLETED':
            break
        if st.get('status') in ('FAILED', 'CANCELLED'):
            sys.exit('generation failed: ' + json.dumps(st)[:300])
    else:
        sys.exit('timed out')
    res = req('GET', resp_url)
    url = res['images'][0]['url']
    with urllib.request.urlopen(url, timeout=120) as r, open(out, 'wb') as f:
        f.write(r.read())
    print('saved', out, os.path.getsize(out))


if __name__ == '__main__':
    main()
