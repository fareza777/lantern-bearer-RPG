/* World text: intro, onboarding, tips, NPCs, rumors, codex, endings */
G.D.INTRO = [
  { img: 'keyart', lines: ['Three hundred years ago, the Sun-Choir sang the dawn.', 'Every morning, from the Cathedral of the Hundred Bells, their hymn lifted the sun over the Reach.'] },
  { img: 'zone3', lines: ['Then, on the last morning, one voice sang the wrong note.', 'The Bell of First Light cracked. The sun never rose again.'] },
  { img: 'zone2', lines: ['From the crack poured the Gloam, a living dusk.', 'It drowned the roads, woke the dead, and hollowed the minds of the living.'] },
  { img: 'town', lines: ['Only Candlemere endures, huddled around the Undying Wick, the last flame that remembers the sun.', 'And now the Wick is guttering.'] },
  { img: 'zone1', lines: ['The Vigil sends Lanternbearers into the dark, each carrying an ember of the Wick.', 'Few return. None have reached the Cathedral.'] },
  { img: 'keyart', lines: ['You wake on the pyre-steps of Candlemere with a lantern in your hand.', 'Your name is all you remember. The dark is waiting.'] },
];

G.D.ONBOARD = [
  { ic: 'lantern', t: 'You are a Lanternbearer', d: 'Candlemere is the last lit town in the Reach. Take quests in town, descend into the dark, and come back stronger, if you come back at all.' },
  { ic: 'map', t: 'Explore by tapping rooms', d: 'Each dungeon floor is a map hidden in darkness. Tap a glowing room next to you to move there. Find the stairs to go deeper. Your lantern burns Light with every step.' },
  { ic: 'swords', t: 'Read your enemy', d: 'Combat is turn-based. Every enemy shows its intent: what it will do next. When a foe is Charging, Defend or stun it before the blow lands.' },
  { ic: 'eye', t: 'Beware the Dread', d: 'Darkness, horrors and terrible choices raise your Dread. High Dread weakens you, and at 100 you may freeze in terror. Keep your lantern lit and rest at the Chapel.' },
  { ic: 'star', t: 'Grow your legend', d: 'Level up to earn attribute and skill points. Find, upgrade and salvage gear. Complete main quests, side quests and bounties. Your choices shape your build and your story.' },
];

G.D.TIPS = {
  town: { t: 'Candlemere', d: 'This is your hub. The <b>Wardens\' Hall</b> gives main quests and bounties. The <b>Inn</b> heals you and offers side quests. Buy supplies at the <b>Apothecary</b> and gear at the <b>Smithy</b>. When ready, head to the <b>Gate</b>.' },
  gate: { t: 'Choosing an Expedition', d: 'Pick a region and a starting floor. You can start from any floor you have already reached. Bring Red Draughts and Wick Oil, since you cannot shop in the dark (usually).' },
  dungeon: { t: 'Into the Dark', d: 'Tap a highlighted room next to yours to move. Every step costs Light. Rooms you can make out show an icon. At the <b>stairs</b> you can descend, or climb back up to town from the <b>entrance</b>.' },
  combat: { t: 'Combat', d: 'Tap an enemy to target it. <b>Attack</b> is free. <b>Skills</b> cost Focus, which regenerates each turn. <b>Defend</b> halves damage and restores Focus. Watch the intent under each enemy.' },
  event: { t: 'Choices', d: 'Events offer choices. Some require a stat check: the percentage shown is your chance to succeed. Higher attributes and levels improve your odds.' },
  levelup: { t: 'Level Up!', d: 'You gained attribute points and a skill point. Open <b>Hero</b> to raise attributes and <b>Skills</b> to learn or improve abilities.' },
  dread: { t: 'Dread Rising', d: 'Your Dread is high. At 40 you are Uneasy, at 70 Haunted, at 100 Broken. Use a Hushleaf Tonic, pray at shrines, or visit the Chapel in town.' },
  light: { t: 'Your Lantern Dims', d: 'When Light runs out, every step raises Dread and ambushes become likely. Use Wick Oil from your bag, or return to town.' },
  death: { t: 'Fallen', d: 'You were dragged back to Candlemere. You lost some gold and everything you found during this expedition that was not equipped. Your level and gear remain.' },
  smith: { t: 'The Smithy', d: 'Buy gear, <b>upgrade</b> items with gold and Iron Scrap, or <b>salvage</b> unwanted items into materials. Higher upgrades need Gloam Shards.' },
};

