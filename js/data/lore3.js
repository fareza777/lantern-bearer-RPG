/* Act III: The Sunless Dawn. Additive world text: intro, tips, NPCs, rumors, codex, endings.
   Codex entries marked quest:true stay out of the random-lore pool (spoiler-sensitive); grant them from events or quests. */
G.D.INTRO3 = [
  { img: 'c_noon', lines: ['You wake at dusk in Candlemere, as you have every dusk since the Heart went quiet.', 'At midday the sky opens like an eye, and a black sun looks down at the town.'] },
  { img: 'c_lamps', lines: ['Nine Lamplighters once drowned a hungry sun beneath a lid of darkness, and called it the Gloam.', 'You were told the dark was the enemy. You were told wrong.'] },
  { img: 'c_key', lines: ['Every lantern in the Reach is a splinter of that sun\'s eye, forged by a single hammer.', 'And every Lanternbearer wears a hood, because someone must be the Key.'] },
  { img: 'zone9', lines: ['Below the Black Noon, the Drowned Observatory still turns its stars under the water.', 'Someone down there has been counting the days until the lid comes off.'] },
  { img: 'keyart', lines: ['Maelis sends you down once more, and this time she will not say why.', 'Your face is the one thing you cannot remember. It is the last thing you will find.'] },
];

G.D.TIPS.forge = { t: 'The Ember Forge', d: 'Vashti Coil\'s forge turns <b>materials</b> into tier-5 gear, potions and runes. Bring <b>Ember Ore</b>, <b>Starglass</b>, <b>Sunsteel</b>, <b>Voidsilk</b> and <b>Lamp Resin</b> from the deep zones. You can also socket <b>runes</b> and reforge items here.' };

G.D.NPCS.vashti = { n: 'Vashti Coil', title: 'Keeper of the Ember Forge', greet: ['"Bring me ore. Do not bring me feelings. The forge cannot eat feelings."', '"That hammer\'s older than the Vigil. It still works better than most of you."', '"Everything I make will outlive you. I try not to take it personally."'] };

G.D.RUMORS.push(
  'Hesk mutters into a mug: "At midday, everyone looks up, and everyone swears the sun blinked. Nobody talks about it after."',
  'A gate guard whispers: "The black sun does not move. It watches. Stand under it long enough and your shadow starts to point at it."',
  'Vashti Coil taps the anvil: "If you find Sunsteel, bring it to me. If you find a hammer that hums, run."',
  'Marrow: "The astronomers of the Observatory wrote down every star, every night, until the night the stars wrote back."',
  'Tamsin: "Glass walkers do not chase you. They walk to where you were standing, and then wait for you to come back."',
  'Hesk: "The Lamplighters had nine chairs. Anyone will tell you that. Nobody says who sat in the ninth."',
  'A Lanternbearer, hood down over a tin lantern: "I looked through a lens down there and my lantern was made of eye. I have kept it in my pack ever since."',
  'Wren: "Moth silk heals if you sleep in it. Do not sleep in it near the Warren. The Warren sleeps in you."',
  'Caddoc: "The faceless ones below wear our hoods and carry our lanterns. I try not to think about why they look so familiar."',
  'Hesk: "Every night at the Wick, one of the dimmer candles goes out for no reason. The next day, a Lanternbearer does not come home."',
  'Orla: "A hammer\'s honest. It does not care what it forges, only that it forges. That is not always a comfort."',
  'An old warden coughs: "They say the sun that hangs over us is not dead. It is waiting. I have never been more afraid of a word."',
);

