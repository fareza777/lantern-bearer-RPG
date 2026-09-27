/* Procedural audio: ambient drones, bells and SFX. No audio files needed (fully offline). */
G.Audio = {
  ctx: null, master: null, music: null, sfxBus: null, amb: null, ambKind: null, bellTimer: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain(); this.music.connect(this.master);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(this.master);
    this.voice = this.ctx.createGain(); this.voice.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    this.applyVolumes();
    if (this.pendingKind) { const k = this.pendingKind; this.pendingKind = null; this.ambient(k); }
  },

  applyVolumes() {
    if (!this.ctx) return;
    const s = G.settings || { music: 0.6, sfx: 0.8 };
    this.music.gain.value = s.music * 0.9;
    this.sfxBus.gain.value = s.sfx;
    this.voice.gain.value = s.voice != null ? s.voice : 1;
  },

  stopAmbient(fade) {
    this.ambKind = null;
    clearInterval(this.bellTimer);
    if (!this.amb || !this.ctx) return;
    const old = this.amb, now = this.ctx.currentTime;
    this.amb = null;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + (fade || 1.5));
    setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), (fade || 1.5) * 1000 + 200);
  },

  // Recorded clips (narration, cinematic stingers). Decoded buffers are cached per URL.
  clips: {},
  loadClip(url) {
    if (!this.ctx) return Promise.reject(new Error('no audio'));
    if (!this.clips[url]) {
      this.clips[url] = fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((ok, no) => this.ctx.decodeAudioData(b, ok, no)));
      this.clips[url].catch(() => { delete this.clips[url]; });
    }
    return this.clips[url];
  },
  playClip(buf, opt) {
    opt = opt || {};
    const ctx = this.ctx, s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; s.loop = !!opt.loop;
    const t = ctx.currentTime + (opt.delay || 0), v = opt.vol != null ? opt.vol : 1;
    if (opt.fadeIn) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + opt.fadeIn); } else g.gain.value = v;
    s.connect(g); g.connect(opt.bus || this.sfxBus); s.start(t);
    return {
      src: s, gain: g,
      stop(fade) {
        const n = ctx.currentTime, f = fade || 0.25;
        try { g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + f); s.stop(n + f + 0.05); } catch (e) {}
      },
    };
  },

  AMB: {
    menu: { base: 49, det: 0.4, cut: 380, bells: 9000, scale: [0, 3, 7, 10], noise: 0.05 },
    town: { base: 65.4, det: 0.3, cut: 520, bells: 7000, scale: [0, 3, 5, 7, 10], noise: 0.03 },
    dungeon: { base: 41.2, det: 0.6, cut: 300, bells: 11000, scale: [0, 1, 5, 6], noise: 0.08 },
    combat: { base: 55, det: 1.2, cut: 650, bells: 2600, scale: [0, 1, 3, 6], noise: 0.05, pulse: true },
    boss: { base: 36.7, det: 1.8, cut: 700, bells: 1800, scale: [0, 1, 6, 7], noise: 0.07, pulse: true },
    ending: { base: 73.4, det: 0.2, cut: 900, bells: 3500, scale: [0, 4, 7, 11, 14], noise: 0.02 },
  },

  ambient(kind) {
    if (!this.ctx) { this.pendingKind = kind; return; }
    if (this.ambKind === kind) return;
    this.ambKind = kind;
    const ctx = this.ctx, now = ctx.currentTime, cfg = this.AMB[kind] || this.AMB.menu;
    if (this.amb) {
      const old = this.amb;
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 1.5);
      setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1700);
    }
    clearInterval(this.bellTimer);
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(this.music);
    gain.gain.linearRampToValueAtTime(0.5, now + 2.5);
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = cfg.cut; filt.Q.value = 3; filt.connect(gain);
    const nodes = [];
    [1, 1.5, 2].forEach((mul, i) => {
      const o = ctx.createOscillator(); o.type = i === 1 ? 'triangle' : 'sawtooth';
      o.frequency.value = cfg.base * mul; o.detune.value = (i - 1) * cfg.det * 10;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 0.16 : 0.07; o.connect(g); g.connect(filt); o.start(); nodes.push(o);
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.pulse ? 1.6 : 0.07;
    const lg = ctx.createGain(); lg.gain.value = cfg.pulse ? cfg.cut * 0.5 : cfg.cut * 0.35; lfo.connect(lg); lg.connect(filt.frequency); lfo.start(); nodes.push(lfo);
    const ns = ctx.createBufferSource(); ns.buffer = this.noiseBuf; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 500; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = cfg.noise; ns.connect(nf); nf.connect(ng); ng.connect(gain); ns.start(); nodes.push(ns);
    this.amb = { gain, nodes };
    const bell = () => {
      if (this.ambKind !== kind) return;
      const semi = G.U.pick(cfg.scale) + G.U.pick([12, 24, 24, 36]);
      this.bell(cfg.base * Math.pow(2, semi / 12), 0.06, 4 + Math.random() * 3, this.music);
    };
    this.bellTimer = setInterval(bell, cfg.bells);
    setTimeout(bell, 1200);
  },

  bell(freq, vol, dur, dest) {
    if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    [1, 2.76, 5.4, 8.93].forEach((p, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * p;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol / (i + 1), now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur / (i * 0.6 + 1));
      o.connect(g); g.connect(dest || this.sfxBus); o.start(now); o.stop(now + dur);
    });
  },

  tone(freq, dur, type, vol, slide) {
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(now); o.stop(now + dur + 0.02);
  },

  noise(dur, freq, vol, q) {
    const ctx = this.ctx, now = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus); s.start(now, Math.random()); s.stop(now + dur);
  },

  sfx(name) {
    if (!this.ctx) return;
    try {
      switch (name) {
        case 'click': this.tone(520, 0.05, 'triangle', 0.08); break;
        case 'step': this.noise(0.18, 220, 0.25, 2); break;
        case 'hit': this.noise(0.16, 900, 0.6, 0.8); this.tone(140, 0.12, 'square', 0.12, 60); break;
        case 'crit': this.noise(0.25, 1400, 0.7, 0.6); this.tone(220, 0.25, 'sawtooth', 0.15, 50); break;
        case 'miss': this.noise(0.2, 2400, 0.25, 3); break;
        case 'hurt': this.tone(180, 0.25, 'sawtooth', 0.18, 70); this.noise(0.15, 500, 0.4); break;
        case 'spell': this.tone(300, 0.4, 'sine', 0.15, 900); this.noise(0.35, 3000, 0.15, 4); break;
        case 'fire': this.noise(0.5, 700, 0.5, 0.5); this.tone(90, 0.4, 'sawtooth', 0.1, 40); break;
        case 'holy': this.bell(660, 0.18, 1.8); break;
        case 'heal': [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'sine', 0.12), i * 80)); break;
        case 'gold': [1200, 1600].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.1), i * 60)); break;
        case 'loot': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.1), i * 70)); break;
        case 'rare': this.bell(880, 0.15, 2.5); setTimeout(() => this.bell(1320, 0.1, 2), 120); break;
        case 'levelup': [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.bell(f, 0.14, 2.2), i * 140)); break;
        case 'death': this.tone(110, 2.2, 'sawtooth', 0.2, 30); this.bell(98, 0.2, 5); break;
        case 'door': this.noise(0.6, 150, 0.4, 1); this.tone(70, 0.5, 'triangle', 0.15, 45); break;
        case 'dread': this.tone(60, 1.2, 'sawtooth', 0.12, 45); this.tone(64, 1.2, 'sawtooth', 0.1, 47); break;
        case 'bell': this.bell(196, 0.25, 5); break;
        case 'error': this.tone(160, 0.15, 'square', 0.08); break;
        case 'buy': this.tone(900, 0.08, 'triangle', 0.1); setTimeout(() => this.tone(1300, 0.1, 'triangle', 0.1), 60); break;
        case 'forge': this.noise(0.12, 3000, 0.5, 2); this.tone(1800, 0.4, 'sine', 0.08); break;
      }
    } catch (e) {}
  },
};