G.D.NPCS = {
  maelis: { n: 'Maelis Thorn', title: 'Vigil-Keeper', greet: ['"Another dawn that isn\'t. Speak, Lanternbearer."', '"The Wick grows thinner every hour. So do we."', '"I have buried forty Lanternbearers. Do not be forty-one."'] },
  hesk: { n: 'Hesk Morrow', title: 'Innkeeper of the Guttering Candle', greet: ['"Sit. Drink. Pretend it\'s morning, like the rest of us."', '"Rooms are cheap. Sleep is expensive these days."', '"You look like the dark chewed on you. Good sign. Means it spat you out."'] },
  orla: { n: 'Orla Brand', title: 'Smith of the Anvil & Ash', greet: ['"Steel doesn\'t care if the sun rises. That\'s why I like it."', '"Bring me scrap and coin and I\'ll make you harder to kill."', '"Mind the sparks. They\'re the only warm thing left in this town."'] },
  wren: { n: 'Wren Halloway', title: 'Apothecary of Bitterroot & Bone', greet: ['"Tinctures, tonics, draughts. Don\'t ask what\'s in them."', '"Drink the red one if you\'re bleeding. Drink the green one if you\'re seeing things."', '"I can\'t cure the dark. But I can make it hurt less."'] },
  caddoc: { n: 'Father Caddoc', title: 'Keeper of the Chapel of the Wick', greet: ['"The flame remembers you, child. Even when you forget yourself."', '"Kneel. Let the Wick burn the whispers out of you."', '"Faith is not believing the sun will rise. It is lighting a candle anyway."'] },
  osk: { n: 'Brother Osk', title: 'Curio-Monger', greet: ['"You freed me from a cage, so I will only overcharge you a little."', '"Things from the deep. Still warm, some of them."', '"Every relic has a story. Most end badly. Buy one anyway."'] },
  anselle: { n: 'Anselle', title: 'Widow of the Well', greet: ['"My daughter walked the Pilgrim\'s Road. She wore my locket."', '"I sit by the well because the water used to reflect the sky."'] },
  tamsin: { n: 'Tamsin Reed', title: 'Huntress of the North Gate', greet: ['"Eyes up, Lanternbearer. The Gallows Wood has been hungry this winter."', '"I count wolves by the howls. Lately I need two hands."', '"The gate holds because I hold it. Keep it that way by coming back."'] },
  marrow: { n: 'Scribe Marrow', title: 'Last Keeper of the Archive', greet: ['"I shelved ten thousand books. I carry the catalogue in my head, since the shelves are ash."', '"Do not tap the books you find down there. Some of them tap back."', '"A library is a fire that has not happened yet. The Archive simply... happened."'] },
};