Object.assign(G.D.CODEX, {
  // ---- Regions ----
  mines: { n: 'The Weeping Mines', cat: 'Regions', txt: 'A Vigil mine beneath the Mire, sunk to reach ember-ore for the Lanternsmiths. The shafts flooded slowly, and the foreman kept the shift-bell ringing long after the tunnels were black. The miners still answer it.' },
  warren: { n: 'The Moth Warren', cat: 'Regions', txt: 'A hive of grey chambers off the Court road, lined with silk and dust. The Wick-Moths that drink lantern-light nest here by the thousand, sleeping in the same slow rhythm, as if something enormous were breathing for them.' },
  observatory: { n: 'The Drowned Observatory', cat: 'Regions', txt: 'The tower where the Lamplighters watched the old sun sleep. The sea rose through its foundations on the last night of the Nine. Its brass stars still turn under black water, and some of its lenses are still watching.' },
  cinderwaste: { n: 'The Cinderwaste', cat: 'Regions', txt: 'A desert of fused glass where the old sun once touched the ground. The dunes are lenses, the wind is heat that has forgotten where it came from, and the glass graves hold everyone who tried to cross before the dark came.' },
  ninelamps: { n: 'The Hall of Nine Lamps', cat: 'Regions', txt: 'The seat of the Lamplighters: nine chairs around nine lamps, in a hall built to hold a light that was never meant to go out. Eight lamps are dark. The ninth still burns, low and tired, as if waiting for a footstep.' },
  sunkensun: { n: 'The Sunken Sun', cat: 'Regions', txt: 'Below the Hall, where the lid meets what it covers. There is no floor, only a warmth that pulls, and a light so total it feels like a sound. Everything here glows. Everything here is hungry.', quest: true },
  // ---- Figures ----
  ironforeman: { n: 'The Iron Foreman', cat: 'Figures', txt: 'He shut the shafts on his own miners to save the ore, then kept ringing the shift-bell as if they might still hurry back. His pick is welded to his hand. His lamp, the last that never went out, hangs at his belt.' },
  mothmother: { n: 'The Mothmother', cat: 'Figures', txt: 'She was the Warren\'s first keeper, a weaver who lost her lamp and spun a shroud to keep the moths company. The moths kept her. Now every soft thing that breathes in the Warren is a child of hers, and she has a great many.' },
  orrery: { n: 'The Orrery Sovereign', cat: 'Figures', txt: 'The great brass model of the heavens learned to look back. It plots the paths of everything that enters the Observatory, including yours, and plans the meeting. Its ninth ring has always been empty. It has never forgiven the gap.' },
  kaldrec: { n: 'Kaldrec the Sunforger', cat: 'Figures', txt: 'The first Lanternsmith, whose hammer made every lantern in the Reach from the same splinter of light. He kept a ledger of what each cost him. When the ledger filled, he started a second book, one that no lamp was ever lit to read.' },
  maelis: { n: 'Maelis, the Ninth Lamplighter', cat: 'Figures', txt: 'The last of the Nine, four hundred years old, who has been sending Keys into the dark since before Candlemere had a name. She is not cruel. She is a jailer who has run out of prisoners\' patience, and she loves the ones she sends the way one loves a tool.' },
  radiant: { n: 'The Radiant', cat: 'Figures', txt: 'The true sun. Not a god, a predator, that fed on everything it warmed until nine hands drowned it in a lid of darkness. It speaks in whatever voice the listener trusts most. It does not lie. That is what makes it dangerous.' },
  vashti: { n: 'Vashti Coil', cat: 'Figures', txt: 'Keeper of the Ember Forge, masked in a welder\'s visor she has never been seen without. She talks like a woman who has paid for every word. She claims she inherited the forge. The forge appears to disagree.' },
  ivel_key: { n: 'Ivel, the Fortieth', cat: 'Secrets', txt: 'Ivel was not a saint. He was the Key before you: the fortieth vessel forged from the Radiant\'s ash, sent to hold the lid. He walked into the dark and became its heart, and has been holding the lid ever since. Your choice in the Gloamheart decided how firmly.', quest: true },
  // ---- Factions ----
  lamplighters: { n: 'The Nine Lamplighters', cat: 'Factions', txt: 'A scholar-smith order that drowned the world\'s only sun to save the world from it. They believed the lid was temporary. It has been temporary for four hundred years. Eight of them died believing it. The ninth is still working.', quest: true },
  forty: { n: 'The Forty Keys', cat: 'Factions', txt: 'Forty Lanternbearers, forged one at a time from the Radiant\'s own ash, each sent to hold the lid. None could. The Hollowed in the Gloamheart, the Snuffer, the Unwritten: all were Keys, in the end, and all have been spent.', quest: true },
  // ---- Secrets ----
  blacknoon: { n: 'The Black Noon', cat: 'Secrets', txt: 'At midday the sky opens like an eye, and a black sun hangs where no sun should. Everyone can look straight at it. Everyone who does swears it looked back. It is not a second sun. It is the first one, waking.' },
  lid: { n: 'The Lid', cat: 'Secrets', txt: 'The Star Chart draws nine orbits around a black disc. Behind the disc, in faint gold, is a circle the disc was drawn to hide. The Gloam is not a beast. It is a cover, laid over something sleeping, and the sleeper is stirring.' },
  firstkey: { n: 'The First Key', cat: 'Secrets', txt: 'The lid cannot hold forever, so it must be re-sealed by a vessel of the Radiant\'s own ash, with its face taken as the price. Kaldrec forged the first. The forty since were all forged the same way. You are the forty-first, and this is why you have no face.' },
  lanternshard: { n: 'A Splinter of the Eye', cat: 'Secrets', txt: 'Look through the Sunglass at any lantern and you see the same thing: a shard of a single enormous eye, forged into a lamp. Every time a Lanternbearer kills a thing of the Gloam and lights a flame, the eye stirs a little. Yours has been burning for a long time.' },
  faceless: { n: 'Why We Are Hooded', cat: 'Secrets', txt: 'Every Lanternbearer wears a hood, a mask, or a veil. The Vigil calls it tradition. It is not. The Keys were faceless by design, and the failed ones were simply the ones who still remembered faces. The hood is a mercy that has become a habit.', quest: true },
  fortylanterns: { n: 'Forty Lanterns', cat: 'Secrets', txt: 'A wall in the Hall of Nine Lamps holds forty lanterns, each with a name scratched beneath it. Thirty-nine names are in the Vigil\'s hand. The fortieth is Ivel. The forty-first lantern hangs empty, and has your name pre-scratched, in Maelis\'s handwriting.', quest: true },
  ninthflame: { n: 'The Ninth Flame', cat: 'Secrets', txt: 'The Lamplighters lit nine lamps, one for each of the Nine, to watch the sleeping sun. The Ninth Flame was not a lamp at all. It was the sun\'s eye, held open on purpose, so the Nine would always know if it dreamt.' },
  radiantvoice: { n: 'In Your Own Voice', cat: 'Secrets', txt: 'The Radiant speaks in the voice you trust most, which is yours. It does not lie. It offers you what it is sure you want: a face, a name, a morning. That it means every word is the horror of it.', quest: true },
  kaldrecledger: { n: 'The Sunforger\'s Ledger', cat: 'Secrets', txt: 'A column of names, forty deep, each with a price written beside it: one face. The last entry has no name yet. Kaldrec left the line blank, and beneath it wrote three words: "It will be someone."', quest: true },
  nomirror: { n: 'The Mirror That Shows Nothing', cat: 'Secrets', txt: 'In the deep places there are mirrors that reflect the room and everything in it, except you. It is not a curse. It is a courtesy. The mirror is showing you what the Keys look like from the outside: nobody.' },
  // ---- Guidance ----
  forge: { n: 'Vashti\'s Forge Notes', cat: 'Guidance', txt: 'A pinned scrap by the bellows: "Ore for the body, starglass for the eye, sunsteel for the edge, voidsilk for the shadow, resin to keep the lamp lit. A piece is finished when it stops complaining. Never trust a piece that never complains."' },
  blacknoondread: { n: 'Vigil Manual: On the Black Noon', cat: 'Guidance', txt: 'Do not look at it for longer than a breath. If you have, do not tell anyone what it said. If it said your name, tell Maelis immediately. If it said it in your own voice, you should already be telling her.' },
  // ---- Bestiary ----
  hollowminers: { n: 'Hollow Miners', cat: 'Bestiary', txt: 'The dead of the Weeping Mines, still swinging picks at seams that ran dry a century ago. They do not attack from malice. They attack because you are standing where the next swing is due.' },
  dustmoths: { n: 'Dustmoths', cat: 'Bestiary', txt: 'Small grey moths that shed a fine, choking dust. In a swarm they drink a lantern\'s light down to a spark. Wren pays well for the dust, and worse for the cough it causes.' },
  lenseyes: { n: 'Lenseyes', cat: 'Bestiary', txt: 'Astronomers\' brass lenses that outlived their owners and kept watching. They drift through the flooded stacks reading the minds of anyone who passes, and reciting them, aloud, in the wrong order.' },
  glasswalkers: { n: 'Glasswalkers', cat: 'Bestiary', txt: 'People fused into glass by a light that touched them once and never let go. They shuffle in straight lines across the Cinderwaste toward the place the sun last stood, and they are very sharp when they arrive.' },
  lampshades: { n: 'Lampshades', cat: 'Bestiary', txt: 'Shadows that stand where the Nine\'s lamps used to. They cannot be lit, only snuffed. Any flame that walks past them dims, as if bowing.' },
  dawnhusks: { n: 'Dawn Husks', cat: 'Bestiary', txt: 'The bodies of people who looked into the Sunken Sun and kept looking. Their eyes are fused open. They walk toward daylight, any daylight, and burn when they find it.' },
  keybearers: { n: 'Faceless Key-Bearers', cat: 'Bestiary', txt: 'Failed Keys, still hooded, still carrying a lantern. They mimic the hero they meet, step for step, blow for blow. The Vigil calls them mercy cases. They do not look like they want mercy.' },
  lampmoths: { n: 'Lampmoths', cat: 'Bestiary', txt: 'A gloam-moth that feeds on lanterns rather than light. It lands on the glass and eats the flame from the inside, and it is very hard to feel sorry for.' },
  sunwardens: { n: 'The Sunwardens', cat: 'Bestiary', txt: 'Constructs of gloam and gold that stand guard over the Sunken Sun. They were not built to keep intruders out. They were built to keep the sun in, and they take that very personally.' },
});

