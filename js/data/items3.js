/* Act III items: bases (tiers 1-5), affixes, stat names, uniques, consumables, materials, quest items, drops, recipes, runes */
(function () {
  const BASES = {
    // --- hammers (str, heavy) ---
    forge_hammer: { n: 'Forge Hammer', slot: 'weapon', wt: 'hammer', ic: 'hammer', tier: 1, dmg: [3, 8], scale: 'str', stats: { dmg: 3 } },
    smith_maul: { n: 'Smith\'s Maul', slot: 'weapon', wt: 'hammer', ic: 'hammer', tier: 2, dmg: [8, 15], scale: 'str', stats: { dmg: 5 } },
    sunfall_maul: { n: 'Sunfall Maul', slot: 'weapon', wt: 'hammer', ic: 'hammer', tier: 3, dmg: [14, 25], scale: 'str', stats: { dmg: 8 } },
    anvil_breaker: { n: 'Anvil-Breaker', slot: 'weapon', wt: 'hammer', ic: 'hammer', tier: 4, dmg: [22, 37], scale: 'str', stats: { dmg: 12 } },
    sunforged_hammer: { n: 'Sunforged Hammer', slot: 'weapon', wt: 'hammer', ic: 'hammer', tier: 5, dmg: [38, 62], scale: 'str', stats: { dmg: 20 } },
    // --- astrolabes (int, spell + crit) ---
    brass_astrolabe: { n: 'Brass Astrolabe', slot: 'weapon', wt: 'astrolabe', ic: 'star', tier: 1, dmg: [2, 4], scale: 'int', stats: { spell: 3, crit: 2 } },
    star_compass: { n: 'Star Compass', slot: 'weapon', wt: 'astrolabe', ic: 'star', tier: 2, dmg: [4, 7], scale: 'int', stats: { spell: 8, crit: 3 } },
    orrery_rod: { n: 'Orrery Rod', slot: 'weapon', wt: 'astrolabe', ic: 'star', tier: 3, dmg: [7, 11], scale: 'int', stats: { spell: 14, crit: 4 } },
    comet_staff: { n: 'Comet Staff', slot: 'weapon', wt: 'astrolabe', ic: 'star', tier: 4, dmg: [11, 17], scale: 'int', stats: { spell: 22, crit: 6 } },
    eclipse_astrolabe: { n: 'Eclipse Astrolabe', slot: 'weapon', wt: 'astrolabe', ic: 'star', tier: 5, dmg: [19, 29], scale: 'int', stats: { spell: 38, crit: 10 } },
    // --- claws (agi, crit + dodge) ---
    bone_talons: { n: 'Bone Talons', slot: 'weapon', wt: 'claw', ic: 'dagger', tier: 1, dmg: [2, 5], scale: 'agi', stats: { crit: 4, dodge: 1 } },
    veil_talons: { n: 'Veil Talons', slot: 'weapon', wt: 'claw', ic: 'dagger', tier: 2, dmg: [5, 10], scale: 'agi', stats: { crit: 6, dodge: 2 } },
    gloam_talons: { n: 'Gloam Talons', slot: 'weapon', wt: 'claw', ic: 'dagger', tier: 3, dmg: [9, 17], scale: 'agi', stats: { crit: 8, dodge: 3 } },
    night_talons: { n: 'Night Talons', slot: 'weapon', wt: 'claw', ic: 'dagger', tier: 4, dmg: [15, 26], scale: 'agi', stats: { crit: 11, dodge: 5 } },
    eclipse_talons: { n: 'Eclipse Talons', slot: 'weapon', wt: 'claw', ic: 'dagger', tier: 5, dmg: [26, 44], scale: 'agi', stats: { crit: 18, dodge: 8 } },
    // --- flails (str, thorns) ---
    chain_flail: { n: 'Chain Flail', slot: 'weapon', wt: 'flail', ic: 'mace', tier: 1, dmg: [3, 6], scale: 'str', stats: { thorns: 2 } },
    warden_flail: { n: 'Warden\'s Flail', slot: 'weapon', wt: 'flail', ic: 'mace', tier: 2, dmg: [7, 12], scale: 'str', stats: { thorns: 4 } },
    morning_chain: { n: 'Morning Chain', slot: 'weapon', wt: 'flail', ic: 'mace', tier: 3, dmg: [12, 20], scale: 'str', stats: { thorns: 6 } },
    gaol_flail: { n: 'Gaol Flail', slot: 'weapon', wt: 'flail', ic: 'mace', tier: 4, dmg: [19, 31], scale: 'str', stats: { thorns: 9 } },
    sunchain_flail: { n: 'Sunchain Flail', slot: 'weapon', wt: 'flail', ic: 'mace', tier: 5, dmg: [33, 53], scale: 'str', stats: { thorns: 15 } },
    // --- tier 5 of existing weapon types ---
    eclipse_blade: { n: 'Eclipseblade', slot: 'weapon', wt: 'sword', ic: 'sword', tier: 5, dmg: [34, 54], scale: 'str' },
    sunsplitter: { n: 'Sunsplitter', slot: 'weapon', wt: 'axe', ic: 'axe', tier: 5, dmg: [29, 65], scale: 'str', stats: { crit: 9 } },
    nightglass_dirk: { n: 'Nightglass Dirk', slot: 'weapon', wt: 'dagger', ic: 'dagger', tier: 5, dmg: [24, 42], scale: 'agi', stats: { crit: 17 } },
    noonday_mace: { n: 'Noonday Mace', slot: 'weapon', wt: 'mace', ic: 'mace', tier: 5, dmg: [32, 51], scale: 'str', stats: { holy: 24 } },
    radiant_staff: { n: 'Radiant Staff', slot: 'weapon', wt: 'staff', ic: 'staff', tier: 5, dmg: [19, 29], scale: 'int', stats: { spell: 37 } },
    black_scythe: { n: 'Black Scythe', slot: 'weapon', wt: 'sickle', ic: 'dagger', tier: 5, dmg: [19, 31], scale: 'int', stats: { spell: 37 } },
    zenith_crossbow: { n: 'Zenith Crossbow', slot: 'weapon', wt: 'crossbow', ic: 'bolt', tier: 5, dmg: [27, 44], scale: 'agi', stats: { crit: 17 } },
    // --- off-hands: lenses (spell + crit) ---
    cracked_lens: { n: 'Cracked Lens', slot: 'offhand', ot: 'lens', ic: 'eye', tier: 1, stats: { spell: 2, crit: 2 } },
    brass_lens: { n: 'Brass-Ringed Lens', slot: 'offhand', ot: 'lens', ic: 'eye', tier: 2, stats: { spell: 5, crit: 3 } },
    star_lens: { n: 'Star Lens', slot: 'offhand', ot: 'lens', ic: 'eye', tier: 3, stats: { spell: 9, crit: 5 } },
    pulsar_lens: { n: 'Pulsar Lens', slot: 'offhand', ot: 'lens', ic: 'eye', tier: 4, stats: { spell: 15, crit: 8 } },
    eclipse_lens: { n: 'Eclipse Lens', slot: 'offhand', ot: 'lens', ic: 'eye', tier: 5, stats: { spell: 26, crit: 14 } },
    // --- off-hands: veils (dodge + crit) ---
    gauze_veil: { n: 'Gauze Veil', slot: 'offhand', ot: 'veil', ic: 'moon', tier: 1, stats: { dodge: 3, crit: 2 } },
    mourning_veil: { n: 'Mourning Veil', slot: 'offhand', ot: 'veil', ic: 'moon', tier: 2, stats: { dodge: 5, crit: 3, dreadRes: 3 } },
    veil_of_dusk: { n: 'Veil of Dusk', slot: 'offhand', ot: 'veil', ic: 'moon', tier: 3, stats: { dodge: 8, crit: 5, dreadRes: 5 } },
    veil_of_glass: { n: 'Veil of Glass', slot: 'offhand', ot: 'veil', ic: 'moon', tier: 4, stats: { dodge: 12, crit: 8, dreadRes: 8 } },
    shroud_of_nine: { n: 'Shroud of the Nine', slot: 'offhand', ot: 'veil', ic: 'moon', tier: 5, stats: { dodge: 20, crit: 14, dreadRes: 14 } },
    // --- off-hands: tier 5 of existing types ---
    bulwark: { n: 'Lamplighter\'s Bulwark', slot: 'offhand', ic: 'shield', tier: 5, armor: 27, stats: { dodge: -5 } },
    dawn_codex: { n: 'Codex of Dawns', slot: 'offhand', ic: 'tome', tier: 5, stats: { spell: 24, focus: 20 } },
    nine_flame_censer: { n: 'Nine-Flame Censer', slot: 'offhand', ic: 'censer', tier: 5, stats: { holy: 22, resolve: 38 } },
    radiant_totem: { n: 'Radiant Totem', slot: 'offhand', ot: 'fetish', ic: 'skull', tier: 5, stats: { spell: 24, lifesteal: 8, resolve: 32 } },
    sunwarden_quiver: { n: 'Sunwarden\'s Quiver', slot: 'offhand', ot: 'quiver', ic: 'bolt', tier: 5, stats: { crit: 16, dmg: 18 } },
    // --- head ---
    sunwarden_helm: { n: 'Sunwarden Helm', slot: 'head', ic: 'helm', tier: 5, armor: 20 },
    starseer_circlet: { n: 'Starseer\'s Circlet', slot: 'head', ic: 'crown', tier: 5, armor: 9, stats: { spell: 14, focus: 10 } },
    // --- chest ---
    sunforged_plate: { n: 'Sunforged Plate', slot: 'chest', ic: 'chest', tier: 5, armor: 36, stats: { dodge: -7 } },
    nightweave_robe: { n: 'Nightweave Robe', slot: 'chest', ic: 'chest', tier: 5, armor: 15, stats: { spell: 19, wil: 5 } },
    // --- hands ---
    astral_gloves: { n: 'Astral Gloves', slot: 'hands', ic: 'gloves', tier: 4, armor: 3, stats: { spell: 6, crit: 4 } },
    sunforged_gauntlets: { n: 'Sunforged Gauntlets', slot: 'hands', ic: 'gloves', tier: 5, armor: 12 },
    glasswoven_gloves: { n: 'Glasswoven Gloves', slot: 'hands', ic: 'gloves', tier: 5, armor: 5, stats: { spell: 10, crit: 7 } },
    // --- feet ---
    nightstep_boots: { n: 'Nightstep Boots', slot: 'feet', ic: 'boots', tier: 4, armor: 3, stats: { dodge: 6 } },
    sunforged_greaves: { n: 'Sunforged Greaves', slot: 'feet', ic: 'boots', tier: 5, armor: 12 },
    voidstep_boots: { n: 'Voidstep Boots', slot: 'feet', ic: 'boots', tier: 5, armor: 5, stats: { dodge: 10 } },
    // --- jewelry & lantern ---
    sunheart_amulet: { n: 'Sunheart Amulet', slot: 'amulet', ic: 'amulet', tier: 5, stats: { resolve: 26, hp: 26 } },
    corona_ring: { n: 'Corona Ring', slot: 'ring', ic: 'ring', tier: 5, stats: { hp: 44 } },
    noon_lantern: { n: 'Noon Lantern', slot: 'lantern', ic: 'lantern', tier: 5, stats: { lightMax: 230, lightEff: 42 } },
  };

  const AFFIX = [
    { k: 'thorns', p: 'Barbed', s: 'of Thorns', v: l => 2 + Math.floor(l / 5), slots: ['offhand', 'head', 'chest', 'hands', 'feet'] },
    { k: 'spellPct', p: 'Ascendant', s: 'of the Zenith', v: l => 2 + Math.floor(l / 10), slots: ['weapon', 'offhand', 'head', 'amulet', 'ring'] },
    { k: 'hpPct', p: 'Vital', s: 'of Endurance', v: l => 1 + Math.floor(l / 12), slots: ['head', 'chest', 'amulet', 'ring'] },
    { k: 'armorPct', p: 'Tempered', s: 'of the Anvil', v: l => 2 + Math.floor(l / 8), slots: ['offhand', 'head', 'chest', 'hands', 'feet'] },
    { k: 'dmgStatus', p: 'Blighted', s: 'of Affliction', v: l => 4 + Math.floor(l / 3), slots: ['weapon', 'ring', 'amulet', 'hands'] },
    { k: 'firstStrike', p: 'Ambushing', s: 'of the First Blow', v: l => 5 + Math.floor(l / 3), slots: ['weapon', 'ring', 'amulet', 'hands'] },
  ];

  const STAT_NAMES = {
    thorns: ['Thorns', '%'], spellPct: ['Spell Power', '%'], hpPct: ['Max HP', '%'], armorPct: ['Armor', '%'],
    dmgStatus: ['Damage vs Afflicted', '%'], firstStrike: ['First Strike Damage', '%'], cheatDeath: ['Deathless (once per fight)', ''],
  };

  const UNIQUES = {
    // --- boss drops ---
    foreman_pick: { base: 'headsman', n: 'The Foreman\'s Pick', ilvl: 20, boss: true, dmg: [22, 42], stats: { str: 6, dmg: 14, thorns: 8, hp: 25, crit: 5 },
      lore: 'The Ironforeman never once put it down. The shaft is worn to the shape of a hand that no longer needs to be there.' },
    mothmother_veil: { base: 'starwoven_robe', n: 'Veil of the Moth-Mother', ilvl: 34, boss: true, armor: 10, stats: { int: 7, spell: 28, dodge: 8, dreadRes: 15, regen: 3 },
      lore: 'Ten thousand wings, stitched by patient hands. When the lamps gutter, it flutters toward the light and takes you with it.' },
    orrery_eye: { base: 'sunheart_amulet', n: 'Eye of the Orrery', ilvl: 46, boss: true, stats: { int: 9, spell: 40, crit: 12, focus: 25, lightEff: 20 },
      lore: 'The lens at the centre of the Sovereign. It has watched every star wheel past and has opinions about the last one.' },
    sunforge_hammer: { base: 'sunforged_hammer', n: 'Hammer of the Sunforger', ilvl: 50, boss: true, dmg: [40, 66], stats: { str: 12, vit: 6, dmg: 25, dmgStatus: 30, thorns: 10 },
      lore: 'Kaldrec beat the first lantern out of a sliver of the Radiant\'s eye with this. The head is still warm, and it is not from the forge.' },
    ninth_lamp: { base: 'noon_lantern', n: 'The Ninth Lamp', ilvl: 55, boss: true, stats: { lightMax: 320, lightEff: 55, resolve: 35, regen: 6, dreadRes: 20 },
      lore: 'The last lamp of the last Lamplighter. Maelis carried it four hundred years, and the flame has never once been fed.' },
    radiant_crown: { base: 'sunwarden_helm', n: 'Crown of the Radiant', ilvl: 60, boss: true, armor: 20, stats: { wil: 10, int: 10, resolve: 40, hp: 90, spellPct: 10, dreadRes: 25 },
      lore: 'A ring of pale fire that fits no head and every head. It speaks to whoever wears it, in their own voice, and it is very kind.' },
    // --- world drops ---
    dawnsmith: { base: 'anvil_breaker', n: 'Dawnsmith', ilvl: 44, dmg: [30, 50], stats: { str: 10, vit: 5, dmg: 20, dmgStatus: 25, armor: 8 },
      lore: 'A Lamplighter smith\'s hammer, struck against a black anvil on the day the sun was put to sleep. It still rings when something wakes.' },
    emberplate: { base: 'sunforged_plate', n: 'Emberplate', ilvl: 47, armor: 22, stats: { vit: 8, hp: 60, armorPct: 8, thorns: 12 },
      lore: 'Plate that was quenched in ash instead of water. Anything that strikes it comes away with singed fingers and second thoughts.' },
    polaris: { base: 'comet_staff', n: 'Polaris', ilvl: 48, dmg: [24, 36], stats: { int: 10, spell: 48, crit: 12, critDmg: 40 },
      lore: 'The astronomers pointed it at the one star that never moved. The star has since moved. The staff still points where it was.' },
    nebula_robe: { base: 'nightweave_robe', n: 'Nebula Robe', ilvl: 49, armor: 12, stats: { int: 9, spell: 40, focus: 30, focusRegen: 3, spellPct: 8 },
      lore: 'Cloth woven from the dust between the stars. Every fold is a small night with a few cold lights in it.' },
    nightveil_talons: { base: 'night_talons', n: 'Nightveil Talons', ilvl: 47, dmg: [24, 40], stats: { agi: 10, crit: 16, dodge: 10, critDmg: 45 },
      lore: 'Worn by a masked duellist who walked between the veils and was never seen to arrive. The blades are still wet, and it is not rain.' },
    nameless_hood: { base: 'starseer_circlet', n: 'The Nameless Hood', ilvl: 52, armor: 8, stats: { agi: 7, wil: 6, dodge: 10, dreadRes: 30, resolve: 25 },
      lore: 'Whoever wears it is forgotten by the next room. Whoever made it was forgotten first, which is how it works so well.' },
    gaoler_chain: { base: 'gaol_flail', n: 'The Gaoler\'s Chain', ilvl: 50, dmg: [32, 50], stats: { str: 10, vit: 6, thorns: 25, lifesteal: 5 },
      lore: 'Each link was forged for a prisoner and given a name. The chain is heavy with them, and it hits back for all of them.' },
    wardens_bulwark: { base: 'bulwark', n: 'The Warden\'s Bulwark', ilvl: 53, armor: 22, stats: { vit: 9, hp: 70, resolve: 30, thorns: 15, armorPct: 6 },
      lore: 'The jailers of the Nine stood behind it while the sun screamed. The dents on the face are all on the inside.' },
    lamplighters_crook: { base: 'radiant_staff', n: 'The Lamplighter\'s Crook', ilvl: 46, dmg: [22, 34], stats: { int: 8, wil: 6, spell: 44, holy: 30, lightEff: 20 },
      lore: 'A hooked staff for lifting the wicks of the tallest lamps. Every Lamplighter carried one. This one has lifted rather more than wicks.' },
    glass_edge: { base: 'eclipse_blade', n: 'Glass Edge', ilvl: 48, dmg: [38, 58], stats: { str: 9, crit: 15, critDmg: 50, dmg: 15, dmgStatus: 20 },
      lore: 'Sand fused by the Radiant\'s first glance, ground to an edge one grain wide. It cuts light, sound and, on a good day, doubt.' },
    cinder_ring: { base: 'corona_ring', n: 'Cinder Ring', ilvl: 47, stats: { hp: 60, spell: 20, dmg: 10, dotPct: 30 },
      lore: 'A ring of black glass with one coal set in it. The coal has been burning since before the ring was made.' },
    starmap_amulet: { base: 'sunheart_amulet', n: 'Starmap Amulet', ilvl: 45, stats: { int: 8, spell: 30, focus: 25, focusRegen: 3, lightEff: 20 },
      lore: 'An engraved chart of a sky that has since been rearranged. It is accurate only for those who remember the old one.' },
    umbral_fang: { base: 'nightglass_dirk', n: 'Umbral Fang', ilvl: 51, dmg: [30, 48], stats: { agi: 10, crit: 20, critDmg: 55, lifesteal: 8, firstStrike: 25 },
      lore: 'It is drawn before the hand decides to. Its first cut is always the worst one, and it likes to be the first.' },
    eclipse_mace: { base: 'noonday_mace', n: 'Eclipse Mace', ilvl: 54, dmg: [40, 62], stats: { str: 8, wil: 8, holy: 50, dmg: 15, dreadRes: 15 },
      lore: 'One face bright, one face black. The Lamplighters swung it bright side down, so that the dark would remember who was asking.' },
    ashen_gauntlets: { base: 'sunforged_gauntlets', n: 'Ashen Gauntlets', ilvl: 46, armor: 10, stats: { str: 7, dmg: 15, critDmg: 30, dotPct: 25 },
      lore: 'Gloves of fused ash, still hot to the touch. Whatever they grip, they leave a print in.' },
    tidewalker_boots: { base: 'voidstep_boots', n: 'Tidewalker Boots', ilvl: 44, armor: 7, stats: { agi: 8, dodge: 15, hp: 40, regen: 4, lightEff: 15 },
      lore: 'Salvaged from a drowned astronomer who kept walking. The soles never touch the floor, only what floods it.' },
    sunspear_arbalest: { base: 'zenith_crossbow', n: 'Sunspear Arbalest', ilvl: 55, dmg: [34, 54], stats: { agi: 11, crit: 22, critDmg: 60, dmg: 20, firstStrike: 30 },
      lore: 'It fires a bolt of pure noon. By the time you hear the string, the target has already been noticed by the sun.' },
    hungering_scythe: { base: 'black_scythe', n: 'The Hungering Scythe', ilvl: 52, dmg: [24, 38], stats: { int: 10, spell: 52, lifesteal: 10, dotPct: 40 },
      lore: 'A scythe of frozen night that was never sharpened, only fed. It takes what it cuts and is never quite full.' },
    atlas_of_ends: { base: 'dawn_codex', n: 'Atlas of Ends', ilvl: 58, stats: { int: 10, spell: 55, focus: 40, spellPct: 12, cheatDeath: 1 },
      lore: 'A book of maps to places that have not ended yet. The last page is blank, and the blank page is yours.' },
  };

  Object.assign(G.D.BASES, BASES);
  for (const a of AFFIX) G.D.AFFIX.push(a);
  Object.assign(G.D.STAT_NAMES, STAT_NAMES);
  Object.assign(G.D.UNIQUES, UNIQUES);
  G.D.NEW_ITEM_IDS = G.D.NEW_ITEM_IDS || {};
  G.D.NEW_ITEM_IDS.bases = Object.keys(BASES);
  G.D.NEW_ITEM_IDS.uniques = Object.keys(UNIQUES);

  const CONS = {
    greaterdraught: { n: 'Greater Red Draught', ic: 'potion', desc: 'Restores 60% of your HP.', price: 90, combat: true, unlock: 'act3', fx: { heal: 60 } },
    greatersalts: { n: 'Greater Mind Salts', ic: 'bolt', desc: 'Restores 80% of your Focus.', price: 80, combat: true, unlock: 'act3', fx: { focus: 80 } },
    lightflask: { n: 'Lantern Flask', ic: 'lantern', desc: 'A full flask of clean resin-oil. Refills 100 Light in your lantern.', price: 60, explore: true, unlock: 'act3', fx: { light: 100 } },
    warelixir: { n: 'Elixir of War', ic: 'swords', desc: 'Bitter and hot. +30% damage until the fight ends.', price: 120, combat: true, combatOnly: true, unlock: 'act3', fx: { status: { id: 'rage', turns: 99, pow: 30 } } },
    stoneskin: { n: 'Stoneskin Draught', ic: 'shield', desc: 'Your skin greys and hardens. -35% damage taken until the fight ends.', price: 110, combat: true, combatOnly: true, unlock: 'act3', fx: { status: { id: 'guard', turns: 99, pow: 35 } } },
    wardsalt: { n: 'Ward-Salt', ic: 'sparkle', desc: 'Scatter a ring of salt. Absorbs damage equal to 35% of your max HP.', price: 100, combat: true, combatOnly: true, unlock: 'act3', fx: { ward: 35 } },
    nighttonic: { n: 'Nightleaf Tonic', ic: 'leaf', desc: 'The whispers go quiet. -60 Dread and cures ailments.', price: 90, combat: true, unlock: 'act3', fx: { dread: -60, cure: true } },
    sunbomb: { n: 'Sunbomb', ic: 'flame', desc: 'A glass sphere of caged noon. Heavy magic damage to all enemies and sets them burning.', price: 130, combat: true, combatOnly: true, unlock: 'act3', fx: { aoe: { m: 3.2, dt: 'magic', st: { id: 'burn', ch: 100, turns: 3, pow: 14 } } } },
    voidbomb: { n: 'Voidflask', ic: 'moon', desc: 'A flask of bottled nothing. Magic damage to all enemies and weakens them.', price: 120, combat: true, combatOnly: true, unlock: 'act3', fx: { aoe: { m: 2.6, dt: 'magic', st: { id: 'weak', ch: 100, turns: 3, pow: 30 } } } },
    phoenixash: { n: 'Phoenix Ash', ic: 'sparkle', desc: 'Carry it and death may think twice. Once per fight, a killing blow returns you at 40% HP. Consumed automatically.', price: 500, combat: true, combatOnly: true, auto: true, unlock: 'act3', fx: { phoenix: 40 } },
    emberdraught: { n: 'Ember Draught', ic: 'potion', desc: 'Restores 35% HP and 35% Focus, and takes 15 Dread off.', price: 140, combat: true, unlock: 'act3', fx: { heal: 35, focus: 35, dread: -15 } },
    starwater: { n: 'Starwater', ic: 'star', desc: 'Water from a drowned sky. Fully restores HP, cures all ailments and clears all Dread.', price: 400, combat: true, unlock: 'act3', fx: { heal: 100, cure: true, dread: -100 } },
  };

  const MATS = {
    emberore: { n: 'Ember Ore', ic: 'flame', desc: 'Rock that still glows from a fire nobody lit. Fuel for the Ember Forge.' },
    starglass: { n: 'Starglass', ic: 'star', desc: 'Glass drawn from drowned lenses and dead constellations. It remembers light.' },
    sunsteel: { n: 'Sunsteel Ingot', ic: 'anvil', desc: 'Steel quenched in the Radiant\'s own glare. It gives back more warmth than it should.' },
    voidsilk: { n: 'Voidsilk', ic: 'moon', desc: 'Thread spun from the dark between webs. You feel it more than you see it.' },
    lampresin: { n: 'Lamp Resin', ic: 'drop', desc: 'Amber gum from wicks that burned too long. It smells of sweet smoke and old vigils.' },
  };

  const QITEMS = {
    star_chart: { n: 'The Star Chart', desc: 'A drowned astronomer\'s chart of the sky as it was. Nine stars are circled in wax pencil; the ninth is scratched out until the paper tore.' },
    sunglass: { n: 'Sunglass', desc: 'A palm-sized shard of desert glass, fused by a light that no longer shines. Look into it and it looks back, warm.' },
    first_faceplate: { n: 'The First Faceplate', desc: 'A smooth, blank plate of pale metal, hammered to fit a face. It has no eye-holes. Kaldrec made it for the first Key, and it is still the right size.' },
    nine_sigils: { n: 'The Nine Sigils', desc: 'Nine brass discs, one for each Lamplighter, each cut with a lamp. Eight are dull. One is still warm.' },
    foreman_lamp: { n: 'The Foreman\'s Lamp', desc: 'A miner\'s lamp with a name scratched on the base. The flame does not flicker, and it does not go out underwater.' },
    moth_silk: { n: 'Moth-Silk Bolt', desc: 'A bolt of pale silk spun by something that never stopped. Soft, light, and it hums when a lamp is lit near it.' },
    astro_log: { n: 'The Astronomer\'s Log', desc: 'A waterlogged log, the ink run to blue clouds. The last legible line: "The sun is not setting. It is closing."' },
    glass_rose: { n: 'The Glass Rose', desc: 'A rose blown of clear sand-glass, every petal perfect. Someone left it on a grave with no name and no body.' },
    cold_key: { n: 'The Cold Key', desc: 'A key of black iron, cold in the hottest room. It opens the one vault in the Cinderwaste that Kaldrec never fired.' },
    ninth_letter: { n: 'The Ninth Letter', desc: 'A sealed letter in a tired, careful hand, addressed to "Whoever comes last." The wax is a lamp with nine flames, eight of them scratched out.' },
  };

  const MAT_DROPS = [
    { mat: 'emberore', minLvl: 20, chance: 0.10, n: [1, 2], bossMult: 3 },
    { mat: 'voidsilk', minLvl: 26, chance: 0.08, n: [1, 2], bossMult: 3 },
    { mat: 'starglass', minLvl: 41, chance: 0.10, n: [1, 2], bossMult: 3 },
    { mat: 'sunsteel', minLvl: 46, chance: 0.06, n: [1, 1], bossMult: 3 },
    { mat: 'lampresin', minLvl: 51, chance: 0.10, n: [1, 2], bossMult: 3 },
    { mat: 'scrap', minLvl: 41, chance: 0.25, n: [2, 4], bossMult: 3 },
    { mat: 'shard', minLvl: 41, chance: 0.18, n: [1, 3], bossMult: 3 },
  ];

  const RUNES = {
    embers: { n: 'Rune of Embers', ic: 'rune', tier: 1, stat: { dmg: 6 }, slots: ['weapon', 'hands'], color: '#e0954a' },
    frost: { n: 'Rune of Frost', ic: 'rune', tier: 1, stat: { resolve: 8, dodge: 2 }, slots: ['head', 'chest', 'offhand'], color: '#8fd0ff' },
    ash: { n: 'Rune of Ash', ic: 'rune', tier: 1, stat: { hp: 14 }, slots: ['chest', 'ring', 'amulet', 'feet'], color: '#9a9088' },
    glass: { n: 'Rune of Glass', ic: 'rune', tier: 1, stat: { crit: 3 }, slots: ['weapon', 'offhand', 'hands', 'ring'], color: '#cfe8ff' },
    wick: { n: 'Rune of the Wick', ic: 'rune', tier: 1, stat: { lightEff: 8 }, slots: ['lantern', 'head', 'amulet'], color: '#ffd27a' },
    briars: { n: 'Rune of Briars', ic: 'rune', tier: 1, stat: { thorns: 4 }, slots: ['offhand', 'chest', 'hands', 'feet'], color: '#6a8a4a' },
    stars: { n: 'Rune of Stars', ic: 'rune', tier: 2, stat: { spell: 12, focus: 6 }, slots: ['weapon', 'offhand', 'head', 'amulet'], color: '#9db8ff' },
    veils: { n: 'Rune of Veils', ic: 'rune', tier: 2, stat: { dodge: 5, dreadRes: 6 }, slots: ['offhand', 'chest', 'feet', 'head'], color: '#b48ad0' },
    iron: { n: 'Rune of Iron', ic: 'rune', tier: 2, stat: { armor: 8, armorPct: 3 }, slots: ['offhand', 'head', 'chest', 'hands', 'feet'], color: '#7c8d98' },
    hunger: { n: 'Rune of Hunger', ic: 'rune', tier: 2, stat: { lifesteal: 4, dotPct: 12 }, slots: ['weapon', 'ring', 'amulet'], color: '#a83a4a' },
    vigil: { n: 'Rune of the Vigil', ic: 'rune', tier: 2, stat: { resolve: 16, regen: 2 }, slots: ['head', 'chest', 'amulet', 'ring', 'lantern'], color: '#e8c880' },
    nine: { n: 'Rune of the Nine', ic: 'rune', tier: 3, stat: { str: 3, agi: 3, int: 3, wil: 3, vit: 3 }, slots: ['amulet', 'ring'], color: '#f2e6c0' },
    noon: { n: 'Rune of Noon', ic: 'rune', tier: 3, stat: { dmg: 14, crit: 6, critDmg: 20 }, slots: ['weapon', 'hands', 'ring'], color: '#ffd23a' },
    eclipse: { n: 'Rune of Eclipse', ic: 'rune', tier: 3, stat: { spell: 26, crit: 8, spellPct: 6 }, slots: ['weapon', 'offhand', 'head', 'amulet'], color: '#6a4a9a' },
    sunforge: { n: 'Rune of the Sunforge', ic: 'rune', tier: 3, stat: { armor: 14, armorPct: 6, thorns: 8, hp: 30 }, slots: ['chest', 'offhand', 'head'], color: '#e0954a' },
    dawn: { n: 'Rune of the Dawn', ic: 'rune', tier: 3, stat: { hpPct: 6, regen: 4, resolve: 24 }, slots: ['chest', 'amulet', 'lantern'], color: '#fff0b0' },
  };

  const RECIPES = {};
  const gear = (base, cat, lvl, gold, rarity, mats, flag) => {
    const r = { n: G.D.BASES[base].n, cat, out: { base }, mats, gold, lvl, rarity };
    if (flag) r.flag = flag;
    RECIPES['forge_' + base] = r;
  };
  // tier 3
  gear('sunfall_maul', 'weapon', 40, 600, 2, { scrap: 14, shard: 4, emberore: 4 });
  gear('orrery_rod', 'weapon', 40, 600, 2, { scrap: 8, shard: 6, emberore: 2, starglass: 2 });
  gear('gloam_talons', 'weapon', 40, 600, 2, { scrap: 8, shard: 6, emberore: 2, voidsilk: 3 });
  gear('morning_chain', 'weapon', 40, 600, 2, { scrap: 14, shard: 4, emberore: 4 });
  gear('star_lens', 'armor', 40, 500, 2, { shard: 6, emberore: 2, starglass: 3 });
  gear('veil_of_dusk', 'armor', 40, 500, 2, { shard: 5, voidsilk: 5 });
  // tier 4
  gear('anvil_breaker', 'weapon', 43, 1800, 3, { scrap: 22, shard: 8, emberore: 7 });
  gear('comet_staff', 'weapon', 43, 1800, 3, { scrap: 12, shard: 10, emberore: 4, starglass: 5 });
  gear('night_talons', 'weapon', 43, 1800, 3, { scrap: 12, shard: 10, emberore: 4, voidsilk: 6 });
  gear('gaol_flail', 'weapon', 43, 1800, 3, { scrap: 22, shard: 8, emberore: 7, lampresin: 2 });
  gear('pulsar_lens', 'armor', 43, 1500, 3, { shard: 10, emberore: 4, starglass: 5 });
  gear('veil_of_glass', 'armor', 43, 1500, 3, { shard: 8, voidsilk: 7, starglass: 2 });
  gear('court_plate', 'armor', 43, 1800, 3, { scrap: 26, shard: 8, emberore: 8 });
  gear('starwoven_robe', 'armor', 43, 1800, 3, { scrap: 10, shard: 10, starglass: 4, voidsilk: 4 });
  gear('crown_helm', 'armor', 43, 1500, 3, { scrap: 18, shard: 6, emberore: 6 });
  gear('archivist_hood', 'armor', 43, 1500, 3, { scrap: 8, shard: 8, starglass: 4 });
  gear('heart_amulet', 'jewel', 43, 1400, 3, { shard: 8, emberore: 4, starglass: 2 });
  gear('sunstone_ring', 'jewel', 43, 1400, 3, { shard: 8, emberore: 4, lampresin: 2 });
  gear('starlight_lantern', 'lantern', 43, 1800, 3, { scrap: 10, shard: 8, lampresin: 4 });
  // tier 5
  gear('sunforged_hammer', 'weapon', 48, 8000, 4, { scrap: 34, shard: 16, emberore: 10, sunsteel: 5 }, 'sunforge');
  gear('eclipse_astrolabe', 'weapon', 48, 8000, 4, { scrap: 18, shard: 16, starglass: 8, sunsteel: 4 }, 'sunforge');
  gear('eclipse_talons', 'weapon', 48, 8000, 4, { scrap: 18, shard: 16, voidsilk: 9, sunsteel: 4 }, 'sunforge');
  gear('sunchain_flail', 'weapon', 48, 8000, 4, { scrap: 34, shard: 16, emberore: 10, sunsteel: 5, lampresin: 3 }, 'sunforge');
  gear('eclipse_blade', 'weapon', 48, 6500, 3, { scrap: 30, shard: 14, emberore: 8, sunsteel: 4 }, 'sunforge');
  gear('sunsplitter', 'weapon', 48, 6500, 3, { scrap: 32, shard: 14, emberore: 8, sunsteel: 4 }, 'sunforge');
  gear('nightglass_dirk', 'weapon', 48, 6500, 3, { scrap: 20, shard: 14, voidsilk: 6, sunsteel: 4 }, 'sunforge');
  gear('noonday_mace', 'weapon', 48, 6500, 3, { scrap: 30, shard: 14, emberore: 8, sunsteel: 4 }, 'sunforge');
  gear('radiant_staff', 'weapon', 48, 6500, 3, { scrap: 16, shard: 14, starglass: 7, sunsteel: 4 }, 'sunforge');
  gear('black_scythe', 'weapon', 48, 6500, 3, { scrap: 16, shard: 14, voidsilk: 5, sunsteel: 4 }, 'sunforge');
  gear('zenith_crossbow', 'weapon', 48, 6500, 3, { scrap: 22, shard: 14, emberore: 6, sunsteel: 4 }, 'sunforge');
  gear('eclipse_lens', 'armor', 50, 5500, 3, { shard: 14, starglass: 8, sunsteel: 3 }, 'sunforge');
  gear('shroud_of_nine', 'armor', 50, 5500, 3, { shard: 12, voidsilk: 10, sunsteel: 3 }, 'sunforge');
  gear('bulwark', 'armor', 50, 6000, 3, { scrap: 36, shard: 12, emberore: 8, sunsteel: 4 }, 'sunforge');
  gear('dawn_codex', 'armor', 50, 5500, 3, { shard: 14, starglass: 8, sunsteel: 3 }, 'sunforge');
  gear('nine_flame_censer', 'armor', 50, 5500, 3, { shard: 14, lampresin: 6, sunsteel: 3 }, 'sunforge');
  gear('radiant_totem', 'armor', 50, 5500, 3, { shard: 14, voidsilk: 5, lampresin: 4, sunsteel: 3 }, 'sunforge');
  gear('sunwarden_quiver', 'armor', 50, 5500, 3, { scrap: 16, shard: 12, emberore: 6, sunsteel: 3 }, 'sunforge');
  gear('sunwarden_helm', 'armor', 52, 6000, 3, { scrap: 28, shard: 12, emberore: 8, sunsteel: 4 }, 'sunforge');
  gear('starseer_circlet', 'armor', 52, 6000, 3, { scrap: 12, shard: 12, starglass: 7, sunsteel: 3 }, 'sunforge');
  gear('sunforged_plate', 'armor', 54, 8000, 3, { scrap: 44, shard: 16, emberore: 12, sunsteel: 6 }, 'sunforge');
  gear('nightweave_robe', 'armor', 54, 8000, 3, { scrap: 16, shard: 16, starglass: 6, voidsilk: 8, sunsteel: 5 }, 'sunforge');
  gear('sunforged_gauntlets', 'armor', 52, 5500, 3, { scrap: 24, shard: 10, emberore: 6, sunsteel: 3 }, 'sunforge');
  gear('glasswoven_gloves', 'armor', 52, 5500, 3, { scrap: 10, shard: 10, starglass: 5, sunsteel: 3 }, 'sunforge');
  gear('sunforged_greaves', 'armor', 52, 5500, 3, { scrap: 24, shard: 10, emberore: 6, sunsteel: 3 }, 'sunforge');
  gear('voidstep_boots', 'armor', 52, 5500, 3, { scrap: 10, shard: 10, voidsilk: 6, sunsteel: 3 }, 'sunforge');
  gear('sunheart_amulet', 'jewel', 52, 6000, 3, { shard: 14, starglass: 4, lampresin: 4, sunsteel: 3 }, 'sunforge');
  gear('corona_ring', 'jewel', 52, 6000, 3, { shard: 14, emberore: 6, lampresin: 4, sunsteel: 3 }, 'sunforge');
  gear('noon_lantern', 'lantern', 54, 9000, 4, { scrap: 20, shard: 14, lampresin: 10, sunsteel: 5 }, 'sunforge');

  const brew = (id, n, gold, lvl, mats, flag) => {
    const r = { n: CONS[id].n, cat: 'consumable', out: { cons: id, n }, mats, gold, lvl };
    if (flag) r.flag = flag;
    RECIPES['brew_' + id] = r;
  };
  brew('greaterdraught', 3, 90, 40, { gloamcap: 3, emberore: 1 });
  brew('greatersalts', 3, 90, 40, { gloamcap: 3, starglass: 1 });
  brew('lightflask', 3, 60, 40, { lampresin: 2, scrap: 3 });
  brew('warelixir', 2, 140, 41, { emberore: 3, gloamcap: 2 });
  brew('stoneskin', 2, 140, 41, { scrap: 6, emberore: 2 });
  brew('wardsalt', 2, 140, 42, { shard: 3, starglass: 1 });
  brew('nighttonic', 3, 100, 41, { gloamcap: 4, voidsilk: 1 });
  brew('sunbomb', 3, 180, 44, { emberore: 4, scrap: 4, lampresin: 1 });
  brew('voidbomb', 3, 180, 44, { voidsilk: 2, shard: 3 });
  brew('phoenixash', 1, 2000, 50, { emberore: 6, sunsteel: 1, lampresin: 4 }, 'sunforge');
  brew('emberdraught', 2, 200, 42, { emberore: 2, gloamcap: 2, lampresin: 1 });
  brew('starwater', 1, 1500, 46, { starglass: 4, lampresin: 3, gloamcap: 3 });

  const rune = (id, gold, lvl, mats, flag) => {
    const r = { n: RUNES[id].n, cat: 'rune', out: { rune: id }, mats, gold, lvl };
    if (flag) r.flag = flag;
    RECIPES['rune_' + id] = r;
  };
  rune('embers', 300, 40, { shard: 6, emberore: 2 });
  rune('frost', 300, 40, { shard: 6, starglass: 1 });
  rune('ash', 300, 40, { shard: 6, emberore: 2 });
  rune('glass', 300, 41, { shard: 6, starglass: 2 });
  rune('wick', 300, 41, { shard: 6, lampresin: 1 });
  rune('briars', 300, 41, { shard: 6, scrap: 6 });
  rune('stars', 900, 44, { shard: 10, emberore: 4, starglass: 3 });
  rune('veils', 900, 44, { shard: 10, voidsilk: 3, starglass: 1 });
  rune('iron', 900, 44, { shard: 10, scrap: 12, emberore: 4 });
  rune('hunger', 900, 45, { shard: 10, voidsilk: 3, emberore: 3 });
  rune('vigil', 900, 45, { shard: 10, lampresin: 3, emberore: 3 });
  rune('nine', 2500, 52, { shard: 16, sunsteel: 3, lampresin: 4, starglass: 4 }, 'sunforge');
  rune('noon', 2500, 50, { shard: 16, sunsteel: 2, emberore: 6 }, 'sunforge');
  rune('eclipse', 2500, 50, { shard: 16, sunsteel: 2, starglass: 6, voidsilk: 3 }, 'sunforge');
  rune('sunforge', 2500, 50, { shard: 16, sunsteel: 3, emberore: 8, scrap: 14 }, 'sunforge');
  rune('dawn', 2500, 52, { shard: 16, sunsteel: 2, lampresin: 6 }, 'sunforge');

  Object.assign(G.D.CONS, CONS);
  Object.assign(G.D.MATS, MATS);
  Object.assign(G.D.QITEMS, QITEMS);
  G.D.MAT_DROPS = MAT_DROPS;
  G.D.RECIPES = Object.assign(G.D.RECIPES || {}, RECIPES);
  G.D.RUNES = Object.assign(G.D.RUNES || {}, RUNES);
  G.D.NEW_ITEM_IDS.cons = Object.keys(CONS);
  G.D.NEW_ITEM_IDS.mats = Object.keys(MATS);
  G.D.NEW_ITEM_IDS.qitems = Object.keys(QITEMS);
  G.D.NEW_ITEM_IDS.runes = Object.keys(RUNES);
})();