G.D.RUMORS = [
  'Hesk leans close: "They say a gambling skeleton in the Barrows cheats, but he pays up if you catch him."',
  'A drunk Lanternbearer mutters: "Don\'t drink from the black fountains. Or do. I did. Now I can hear colours."',
  'Hesk wipes a mug: "Mother Brine calls every corpse her child. Don\'t let her adopt you."',
  'A pilgrim whispers: "The Weeping Knight was a good man once. He failed, and failure is a heavier armor than steel."',
  'Hesk nods at the door: "If your lantern goes out down there, you\'ll hear them before you see them."',
  'A scribe says: "The Cantor didn\'t go mad. That\'s the frightening part. He knew exactly what he was doing."',
  'Hesk: "Wick-Eater Moths drink light. Shield your lantern, or you\'ll be walking home blind."',
  'A child tugs your sleeve: "My brother says if you pray at a weeping shrine, the saint cries for you instead."',
  'Hesk: "When a big one starts charging, block. Every veteran learns that once. The others don\'t get a second lesson."',
  'An old warden coughs: "Upgrade your armor before the Mire. The Boar there has killed more of us than any witch."',
  'Hesk: "Gloam Shards come from the nastiest things down there. Orla needs them for serious smithing."',
  'A tired priest: "Saint Ivel walked into the Gloam and came back. His lantern must still be somewhere in the Cathedral."',
  'Tamsin checks a bolt: "Gloam wolves hunt warmth. Sleep cold and they walk past you. Cold is a feeling. Choose it."',
  'Marrow whispers: "If a book in the Archive is warm, it is reading you back. Put it down gently."',
  'Hesk polishes a glass: "The Court sends invitations sometimes. Cream paper, frost on the seal. Burn them. Nobody who danced there came home."',
  'A gate guard yawns: "The Shepherd rings his bell at moonless midnight. The wolves answer. I have stopped counting which of them answers twice."',
  'Marrow: "Quillon erased his name from the catalogue. I know, because there is a hole in my memory shaped exactly like him."',
  'Hesk: "In the Gloamheart, your shadow lags behind. That is not a warning about the dark. It is a warning about your shadow."',
  'Tamsin: "The Gibbet Hound wears its cage. Hit the cage and you only teach it the direction of your arm."',
  'Marrow hugs a book: "The folio says the scholars fed the Gloam one name a year. The last page lists three hundred names. The ink of the last one is still wet."',
  'Hesk refills your cup: "They say the Queen keeps one chair at her table always set, always empty. It is for the sun. She expects it to apologise."',
  'An old warden shivers: "The Undercroft repeats floors, but listen: the second time through, the whispers know things you only thought the first time."',
];