G.D.ENDINGS.everlight = {
  t: 'The Everlight',
  slides: [
    { img: 'c_key', lines: ['You lift your lantern to the black sun and open the glass.', 'The ash of the Key goes up with the flame, and the Radiant wakes gladly.'] },
    { img: 'c_everlight', lines: ['Noon arrives all at once, white and total, and the whole Reach forgets what shade is.', 'The Gloam boils off the roads in an hour. The dead lie down and do not get up.'] },
    { img: 'keyart', lines: ['The crops leap. The ice runs. The sun is warm on every face in the world.', 'The sun feeds, as it always did, on everything it warms. It will take a long time.'] },
    { img: 'town', lines: ['In Candlemere, twelve thousand people stand in the street and weep at the brightness.', 'You are ash on the wind now, and nobody will ever see your face.'] },
  ],
};
G.D.ENDINGS.longnight = {
  t: 'The Long Night',
  slides: [
    { img: 'c_lamps', lines: ['You walk to the ninth chair and set your lantern in the ninth lamp.', 'The lid settles over the sun like a hand over a mouth.'] },
    { img: 'c_key', lines: ['Forty Keys came before you. You are the forty-first, and the last that anyone will need.', 'Your name goes quiet. Your face was already the price.'] },
    { img: 'c_longnight', lines: ['Above, the black sun closes its eye, and the Long Night settles over the Reach.', 'The dim will never end, and nothing will ever be eaten by the light.'] },
    { img: 'town', lines: ['Candlemere lights another candle, then another. The world is small, and it is alive.', 'Far below, a Key holds the lid, and hums a tune it half remembers.'] },
  ],
};
G.D.ENDINGS.sunface = {
  t: 'The Faceless Sun',
  slides: [
    { img: 'c_key', lines: ['The Radiant offers you a face, in your own voice, and you take it like a hand at the edge of a cliff.', 'It fits. It was always meant to fit.'] },
    { img: 'c_sunface', lines: ['A small sun opens where your mask was, gentle, tame, and yours.', 'The Radiant stops starving. It learns to hunger only for you.'] },
    { img: 'keyart', lines: ['The lid lifts slowly and does not fall. The Gloam thins to a friendly dusk.', 'Day and night return as things one can choose between.'] },
    { img: 'town', lines: ['In Candlemere, children look up at a warm gold face in the sky and wave.', 'A hooded Lanternbearer with a face of light walks home, and every lantern in the Reach flickers, and forgives.'] },
  ],
};
