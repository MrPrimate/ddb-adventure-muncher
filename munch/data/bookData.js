const sources = [
  {
    id: 1,
    name: "BR",
    description: "Basic Rules (2014)",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/136/637248073409717512.jpeg",
    sourceURL: "sources/dnd/basic-rules-2014",
  },
  {
    id: 2,
    name: "PHB",
    description: "Player’s Handbook (2014)",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/389/637248131811862290.jpeg",
    sourceURL: "sources/dnd/phb-2014",
  },
  {
    id: 3,
    name: "DMG",
    description: "Dungeon Master’s Guide (2014)",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/593/637245347063211867.jpeg",
    sourceURL: "sources/dnd/dmg-2014",
  },
  {
    id: 4,
    name: "EE",
    description: "Elemental Evil Player's Companion",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: "",
  },
  {
    id: 5,
    name: "MM",
    description: "Monster Manual (2014)",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/816/637248105832999293.jpeg",
    sourceURL: "sources/dnd/mm-2014",
  },
  {
    id: 6,
    name: "CoS",
    description: "Curse of Strahd",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10349/296/637244603965977140.jpeg",
    sourceURL: "sources/dnd/cos",
  },
  {
    id: 7,
    name: "HotDQ",
    description: "Hoard of the Dragon Queen",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10432/68/637247937818392417.jpeg",
    sourceURL: "sources/dnd/hotdq",
  },
  {
    id: 8,
    name: "LMoP",
    description: "Lost Mine of Phandelver",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/616/637248096401764265.jpeg",
    sourceURL: "sources/dnd/lmop",
  },
  {
    id: 9,
    name: "OotA",
    description: "Out of the Abyss",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19/735/636383500945700817.jpeg",
    sourceURL: "sources/dnd/oota",
  },
  {
    id: 10,
    name: "PotA",
    description: "Princes of the Apocalypse",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/524/637248137744435932.jpeg",
    sourceURL: "sources/dnd/pota",
  },
  {
    id: 11,
    name: "RoT",
    description: "Rise of Tiamat",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/605/637248141604547323.jpeg",
    sourceURL: "sources/dnd/rot",
  },
  {
    id: 12,
    name: "SKT",
    description: "Storm King's Thunder",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19/740/636383501361665378.jpeg",
    sourceURL: "sources/dnd/skt",
  },
  {
    id: 13,
    name: "SCAG",
    description: "Sword Coast Adventurer's Guide",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/793/637248149475504723.jpeg",
    sourceURL: "sources/dnd/scag",
  },
  {
    id: 14,
    name: "TftYP",
    description: "Tales from the Yawning Portal",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/177/637248652153094716.jpeg",
    sourceURL: "sources/dnd/tftyp",
  },
  {
    id: 15,
    name: "VGtM",
    description: "Volo's Guide to Monsters",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/464/637248679743732719.jpeg",
    sourceURL: "sources/dnd/vgtm",
  },
  {
    id: 16,
    name: "TSC",
    description: "The Sunless Citadel",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/402/637248674372576676.jpeg",
    sourceURL: "",
  },
  {
    id: 17,
    name: "TFoF",
    description: "The Forge of Fury",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10436/4/637248156999902689.jpeg",
    sourceURL: "",
  },
  {
    id: 18,
    name: "THSoT",
    description: "The Hidden Shrine of Tamoachan",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/236/637248657347161458.jpeg",
    sourceURL: "",
  },
  {
    id: 19,
    name: "WPM",
    description: "White Plume Mountain",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/751/637248705560259195.jpeg",
    sourceURL: "",
  },
  {
    id: 20,
    name: "DiT",
    description: "Dead in Thay",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/246/637248079254127234.jpeg",
    sourceURL: "",
  },
  {
    id: 21,
    name: "AtG",
    description: "Against the Giants",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10433/315/637248029897296032.jpeg",
    sourceURL: "",
  },
  {
    id: 22,
    name: "ToH",
    description: "Tomb of Horrors",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/371/637248671854035769.jpeg",
    sourceURL: "",
  },
  {
    id: 25,
    name: "ToA",
    description: "Tomb of Annihilation",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/339/637248669136195626.jpeg",
    sourceURL: "sources/dnd/toa",
  },
  {
    id: 26,
    name: "CoSCO",
    description: "Curse of Strahd: Character Options",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10349/289/637244603748885696.jpeg",
    sourceURL: "",
  },
  {
    id: 27,
    name: "XGtE",
    description: "Xanathar's Guide to Everything",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/803/637248709455777906.jpeg",
    sourceURL: "sources/dnd/xgte",
  },
  {
    id: 28,
    name: "TTP",
    description: "The Tortle Package",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39/300/636411199124473334.png",
    sourceURL: "sources/dnd/ttp",
  },
  {
    id: 29,
    name: "UA-2014",
    description: "Unearthed Arcana 2014",
    sourceCategoryId: 3,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/100/464/636506973225556542.png",
    sourceURL: "",
  },
  {
    id: 31,
    name: "CR",
    description: "Critical Role",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: "",
  },
  {
    id: 33,
    name: "MToF",
    description: "Mordenkainen’s Tome of Foes",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/949/637248111148617766.jpeg",
    sourceURL: "sources/dnd/mtof",
  },
  {
    id: 34,
    name: "DDIA-MORD",
    description: "Rrakkma",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/319/345/636622116959280867.jpeg",
    sourceURL: "sources/dnd/ddia-mord",
  },
  {
    id: 35,
    name: "WDH",
    description: "Waterdeep: Dragon Heist",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/343/499/636632335939805190.jpeg",
    sourceURL: "sources/dnd/wdh",
  },
  {
    id: 36,
    name: "WDotMM",
    description: "Waterdeep: Dungeon of the Mad Mage",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/493/637248684031810278.jpeg",
    sourceURL: "sources/dnd/wdotmm",
  },
  {
    id: 37,
    name: "WGtE",
    description: "Wayfinder's Guide to Eberron",
    sourceCategoryId: 8,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/715/637248702538222765.jpeg",
    sourceURL: "sources/dnd/wgte",
  },
  {
    id: 38,
    name: "GGtR",
    description: "Guildmasters’ Guide to Ravnica",
    sourceCategoryId: 7,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40948/83/638476689241305817.jpeg",
    sourceURL: "sources/dnd/ggtr",
  },
  {
    id: 40,
    name: "LLoK",
    description: "Lost Laboratory of Kwalish",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/498/637248091075319276.jpeg",
    sourceURL: "sources/dnd/llok",
  },
  {
    id: 41,
    name: "DoIP",
    description: "Dragon of Icespire Peak",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/957/637244676648122088.jpeg",
    sourceURL: "sources/dnd/doip",
  },
  {
    id: 42,
    name: "TMR",
    description: "Tactical Maps Reincarnated",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/5336/630/636850745475942698.jpeg",
    sourceURL: "",
  },
  {
    id: 43,
    name: "GoS",
    description: "Ghosts of Saltmarsh",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10370/66/637245493047936420.jpeg",
    sourceURL: "sources/dnd/gos",
  },
  {
    id: 44,
    name: "AI",
    description: "Acquisitions Incorporated",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/905/637244674570907870.jpeg",
    sourceURL: "sources/dnd/ai",
  },
  {
    id: 47,
    name: "HftT",
    description: "Hunt for the Thessalhydra",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10432/12/637247932786703735.jpeg",
    sourceURL: "sources/dnd/hftt",
  },
  {
    id: 48,
    name: "BGDiA",
    description: "Baldur’s Gate: Descent into Avernus",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/927/637244675832719441.jpeg",
    sourceURL: "sources/dnd/bgdia",
  },
  {
    id: 49,
    name: "ERftLW",
    description: "Eberron: Rising from the Last War",
    sourceCategoryId: 8,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10368/6/637245381196842264.jpeg",
    sourceURL: "sources/dnd/erftlw",
  },
  {
    id: 50,
    name: "SLW",
    description: "Storm Lord’s Wrath",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/964/637244676927254855.jpeg",
    sourceURL: "sources/dnd/slw",
  },
  {
    id: 51,
    name: "SDW",
    description: "Sleeping Dragon’s Wake",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/959/637244676820916158.jpeg",
    sourceURL: "sources/dnd/sdw",
  },
  {
    id: 52,
    name: "DC",
    description: "Divine Contention",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/951/637244676535367295.jpeg",
    sourceURL: "sources/dnd/dc",
  },
  {
    id: 53,
    name: "SAC",
    description: "Sage Advice Compendium",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/702/637248145947271474.jpeg",
    sourceURL: "sources/dnd/sac",
  },
  {
    id: 54,
    name: "DDvRaM",
    description: "Dungeons &amp; Dragons vs. Rick and Morty",
    sourceCategoryId: 10,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/229/637245316031917098.jpeg",
    sourceURL: "sources/dnd/ddvram",
  },
  {
    id: 55,
    name: "LR",
    description: "Locathah Rising",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/650/637248098360957592.jpeg",
    sourceURL: "sources/dnd/lr",
  },
  {
    id: 56,
    name: "IMR",
    description: "Infernal Machine Rebuild",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/395/637248086063224834.jpeg",
    sourceURL: "sources/dnd/imr",
  },
  {
    id: 57,
    name: "MFFV1",
    description: "Mordenkainen's Fiendish Folio Volume 1",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/743/637248102793792401.jpeg",
    sourceURL: "sources/dnd/mffv1",
  },
  {
    id: 58,
    name: "SD",
    description: "Sapphire Dragon",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/899/637248153278056972.jpeg",
    sourceURL: "",
  },
  {
    id: 59,
    name: "EGtW",
    description: "Explorer's Guide to Wildemount",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/769/637245363413951140.jpeg",
    sourceURL: "sources/dnd/egtw",
  },
  {
    id: 60,
    name: "OGA",
    description: "One Grung Above",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/68/637248116464990081.jpeg",
    sourceURL: "sources/dnd/oga",
  },
  {
    id: 61,
    name: "MOoT",
    description: "Mythic Odysseys of Theros",
    sourceCategoryId: 7,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/885/637248108609488365.jpeg",
    sourceURL: "sources/dnd/moot",
  },
  {
    id: 62,
    name: "WA",
    description: "Frozen Sick",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/9193/755/637200909525723425.jpeg",
    sourceURL: "sources/dnd/wa",
  },
  {
    id: 66,
    name: "IDRotF",
    description: "Icewind Dale: Rime of the Frostmaiden",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/11095/550/637278965847502335.jpeg",
    sourceURL: "sources/dnd/idrotf",
  },
  {
    id: 67,
    name: "TCoE",
    description: "Tasha’s Cauldron of Everything",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/13665/613/637400361423035085.jpeg",
    sourceURL: "sources/dnd/tcoe",
  },
  {
    id: 68,
    name: "CM",
    description: "Candlekeep Mysteries",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/14917/783/637456355214291364.jpeg",
    sourceURL: "sources/dnd/cm",
  },
  {
    id: 69,
    name: "VRGtR",
    description: "Van Richten’s Guide to Ravenloft",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/15973/81/637496917952314322.jpeg",
    sourceURL: "sources/dnd/vrgtr",
  },
  {
    id: 79,
    name: "TWBtW",
    description: "The Wild Beyond the Witchlight",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/18223/997/637587419509160992.jpeg",
    sourceURL: "sources/dnd/twbtw",
  },
  {
    id: 80,
    name: "SACoC",
    description: "Strixhaven: A Curriculum of Chaos",
    sourceCategoryId: 7,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/18228/52/637587668398315568.jpeg",
    sourceURL: "sources/dnd/sacoc",
  },
  {
    id: 81,
    name: "FToD",
    description: "Fizban's Treasury of Dragons",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19075/983/637620380256293999.jpeg",
    sourceURL: "sources/dnd/ftod",
  },
  {
    id: 83,
    name: "CotN",
    description: "Critical Role: Call of the Netherdeep",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/20906/943/637695655261542821.jpeg",
    sourceURL: "sources/dnd/cotn",
  },
  {
    id: 85,
    name: "MotM",
    description: "Mordenkainen Presents: Monsters of the Multiverse",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/22937/354/637776964748720726.jpeg",
    sourceURL: "sources/dnd/motm",
  },
  {
    id: 87,
    name: "JttRC",
    description: "Journeys through the Radiant Citadel",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/24454/511/637830510509865265.jpeg",
    sourceURL: "sources/dnd/jttrc",
  },
  {
    id: 89,
    name: "MCv1",
    description: "Monstrous Compendium Vol. 1: Spelljammer Creatures",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/25098/972/637854763136224645.jpeg",
    sourceURL: "sources/dnd/mcv1",
  },
  {
    id: 90,
    name: "SAiS",
    description: "Spelljammer: Adventures in Space",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/25228/876/637859890823057854.jpeg",
    sourceURL: "sources/dnd/sais",
  },
  {
    id: 91,
    name: "TVD",
    description: "The Vecna Dossier",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26305/340/637901114717317528.jpeg",
    sourceURL: "sources/dnd/tvd",
  },
  {
    id: 92,
    name: "TRC",
    description: "The Radiant Citadel",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26479/568/637907273106559243.jpeg",
    sourceURL: "sources/dnd/trc",
  },
  {
    id: 93,
    name: "SJA",
    description: "Spelljammer Academy",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26848/192/637920417931102595.jpeg",
    sourceURL: "sources/dnd/sja",
  },
  {
    id: 94,
    name: "DoSI",
    description: "Dragons of Stormwreck Isle",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26865/226/637921086362458107.jpeg",
    sourceURL: "sources/dnd/dosi",
  },
  {
    id: 95,
    name: "SotDQ",
    description: "Dragonlance: Shadow of the Dragon Queen",
    sourceCategoryId: 14,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/27777/666/637951679601337771.jpeg",
    sourceURL: "sources/dnd/sotdq",
  },
  {
    id: 100,
    name: "UA",
    description: "Unearthed Arcana",
    sourceCategoryId: 3,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/34813/11/638216659733422039.jpeg",
    sourceURL: "sources/dnd/ua",
  },
  {
    id: 101,
    name: "MCv2",
    description: "Monstrous Compendium Vol. 2: Dragonlance Creatures",
    sourceCategoryId: 14,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/30591/814/638054153540284547.jpeg",
    sourceURL: "sources/dnd/mcv2",
  },
  {
    id: 102,
    name: "ToD",
    description: "Tyranny of Dragons",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31000/357/638070661674299942.jpeg",
    sourceURL: "sources/dnd/tod",
  },
  {
    id: 103,
    name: "KftGV",
    description: "Keys from the Golden Vault",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31000/595/638070671792143197.jpeg",
    sourceURL: "sources/dnd/kftgv",
  },
  {
    id: 104,
    name: "TG",
    description: "Thieves’ Gallery",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/32269/153/638120143799885947.jpeg",
    sourceURL: "sources/dnd/tg",
  },
  {
    id: 105,
    name: "P13",
    description: "Prisoner 13",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31678/948/638097617627683009.jpeg",
    sourceURL: "sources/dnd/p13",
  },
  {
    id: 109,
    name: "TBoMT",
    description: "The Book of Many Things",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/34541/95/638205353415863412.jpeg",
    sourceURL: "sources/dnd/tbomt",
  },
  {
    id: 110,
    name: "GotG",
    description: "Bigby Presents: Glory of the Giants",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33889/811/638179362850507516.jpeg",
    sourceURL: "sources/dnd/gotg",
  },
  {
    id: 111,
    name: "LMI",
    description: "Legendary Magic Items",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/32967/633/638146612553084319.jpeg",
    sourceURL: "sources/dnd/lmi",
  },
  {
    id: 112,
    name: "MPMv1",
    description: "Misplaced Monsters: Volume One",
    sourceCategoryId: 12,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33375/579/638161401159084318.jpeg",
    sourceURL: "sources/dnd/mpmv1",
  },
  {
    id: 113,
    name: "PBTSO",
    description: "Phandelver and Below: The Shattered Obelisk",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/35214/280/638233891719898500.jpeg",
    sourceURL: "sources/dnd/pbtso",
  },
  {
    id: 114,
    name: "PAitM",
    description: "Planescape: Adventures in the Multiverse",
    sourceCategoryId: 17,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33644/785/638170881547396926.jpeg",
    sourceURL: "sources/dnd/paitm",
  },
  {
    id: 115,
    name: "MCv3",
    description: "Monstrous Compendium Vol. 3: Minecraft Creatures",
    sourceCategoryId: 15,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33103/791/638151695270317390.jpeg",
    sourceURL: "sources/dnd/mcv3",
  },
  {
    id: 116,
    name: "DoD",
    description: "Domains of Delight: A Feywild Accessory",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33298/313/638158863440629290.jpeg",
    sourceURL: "sources/dnd/dod",
  },
  {
    id: 121,
    name: "GotSF",
    description: "Giants of the Star Forge",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36103/73/638271109629954129.jpeg",
    sourceURL: "sources/dnd/gotsf",
  },
  {
    id: 122,
    name: "BGG",
    description: "Baldur’s Gate Gazetteer",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/35728/82/638254794193165644.jpeg",
    sourceURL: "sources/dnd/bgg",
  },
  {
    id: 123,
    name: "TCSR",
    description: "Tal’Dorei Campaign Setting Reborn",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36235/402/638277146643998518.jpeg",
    sourceURL: "sources/dnd/tcsr",
  },
  {
    id: 124,
    name: "MCv4",
    description: "Monstrous Compendium Vol. 4: Eldraine Creatures",
    sourceCategoryId: 7,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36797/447/638301391860014579.jpeg",
    sourceURL: "sources/dnd/mcv4",
  },
  {
    id: 125,
    name: "AATM",
    description: "Adventure Atlas: The Mortuary",
    sourceCategoryId: 17,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36921/396/638306623652011464.jpeg",
    sourceURL: "sources/dnd/aatm",
  },
  {
    id: 126,
    name: "LKE",
    description: "Lightning Keep",
    sourceCategoryId: 15,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36974/217/638309001082198146.jpeg",
    sourceURL: "sources/dnd/lke",
  },
  {
    id: 128,
    name: "ItSI",
    description: "Intro to Stormwreck Isle",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/37224/332/638319433931865291.jpeg",
    sourceURL: "sources/dnd/itsi",
  },
  {
    id: 129,
    name: "HFSCM",
    description: "Heroes’ Feast: Saving the Children’s Menu ",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/37957/430/638350488745211592.jpeg",
    sourceURL: "sources/dnd/hfscm",
  },
  {
    id: 130,
    name: "LoE",
    description: "Lairs of Etharis",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/38227/385/638361857871304044.jpeg",
    sourceURL: "sources/dnd/loe",
  },
  {
    id: 131,
    name: "DoDR",
    description: "Dungeons of Drakkenheim",
    sourceCategoryId: 19,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/38226/811/638361838185130525.jpeg",
    sourceURL: "sources/dnd/dodr",
  },
  {
    id: 132,
    name: "VEoR",
    description: "Vecna: Eve of Ruin",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39768/808/638427681488703113.jpeg",
    sourceURL: "sources/dnd/veor",
  },
  {
    id: 133,
    name: "HCS",
    description: "Humblewood Campaign Setting",
    sourceCategoryId: 20,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39695/377/638425036767623471.jpeg",
    sourceURL: "sources/dnd/hcs",
  },
  {
    id: 135,
    name: "VNEE",
    description: "Vecna: Nest of the Eldritch Eye",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40687/843/638465408127994219.jpeg",
    sourceURL: "sources/dnd/vnee",
  },
  {
    id: 136,
    name: "DiLCT",
    description: "Descent into the Lost Caverns of Tsojcanth",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40132/872/638442415700463413.jpeg",
    sourceURL: "sources/dnd/dilct",
  },
  {
    id: 137,
    name: "QftIS",
    description: "Quests from the Infinite Staircase",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40544/16/638459335923192808.jpeg",
    sourceURL: "sources/dnd/qftis",
  },
  {
    id: 139,
    name: "ToB1",
    description: "Tome of Beasts 1",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40544/209/638459347386150459.jpeg",
    sourceURL: "sources/dnd/tob1",
  },
  {
    id: 140,
    name: "FMRP",
    description: "Flee Mortals: Rule Primer",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41760/824/638512293338393278.jpeg",
    sourceURL: "sources/dnd/fmrp",
  },
  {
    id: 142,
    name: "FM",
    description: "Flee, Mortals!",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41757/185/638512177128217264.jpeg",
    sourceURL: "sources/dnd/fm",
  },
  {
    id: 143,
    name: "WEL",
    description: "Where Evil Lives",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41757/270/638512180375164348.jpeg",
    sourceURL: "sources/dnd/wel",
  },
  {
    id: 145,
    name: "PHB-2024",
    description: "Player’s Handbook (2024)",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41956/70/638520961158909820.jpeg",
    sourceURL: "sources/dnd/phb-2024",
  },
  {
    id: 146,
    name: "DMG-2024",
    description: "Dungeon Master’s Guide (2024)",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41956/43/638520960645819732.jpeg",
    sourceURL: "sources/dnd/dmg-2024",
  },
  {
    id: 148,
    name: "free-rules",
    description: "D&D Free Rules (2024)",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/43764/970/638599907621721321.jpeg",
    sourceURL: "sources/dnd/free-rules",
  },
  {
    id: 149,
    name: "UHLH",
    description: "Uni and the Hunt for the Lost Horn",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/44398/213/638624641190434995.jpeg",
    sourceURL: "sources/dnd/uhlh",
  },
  {
    id: 150,
    name: "GHPP",
    description: "Grim Hollow: Player Pack",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/42333/528/638537169036542469.jpeg",
    sourceURL: "sources/dnd/ghpp",
  },
  {
    id: 151,
    name: "BoET",
    description: "Book of Ebon Tides",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/42930/371/638563983452341674.jpeg",
    sourceURL: "sources/dnd/boet",
  },
  {
    id: 152,
    name: "TFtS",
    description: "Tales from the Shadows",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/43141/46/638572767902627770.jpeg",
    sourceURL: "sources/dnd/tfts",
  },
  {
    id: 153,
    name: "SoEE",
    description: "Scions of Elemental Evil",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45054/529/638651161016677547.jpeg",
    sourceURL: "sources/dnd/soee",
  },
  {
    id: 154,
    name: "LotRR",
    description: "The Lord of the Rings Roleplaying",
    sourceCategoryId: 25,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45711/77/638679106266962749.jpeg",
    sourceURL: "sources/dnd/lotrr",
  },
  {
    id: 155,
    name: "TIR",
    description: "The Illrigger Revised",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45624/457/638675303929857493.png",
    sourceURL: "sources/dnd/tir",
  },
  {
    id: 156,
    name: "GSB2",
    description: "The Griffon’s Saddlebag: Book Two",
    sourceCategoryId: 27,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/46162/28/638699693204142952.jpeg",
    sourceURL: "sources/dnd/gsb2",
  },
];

exports.sources = sources;