G.D.CODEX = {
  wick: { n: 'The Undying Wick', cat: 'World', txt: 'A flame on a pillar of black stone at the heart of Candlemere. The Vigil claims it was lit from the last ray of the sun. It needs no oil, but it does need faith, and faith is running low.' },
  gloam: { n: 'The Gloam', cat: 'World', txt: 'Not darkness, but a living dusk. It seeps into the mind as easily as into a cellar. Those who stay in it too long begin to hear it think. Those who stay longer begin to agree with it.' },
  bell: { n: 'The Bell of First Light', cat: 'World', txt: 'The greatest of the Hundred Bells, cast from bronze and sunlight. Each dawn the Sun-Choir sang, the Bell answered, and the sun rose. Three hundred years ago it cracked from crown to lip.' },
  vigil: { n: 'The Vigil', cat: 'Factions', txt: 'An order of wardens sworn to keep the Wick alight. Once a thousand strong, now fewer than thirty. Their oath ends: "I will be the lantern when there is no light."' },
  lanternbearers: { n: 'The Lanternbearers', cat: 'Factions', txt: 'Vigil wardens who carry embers of the Wick into the Gloam. The walls of the Crypt of the Nameless hold four hundred names. Yours is not there yet.' },
  sunchoir: { n: 'The Sun-Choir', cat: 'Factions', txt: 'One hundred singers who lived and died inside the Cathedral. Their hymn had no end. When a singer\'s voice failed, another took their place. The Choir never stopped. Until it did.' },
  candlemere: { n: 'Candlemere', cat: 'World', txt: 'A market town built around the Wick. When the Gloam came, refugees poured in. Now twelve thousand souls live on streets built for two thousand, and every window holds a candle.' },
  barrows: { n: 'The Hollow Barrows', cat: 'Regions', txt: 'Burial tunnels beneath Candlemere. The Vigil buried its dead here with a candle in each hand. The candles went out one by one, and the dead began to walk toward the last light: the town above.' },
  grevald: { n: 'Grevald the Gravedigger', cat: 'Figures', txt: 'A gravedigger who spent forty years burying Lanternbearers. When the dead rose, they did not attack him; they knelt. He found a crown in a Vigil tomb and decided he deserved it.' },
  mire: { n: 'The Weeping Mire', cat: 'Regions', txt: 'The Pilgrim\'s Road once ran dry and straight to the Cathedral. When the sun died, the rivers forgot their banks. Now the road lies under black water, and the pilgrims are still on it.' },
  aldric: { n: 'Sir Aldric Vane', cat: 'Figures', txt: 'A Vigil knight who escorted the last pilgrim caravan into the Mire. The water rose in a single night. He held a child above his head until his arms gave out. He has been weeping ever since.' },
  brine: { n: 'Mother Brine', cat: 'Figures', txt: 'She was a midwife named Hollis Brine who lost every child she delivered to the Gloam. She drowned her village so that no one would ever leave her again. Now every corpse in the Mire calls her Mother.' },
  cathedral: { n: 'Cathedral of the Hundred Bells', cat: 'Regions', txt: 'Built over a spring that never froze, its bells were cast from the melted crowns of a hundred kings. It stands on the far side of the Mire, half-drowned and humming.' },
  cantor: { n: 'The Hollow Cantor', cat: 'Figures', txt: 'The First Voice of the Sun-Choir, known only as the Cantor. He sang every dawn for sixty years. On the last morning he sang one wrong note, clear and deliberate, and smiled as the Bell broke.' },
  wrongnote: { n: 'The Price of Dawn', cat: 'Secrets', txt: 'The stained glass tells what the Vigil never did: the dawn hymn required a voice to give out completely each morning. One singer a day was sung to death so the sun would rise. The Cantor counted sixty years of dead friends. Then he chose darkness.' },
  ivel: { n: 'Saint Ivel', cat: 'Figures', txt: 'The only person known to have walked into the Gloam and returned. He said the dark was not evil, only hungry, and that hunger can be refused. He went back in a second time and was not seen again.' },
  mirror: { n: 'What the Mirror Showed', cat: 'Secrets', txt: 'In the mirror you saw yourself kneeling in the Cathedral, singing. Your mouth was open very wide. There was light coming out of it. You did not look happy.' },
  dread: { n: 'Vigil Manual: On Dread', cat: 'Guidance', txt: 'Dread is not cowardice. It is the Gloam speaking to you. Answer it with light, prayer and rest. Never answer it with silence. Silence is how it wins.' },
  tobin: { n: 'Mad Tobin', cat: 'Figures', txt: 'A peddler who sells in the deep places. He claims he died years ago and simply never stopped working. His prices suggest he may be telling the truth.' },
  first: { n: 'The First Lanternbearer', cat: 'Secrets', txt: 'The oldest name in the Crypt of the Nameless has been scratched away and rewritten many times. Each time the handwriting is different. Each time it is the same name. It is always the name of the newest Lanternbearer.' },
  archive: { n: 'The Ashen Archive', cat: 'Regions', txt: 'The library of the Scholars of the Reach, which burned on the first night of the Gloam, though no fire was ever lit in it. The books burned from the inside, one page at a time, starting with the indexes.' },
  gallows: { n: 'The Gallows Wood', cat: 'Regions', txt: 'A forest of black trees north of Candlemere where the Vigil once hanged deserters. The practice ended a century ago. The trees kept the habit: every branch holds a noose, and the nooses are never empty for long.' },
  court: { n: 'The Sunless Court', cat: 'Regions', txt: 'The palace of the old nobility, sealed against the dark with ice and etiquette. The nobles feed on warmth now, and a guest with warm blood is the rarest delicacy on the menu.' },
  gloamheart: { n: 'The Gloamheart', cat: 'Regions', txt: 'The inside of the dark. Not a place so much as a body: veins, membranes, a heartbeat you feel through your boots. Everything the Gloam has ever swallowed is in here somewhere, still digesting.' },
  quillon: { n: 'Quillon the Unwritten', cat: 'Figures', txt: 'Master of the Archive. When he learned the Gloam finds minds by their names, he erased his own from every book, every plaque, every memory. It worked. The Hunger could not find him, so it simply wore what was left.' },
  isolde: { n: 'Queen Isolde the Pale', cat: 'Figures', txt: 'She held the last ball on the last night, and when the sun failed she declared the ball would continue forever. Her courtiers have been dancing for three hundred years. She loves each of them dearly, the way one loves a meal.' },
  shepherd: { n: 'The Hanged Shepherd', cat: 'Figures', txt: 'A deserter the Vigil hanged in the Wood. The Gloam gave him back his legs but not his rest. He herds gloam-wolves with a bronze bell, patrolling the trees, still trying to finish a watch that will never end.' },
  tamsin: { n: 'Tamsin Reed', cat: 'Figures', txt: 'The only hunter the north gate has ever needed. She lost her family to a gloam-wolf pack and answered by learning the Wood better than the wolves do. She has a standing bet with Hesk that she will die standing up.' },
  marrow: { n: 'Scribe Marrow', cat: 'Figures', txt: 'Last Keeper of the Archive. He memorised the entire catalogue as an apprentice party trick. Now it is the only copy. He recites shelf-marks in his sleep, and weeps when he reaches the ones that are ash.' },
  ivel_truth: { n: 'What Ivel Learned', cat: 'Secrets', txt: 'Ivel\'s second walk was a bargain, not a quest. He offered the Gloam his own endless faith to chew on, forever, if it would slow its feeding on the world. It agreed. It is still chewing. That is why Candlemere has lasted this long.' },
  hunger: { n: 'The Hunger', cat: 'Secrets', txt: 'The Gloam does not hate the light. It does not hate anything. It is a stomach that learned to think, and it thinks about one thing. Saint Ivel called it "the loneliest thing that has ever existed".' },
  scholars: { n: 'The Scholars of the Reach', cat: 'Factions', txt: 'They studied the Gloam the way surgeons study a fever: by feeding it, carefully, and taking notes. The restricted stacks record what they fed it. The list starts with candle-smoke and ends with names.' },
  secondbell: { n: 'The Second Bell', cat: 'Secrets', txt: 'The Hundred Bells were cast in pairs. For every voice that rang in the Cathedral, a twin bell hung silent in the Undercroft, "for the day the first voice fails". The Vigil does not speak of the Second Bells. The Gloam rings them at night.' },
  candlewights: { n: 'Candle Wights', cat: 'Bestiary', txt: 'Corpses that crawl toward any flame and wear what they catch. A Candle Wight is not honouring the dead candles it carries. It is digesting them, slowly, the way the Gloam digests everything: with patience.' },
  gloamwolves: { n: 'Gloam Wolves', cat: 'Bestiary', txt: 'Wolves that ran into the dark and came back as its hounds. They do not hunt for food; they hunt for warmth, and a camped Lanternbearer is the warmest thing in the Wood.' },
  hollowedones: { n: 'The Hollowed', cat: 'Bestiary', txt: 'Lanternbearers who fell in the deep places and got back up. The Gloam wears them like coats. Their lanterns are dark, but their hands still remember the grip, and that is the saddest thing in the world.' },
  palecourt: { n: 'Court Etiquette, Revised', cat: 'Secrets', txt: 'A page from the Court\'s rulebook: "A guest who refuses the dance three times is served for dinner. A guest who dances well is kept. There are no other exits." The margin notes are in two hands, and both are hungry.' },
  frostseal: { n: 'The Frost Seal', cat: 'Secrets', txt: 'The nobles did not lock the stair to the Heart to keep the world out. They locked it to keep the Heart in, after it whispered up the stairwell that it found their dancing beautiful, and asked for an encore.' },
  undercroft2: { n: 'Vigil Manual: On the Undercroft', cat: 'Guidance', txt: 'The Endless Undercroft is where the Gloam keeps what it cannot digest. Floors repeat, but the repetitions drift, the way a song drifts when the singer is dying. Count your floors. Leave marks. Do not trust your marks.' },
  tobin_deep: { n: 'Tobin\'s Ledger', cat: 'Secrets', txt: 'Mad Tobin keeps a ledger of everything he has sold in the deep places, and to whom. Several entries record sales to customers who were, at the time, floors above him. One entry records a sale to you. It is dated next week.' },
  marrow_oath: { n: 'The Keeper\'s Oath', cat: 'Factions', txt: 'Archivists swear to "keep the words until the words are safe". Marrow is the last of them, and he still shelves the handful of rescued books every night, in an empty room, in an order only he remembers.' },
};

