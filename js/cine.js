/* Cinematic player: narrated slides with voice-over, synced subtitles, Ken Burns motion,
   ambient particles and sound stingers. Overrides the basic player from screens.js.
   Slide fields: img (assets/img/<img>.jpg), lines[], vo (assets/vo/<vo>.mp3, timings in G.D.VO),
   pt (ember|mote|void|snow particle kind), sfx [{id, at}] (assets/vo/<id>.mp3). */
(() => {
const S = G.Screens, A = G.Audio, VO = () => G.D.VO || {};

// Intro slides (narration recorded by tools/build_vo.py; text must match the clip lines)
G.D.INTRO = [
  { img: 'c_choir', vo: 'intro1', pt: 'mote', sfx: [{ id: 'sfx_bell', at: 0.6 }],
    lines: ['Three hundred years ago, the sun did not rise on its own.', 'It was sung. Every dawn, from the Cathedral of the Hundred Bells, the Sun-Choir lifted it over the Reach.'] },
  { img: 'c_crack', vo: 'intro2', pt: 'mote', sfx: [{ id: 'sfx_crack', at: 3.1 }],
    lines: ['Then, on the last morning, one voice sang the wrong note.', 'The Bell of First Light cracked from crown to lip... and the sun never rose again.'] },
  { img: 'c_gloam', vo: 'intro3', pt: 'void',
    lines: ['From the crack poured the Gloam. Not darkness, but a living dusk.', 'It drowned the roads. It woke the dead. It hollowed the minds of the living.'] },
  { img: 'c_wick', vo: 'intro4', pt: 'ember',
    lines: ['Only Candlemere endures, huddled around the Undying Wick, the last flame that remembers the sun.', 'And now... the Wick is guttering.'] },
  { img: 'c_bearers', vo: 'intro5', pt: 'ember',
    lines: ['The Vigil sends Lanternbearers into the dark, each carrying an ember of the Wick.', 'Four hundred names are carved in the Crypt of the Nameless. None of them reached the Cathedral.'] },
  { img: 'c_wake', vo: 'intro6', pt: 'ember',
    lines: ['You wake on the pyre-steps with a lantern in your hand. Your name is all you remember.', 'The dark is waiting, Lanternbearer. Carry the light.'] },
];

// Narration clip ids per ending slide (index-aligned with G.D.ENDINGS slides; ring gets its epilogue slide)
S.ENDING_VO = {
  ring: ['end_ring1', 'end_ring2', 'end_ring3', 'end_ring4'],
  silence: ['end_silence1', 'end_silence2', 'end_silence3'],
  ember: ['end_ember1', 'end_ember2', 'end_ember3', 'end_ember4'],
  hunger: ['end_hunger1', 'end_hunger2', 'end_hunger3', 'end_hunger4'],
  everlight: ['end_everlight1', 'end_everlight2', 'end_everlight3', 'end_everlight4'],
  longnight: ['end_longnight1', 'end_longnight2', 'end_longnight3', 'end_longnight4'],
  sunface: ['end_sunface1', 'end_sunface2', 'end_sunface3', 'end_sunface4'],
};

S.cine = {
  st: null,

  render() {
    return `<div class="intro letterbox" data-a="cineTap" data-silent="1">
      <div class="bg" id="cbg1"></div><div class="bg" id="cbg2"></div>
      <div class="cfx" id="cfx"></div>
      <div class="cvig"></div>
      <div class="txt" id="ctxt"></div>
      <div class="cprog" id="cprog"></div>
      <button class="btn small ghost skip" data-a="cineSkip" style="z-index:5">Skip</button>
      <div class="tapnext" style="z-index:5">tap to continue</div>
    </div>`;
  },

  // AudioContext time pauses when the tab is hidden, so the show survives backgrounding
  t() { return A.ctx ? A.ctx.currentTime : performance.now() / 1000; },

  after(p) {
    const slides = p.slides.map((sl, i) => {
      const m = p.voMap && p.voMap[i];
      return m && VO()[m] && !sl.vo ? Object.assign({}, sl, { vo: m }) : sl;
    });
    this.st = { slides, i: -1, timers: [], parts: [], done: p.done, flip: false, voice: null, drone: null, sfx: [], t0: 0, dur: 0 };
    if (p.drone) {
      A.stopAmbient(1.2);
      A.loadClip('assets/vo/sfx_drone.mp3').then(b => {
        if (this.st) this.st.drone = A.playClip(b, { loop: true, vol: 0.5, fadeIn: 2, bus: A.music });
      }).catch(() => {});
    } else if (p.music) A.ambient(p.music);
    slides.forEach(sl => { if (sl.vo) A.loadClip(`assets/vo/${sl.vo}.mp3`).catch(() => {}); });
    this.progress();
    this.next();
  },

  progress() {
    const el = document.getElementById('cprog'), st = this.st;
    if (el && st) el.innerHTML = st.slides.map((s, i) => `<i class="${i < st.i ? 'done' : i === st.i ? 'cur' : ''}"></i>`).join('');
  },

  at(ms, fn) { this.st.timers.push(setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, Math.max(0, ms))); },

  clear() {
    const st = this.st; if (!st) return;
    st.timers.forEach(clearTimeout); st.timers = [];
    st.parts.forEach(p => p.remove()); st.parts = [];
    if (st.voice) { st.voice.stop(0.3); st.voice = null; }
    st.sfx.forEach(h => h.stop(0.1)); st.sfx = [];
    this.duck(false);
  },

  duck(on) {
    if (!A.ctx || !A.music || (this.st && this.st.drone)) return;
    const base = (G.settings.music != null ? G.settings.music : 0.6) * 0.9, now = A.ctx.currentTime;
    A.music.gain.cancelScheduledValues(now);
    A.music.gain.setValueAtTime(A.music.gain.value, now);
    A.music.gain.linearRampToValueAtTime(on ? base * 0.3 : base, now + 0.5);
  },

  next() {
    const st = this.st; if (!st) return;
    this.clear();
    st.i++;
    if (st.i >= st.slides.length) return this.finish();
    this.progress();
    const sl = st.slides[st.i];

    // Crossfade backgrounds, alternate Ken Burns direction
    st.flip = !st.flip;
    const a = document.getElementById(st.flip ? 'cbg1' : 'cbg2'), b = document.getElementById(st.flip ? 'cbg2' : 'cbg1');
    if (!a) return;
    a.className = 'bg kb' + (st.i % 4);
    a.style.backgroundImage = `url(assets/img/${sl.img}.jpg)`;
    void a.offsetWidth;
    a.classList.add('on'); b.classList.remove('on');

    const txt = document.getElementById('ctxt');
    txt.innerHTML = sl.lines.map(l => `<p>${l}</p>`).join('');
    const ps = [...txt.querySelectorAll('p')];
    st.ps = ps;

    st.t0 = this.t();
    const meta = sl.vo && VO()[sl.vo];

    const showSubs = starts => ps.forEach((pe, k) => this.at(((starts[k] != null ? starts[k] : k * 2) + 0.15) * 1000, () => pe.classList.add('on')));
    const scheduleEnd = dur => { st.dur = dur; this.at((dur + 1.6) * 1000, () => this.next()); };
    const textOnly = () => {
      if (this.st !== st || st.slides[st.i] !== sl) return;
      let duration = 0;
      const starts = sl.lines.map(line => {
        const start = duration;
        duration += Math.max(2.6, line.trim().split(/\s+/).length * 0.3);
        return start;
      });
      showSubs(starts); scheduleEnd(duration + 1.2);
    };

    (sl.sfx || []).forEach(s => A.loadClip(`assets/vo/${s.id}.mp3`).then(bf => {
      if (this.st === st && st.slides[st.i] === sl) st.sfx.push(A.playClip(bf, { delay: Math.max(0, s.at - (this.t() - st.t0)), vol: 0.9 }));
    }).catch(() => {}));

    if (sl.vo) {
      A.loadClip(`assets/vo/${sl.vo}.mp3`).then(buf => {
        if (this.st !== st || st.slides[st.i] !== sl) return;
        st.voice = A.playClip(buf, { bus: A.voice, vol: 1 });
        this.duck(true);
        const d = meta && meta.d ? meta.d : buf.duration;
        showSubs(meta && meta.t ? meta.t : []);
        scheduleEnd(d);
        this.at(d * 1000 + 300, () => this.duck(false));
      }).catch(textOnly);
    } else {
      textOnly();
    }

    if (sl.pt) this.particles(sl.pt);
  },

  particles(kind) {
    const st = this.st, host = document.getElementById('cfx');
    if (!host) return;
    const spawn = () => {
      if (this.st !== st || st.parts.length > 26) return;
      const p = document.createElement('i');
      p.className = 'cp ' + kind;
      p.style.left = G.U.rand(2, 98) + '%';
      p.style.animationDuration = G.U.rand(5, 11) + 's';
      p.style.animationDelay = '0s';
      const s = G.U.rand(2, 5); p.style.width = p.style.height = s + 'px';
      p.addEventListener('animationend', () => { p.remove(); const i = st.parts.indexOf(p); if (i >= 0) st.parts.splice(i, 1); });
      host.appendChild(p); st.parts.push(p);
    };
    for (let i = 0; i < 10; i++) this.at(i * 300, spawn);
    const tick = () => { if (this.st === st && document.getElementById('cfx')) { spawn(); this.at(450, tick); } };
    this.at(450, tick);
  },

  finish() {
    const st = this.st; if (!st) return;
    this.clear();
    if (st.drone) st.drone.stop(1.5);
    const d = st.done; this.st = null;
    d && d();
  },

  leave() {
    if (this.st) { if (this.st.drone) this.st.drone.stop(0.5); this.clear(); }
    this.st = null;
    this.duck(false);
  },
};

G.A.cineTap = () => {
  const st = S.cine.st; if (!st) return;
  const hidden = (st.ps || []).filter(p => !p.classList.contains('on'));
  if (hidden.length) hidden.forEach(p => p.classList.add('on'));
  else S.cine.next();
};
G.A.cineSkip = () => { const st = S.cine.st; if (!st) return; S.cine.finish(); };

S.playIntro = done => G.UI.go('cine', { slides: G.D.INTRO, done, drone: true, music: null });

const oldEnding = S.playEnding;
S.playEnding = kind => {
  const E = G.D.ENDINGS[kind];
  if (!E) { G.UI.go('town'); return; }
  // endings beyond the first are tracked in `ended2` so the first ending's flag keeps its old meaning
  if (['everlight', 'longnight', 'sunface'].includes(kind)) G.S.flags.ended3 = kind;
  else if (G.S.flags.ended) G.S.flags.ended2 = kind; else G.S.flags.ended = kind;
  G.S.flags['end_' + kind] = true;
  G.Engine.save();
  const slides = E.slides.slice();
  if (kind === 'ring') slides.push({ img: 'keyart', lines: ['...and you wake on the pyre-steps of Candlemere, lantern in hand.', 'Your name is all you remember. Somewhere far below, a new darkness is stirring.'] });
  G.UI.go('cine', { slides, music: 'ending', voMap: S.ENDING_VO[kind], done: () => G.UI.go('credits', { kind }) });
};
})();
