/* Review sheet for newly completed expansion artwork; independent of the game. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/art-inventory.json'), 'utf8')).assets.filter(a => a.kind !== 'audio');
if (!data.some(a => a.key === 'ironforeman')) data.unshift({ key: 'ironforeman', name: 'The Iron Foreman', kind: 'foe', path: 'assets/foe/ironforeman.webp' });
const esc = text => String(text || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const groups = [...new Set(data.map(a => a.kind))];
const titles = { foe: 'Creatures of the Sunless Dawn', item: 'Weapons & equipment', unique: 'Unique relics', cons: 'Supplies & elixirs', mat: 'Forge materials', qitem: 'Quest relics', rune: 'Runes' };
const sections = groups.map(kind => {
  const assets = data.filter(a => a.kind === kind);
  return `<section id="${kind}"><h2>${titles[kind]} <small>${assets.length}</small></h2><div class="grid ${kind}">${assets.map(a => `<figure><img loading="lazy" src="../../${esc(a.path)}" alt="${esc(a.name)}"><figcaption>${esc(a.name)}<small>${esc(a.key)}</small></figcaption></figure>`).join('')}</div></section>`;
}).join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gloamreach — Act III art review</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:40px 5vw;background:#0b0a10;color:#d5c9b7;font:15px/1.5 Georgia,serif}h1{color:#ddbb7b;font-size:36px;margin:0}header p{color:#a29687}nav{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}a{color:#d7b477}h2{padding-top:26px;border-top:1px solid #393025;font-weight:400}small{font:12px/1.5 system-ui;color:#938778}h2 small{margin-left:12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:12px}.grid.foe{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}figure{margin:0;padding:12px;border:1px solid #342c24;background:radial-gradient(ellipse at 50% 40%,#252029,#100e15 75%);border-radius:8px}img{display:block;width:100%;height:120px;object-fit:contain}.foe img{height:210px}figcaption{text-align:center;font-size:13px;min-height:46px;margin-top:10px}figcaption small{display:block;font-size:10px;overflow-wrap:anywhere}@media(max-width:500px){body{padding:24px 16px}h1{font-size:27px}.grid,.grid.foe{grid-template-columns:repeat(2,minmax(0,1fr))}.foe img{height:170px}}
</style><header><p>GLOAMREACH / ART REVIEW</p><h1>The Sunless Dawn</h1><p>${data.length} new painted assets · transparent WebP · built-in image generation</p><nav>${groups.map(k => `<a href="#${k}">${titles[k]}</a>`).join('')}</nav></header>${sections}</html>`;
const out = path.join(root, 'docs/qa/art-gallery.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log(out);