G.D.ENDINGS = {
  ring: {
    t: 'The Dawn Returns',
    slides: [
      { img: 'zone3', lines: ['You set the ember of the Wick into the cracked Bell and begin to sing.', 'You do not know the words. The Bell teaches them to you.'] },
      { img: 'keyart', lines: ['Your voice gives out at the final verse, as it was always meant to.', 'Far above, for the first time in three hundred years, the sky turns grey, then gold.'] },
      { img: 'town', lines: ['In Candlemere, twelve thousand people step into the street and weep in the sunlight.', 'The Vigil carves a new name into the Crypt. Tomorrow, someone else must sing.'] },
    ],
  },
  silence: {
    t: 'The Long Dusk',
    slides: [
      { img: 'zone3', lines: ['You lower your lantern. The Bell stays silent.', 'No one else will be sung to death for a sunrise.'] },
      { img: 'zone2', lines: ['The Gloam does not end. But without the Cantor, it no longer hungers.', 'Slowly, the dead lie down in the black water and rest.'] },
      { img: 'town', lines: ['You carry the Wick\'s ember back to Candlemere and light a second flame, then a third.', 'The world will be lit by human hands from now on. It will be enough. It will have to be.'] },
    ],
  },
  ember: {
    t: 'The Last Lantern',
    slides: [
      { img: 'c_heart', lines: ['You open your lantern and offer the Heart your own ember, and yourself with it.', 'The Hunger takes you gently, the way a wave takes a candle.'] },
      { img: 'c_ivel', lines: ['Ivel bows his hidden face and steps out of the dark at last, light as ash.', '"Tell them," he says, "the watch is over. Someone is keeping it." Then he is gone, and you are the flame.'] },
      { img: 'c_dawn', lines: ['Above, a pale dawn rises, thin but true, and it does not ask for a voice.', 'In Candlemere the Wick burns brighter than it has in three hundred years. No one knows why. Maelis knows why.'] },
      { img: 'town', lines: ['The Vigil carves two names into the Crypt that day, side by side.', 'The lanterns of the Reach never go out now. Somewhere in the deep, something warm is keeping them lit.'] },
    ],
  },
  hunger: {
    t: 'The Gentle Dark',
    slides: [
      { img: 'c_heart', lines: ['You reach into the Heart and take the Hunger into yourself.', 'It comes willingly. It has been so lonely, and you are so warm.'] },
      { img: 'c_ivel', lines: ['Ivel is free. He looks at you with the shadow where his face was, and he is smiling; you can tell.', '"Walk softly," he says, "and it will follow you like a fed hound."'] },
      { img: 'zone7', lines: ['You walk out into the deep dark, and the dark walks with you, gentle as dusk.', 'It does not feed on the world anymore. It feeds on you, and you are endless, and content.'] },
      { img: 'town', lines: ['In Candlemere the nights grow quiet. The dead rest. The fog thins to a grey that children are no longer afraid of.', 'On moonless nights, at the edge of the Wood, a single lantern is seen walking. It is not hunting. It is herding the dark home.'] },
    ],
  },
};
