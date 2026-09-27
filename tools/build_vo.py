"""Builds narration and cinematic sound effects with the ElevenLabs API.

Reads the API key from the ELEVENLABS_API_KEY environment variable only; the key is never written anywhere.
Clips that already exist in assets/vo are skipped, so re-running only pays for new or deleted clips.

Usage:  python tools/build_vo.py            (build missing clips, then regenerate js/data/vo.js)
        python tools/build_vo.py --dry      (print what would be generated and the character cost)
"""
import base64
import glob
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'vo')
META = os.path.join(OUT, 'meta.json')
VOICE = 'JBFqnCBsd6RMkjVDRZzb'  # "George", warm British storyteller
MODEL = 'eleven_multilingual_v2'
FORMAT = 'mp3_44100_96'
SETTINGS = {'stability': 0.42, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}

# Each narrated clip is one cinematic slide; subtitles are the lines, timed from the API's character alignment.
LINES = {
    'intro1': ['Three hundred years ago, the sun did not rise on its own.',
               'It was sung. Every dawn, from the Cathedral of the Hundred Bells, the Sun-Choir lifted it over the Reach.'],
    'intro2': ['Then, on the last morning, one voice sang the wrong note.',
               'The Bell of First Light cracked from crown to lip... and the sun never rose again.'],
    'intro3': ['From the crack poured the Gloam. Not darkness, but a living dusk.',
               'It drowned the roads. It woke the dead. It hollowed the minds of the living.'],
    'intro4': ['Only Candlemere endures, huddled around the Undying Wick, the last flame that remembers the sun.',
               'And now... the Wick is guttering.'],
    'intro5': ['The Vigil sends Lanternbearers into the dark, each carrying an ember of the Wick.',
               'Four hundred names are carved in the Crypt of the Nameless. None of them reached the Cathedral.'],
    'intro6': ['You wake on the pyre-steps with a lantern in your hand. Your name is all you remember.',
               'The dark is waiting, Lanternbearer. Carry the light.'],
}
# Optional extra clips (e.g. endings) are read from tools/vo_lines.json: {"clip_id": ["line 1", "line 2"], ...}
EXTRA = os.path.join(ROOT, 'tools', 'vo_lines.json')

SFX = {
    'sfx_bell': ('A single enormous ancient cathedral bronze bell tolls once, very deep, with a long shimmering '
                 'reverberating decay in a vast stone hall', 7),
    'sfx_crack': ('A giant bronze bell cracks apart: a sharp metallic splitting crack followed by a deep ominous '
                  'rumble and falling debris, huge reverb', 5),
    'sfx_drone': ('Dark fantasy cinematic ambience: a low ominous drone with a distant wordless choir hum and cold '
                  'wind, slow and mournful, seamless', 22),
}


def key():
    k = os.environ.get('ELEVENLABS_API_KEY')
    if not k:
        sys.exit('ELEVENLABS_API_KEY is not set')
    return k


def post(path, body):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, data=json.dumps(body).encode(),
                                 headers={'xi-api-key': key(), 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def duration(path):
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                             capture_output=True, text=True, timeout=30).stdout.strip()
        return round(float(out), 2)
    except Exception:
        return None


def narrate(cid, lines, prev_text, next_text, meta):
    text = ' '.join(lines)
    body = {'text': text, 'model_id': MODEL, 'voice_settings': SETTINGS}
    if prev_text:
        body['previous_text'] = prev_text
    if next_text:
        body['next_text'] = next_text
    res = json.loads(post(f'/v1/text-to-speech/{VOICE}/with-timestamps?output_format={FORMAT}', body))
    path = os.path.join(OUT, cid + '.mp3')
    with open(path, 'wb') as f:
        f.write(base64.b64decode(res['audio_base64']))
    al = res.get('alignment') or {}
    starts = al.get('character_start_times_seconds') or []
    ends = al.get('character_end_times_seconds') or []
    t, pos = [], 0
    for ln in lines:
        t.append(round(starts[pos], 2) if pos < len(starts) else 0)
        pos += len(ln) + 1
    meta[cid] = {'t': t, 'd': round(ends[-1], 2) if ends else duration(path), 'lines': lines}


def sound(cid, prompt, secs, meta):
    data = post('/v1/sound-generation?output_format=' + FORMAT,
                {'text': prompt, 'duration_seconds': secs, 'prompt_influence': 0.45})
    path = os.path.join(OUT, cid + '.mp3')
    with open(path, 'wb') as f:
        f.write(data)
    meta[cid] = {'d': duration(path) or secs}


def main():
    dry = '--dry' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    meta = json.load(open(META, encoding='utf-8')) if os.path.exists(META) else {}
    lines = dict(LINES)
    if os.path.exists(EXTRA):
        lines.update(json.load(open(EXTRA, encoding='utf-8-sig')))
    ids = list(lines)
    todo = [c for c in ids if not os.path.exists(os.path.join(OUT, c + '.mp3')) or meta.get(c, {}).get('lines') != lines[c]]
    todo_sfx = [c for c in SFX if not os.path.exists(os.path.join(OUT, c + '.mp3'))]
    cost = sum(len(' '.join(lines[c])) for c in todo)
    print('narration clips:', todo, 'chars:', cost, '| sfx:', todo_sfx)
    if dry:
        return
    for c in todo:
        i = ids.index(c)
        same = lambda j: 0 <= j < len(ids) and ids[j].rstrip('0123456789') == c.rstrip('0123456789')
        prev_text = ' '.join(lines[ids[i - 1]]) if same(i - 1) else None
        next_text = ' '.join(lines[ids[i + 1]]) if same(i + 1) else None
        print('narrate', c)
        narrate(c, lines[c], prev_text, next_text, meta)
        json.dump(meta, open(META, 'w', encoding='utf-8'), indent=1)
    for c in todo_sfx:
        print('sfx', c)
        sound(c, SFX[c][0], SFX[c][1], meta)
        json.dump(meta, open(META, 'w', encoding='utf-8'), indent=1)
    known = {os.path.basename(p)[:-4] for p in glob.glob(os.path.join(OUT, '*.mp3'))}
    js = {k: {kk: vv for kk, vv in v.items() if kk != 'lines'} for k, v in meta.items() if k in known}
    with open(os.path.join(ROOT, 'js', 'data', 'vo.js'), 'w', encoding='utf-8') as f:
        f.write('/* Generated by tools/build_vo.py: clip durations and subtitle line start times (seconds). */\n')
        f.write('G.D.VO = ' + json.dumps(js, separators=(',', ':')) + ';\n')
    print('wrote js/data/vo.js with', len(js), 'clips')


if __name__ == '__main__':
    main()
