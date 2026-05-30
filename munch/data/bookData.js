const sources = [
  {
    id: 1,
    name: "BR",
    description: "Basic Rules (2014)",
    sourceCategoryId: 26,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/136/637248073409717512.jpeg",
    sourceURL: "sources/dnd/basic-rules-2014"
  },
  {
    id: 2,
    name: "PHB",
    description: "Player’s Handbook (2014)",
    sourceCategoryId: 26,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/389/637248131811862290.jpeg",
    sourceURL: "sources/dnd/phb-2014"
  },
  {
    id: 3,
    name: "DMG",
    description: "Dungeon Master’s Guide (2014)",
    sourceCategoryId: 26,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/593/637245347063211867.jpeg",
    sourceURL: "sources/dnd/dmg-2014"
  },
  {
    id: 4,
    name: "EE",
    description: "Elemental Evil Player's Companion",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52847/797/638989884394019759.jpeg",
    sourceURL: ""
  },
  {
    id: 5,
    name: "MM",
    description: "Monster Manual (2014)",
    sourceCategoryId: 26,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/816/637248105832999293.jpeg",
    sourceURL: "sources/dnd/mm-2014"
  },
  {
    id: 6,
    name: "CoS",
    description: "Curse of Strahd",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10349/296/637244603965977140.jpeg",
    sourceURL: "sources/dnd/cos"
  },
  {
    id: 7,
    name: "HotDQ",
    description: "Hoard of the Dragon Queen",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10432/68/637247937818392417.jpeg",
    sourceURL: "sources/dnd/hotdq"
  },
  {
    id: 8,
    name: "LMoP",
    description: "Lost Mine of Phandelver",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/616/637248096401764265.jpeg",
    sourceURL: "sources/dnd/lmop"
  },
  {
    id: 9,
    name: "OotA",
    description: "Out of the Abyss",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19/735/636383500945700817.jpeg",
    sourceURL: "sources/dnd/oota"
  },
  {
    id: 10,
    name: "PotA",
    description: "Princes of the Apocalypse",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/524/637248137744435932.jpeg",
    sourceURL: "sources/dnd/pota"
  },
  {
    id: 11,
    name: "RoT",
    description: "Rise of Tiamat",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/605/637248141604547323.jpeg",
    sourceURL: "sources/dnd/rot"
  },
  {
    id: 12,
    name: "SKT",
    description: "Storm King's Thunder",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19/740/636383501361665378.jpeg",
    sourceURL: "sources/dnd/skt"
  },
  {
    id: 13,
    name: "SCAG",
    description: "Sword Coast Adventurer's Guide",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/793/637248149475504723.jpeg",
    sourceURL: "sources/dnd/scag"
  },
  {
    id: 14,
    name: "TftYP",
    description: "Tales from the Yawning Portal",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/177/637248652153094716.jpeg",
    sourceURL: "sources/dnd/tftyp"
  },
  {
    id: 15,
    name: "VGtM",
    description: "Volo's Guide to Monsters",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/464/637248679743732719.jpeg",
    sourceURL: "sources/dnd/vgtm"
  },
  {
    id: 16,
    name: "TSC",
    description: "The Sunless Citadel",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/402/637248674372576676.jpeg",
    sourceURL: ""
  },
  {
    id: 17,
    name: "TFoF",
    description: "The Forge of Fury",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10436/4/637248156999902689.jpeg",
    sourceURL: ""
  },
  {
    id: 18,
    name: "THSoT",
    description: "The Hidden Shrine of Tamoachan",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/236/637248657347161458.jpeg",
    sourceURL: ""
  },
  {
    id: 19,
    name: "WPM",
    description: "White Plume Mountain",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/751/637248705560259195.jpeg",
    sourceURL: ""
  },
  {
    id: 20,
    name: "DiT",
    description: "Dead in Thay",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/246/637248079254127234.jpeg",
    sourceURL: ""
  },
  {
    id: 21,
    name: "AtG",
    description: "Against the Giants",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10433/315/637248029897296032.jpeg",
    sourceURL: ""
  },
  {
    id: 22,
    name: "ToH",
    description: "Tomb of Horrors",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/371/637248671854035769.jpeg",
    sourceURL: ""
  },
  {
    id: 25,
    name: "ToA",
    description: "Tomb of Annihilation",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/339/637248669136195626.jpeg",
    sourceURL: "sources/dnd/toa"
  },
  {
    id: 26,
    name: "CoSCO",
    description: "Curse of Strahd: Character Options",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10349/289/637244603748885696.jpeg",
    sourceURL: ""
  },
  {
    id: 27,
    name: "XGtE",
    description: "Xanathar's Guide to Everything",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/803/637248709455777906.jpeg",
    sourceURL: "sources/dnd/xgte"
  },
  {
    id: 28,
    name: "TTP",
    description: "The Tortle Package",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39/300/636411199124473334.png",
    sourceURL: "sources/dnd/ttp"
  },
  {
    id: 29,
    name: "UA-2014",
    description: "Unearthed Arcana 2014",
    sourceCategoryId: 3,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/100/464/636506973225556542.png",
    sourceURL: ""
  },
  {
    id: 31,
    name: "CR",
    description: "Critical Role",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 33,
    name: "MToF",
    description: "Mordenkainen’s Tome of Foes",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/949/637248111148617766.jpeg",
    sourceURL: "sources/dnd/mtof"
  },
  {
    id: 34,
    name: "DDIA-MORD",
    description: "Rrakkma",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/319/345/636622116959280867.jpeg",
    sourceURL: "sources/dnd/ddia-mord"
  },
  {
    id: 35,
    name: "WDH",
    description: "Waterdeep: Dragon Heist",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/343/499/636632335939805190.jpeg",
    sourceURL: "sources/dnd/wdh"
  },
  {
    id: 36,
    name: "WDotMM",
    description: "Waterdeep: Dungeon of the Mad Mage",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/493/637248684031810278.jpeg",
    sourceURL: "sources/dnd/wdotmm"
  },
  {
    id: 37,
    name: "WGtE",
    description: "Wayfinder's Guide to Eberron",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10449/715/637248702538222765.jpeg",
    sourceURL: "sources/dnd/wgte"
  },
  {
    id: 38,
    name: "GGtR",
    description: "Guildmasters’ Guide to Ravnica",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40948/83/638476689241305817.jpeg",
    sourceURL: "sources/dnd/ggtr"
  },
  {
    id: 40,
    name: "LLoK",
    description: "Lost Laboratory of Kwalish",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/498/637248091075319276.jpeg",
    sourceURL: "sources/dnd/llok"
  },
  {
    id: 41,
    name: "DoIP",
    description: "Dragon of Icespire Peak",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/957/637244676648122088.jpeg",
    sourceURL: "sources/dnd/doip"
  },
  {
    id: 42,
    name: "TMR",
    description: "Tactical Maps Reincarnated",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/5336/630/636850745475942698.jpeg",
    sourceURL: ""
  },
  {
    id: 43,
    name: "GoS",
    description: "Ghosts of Saltmarsh",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10370/66/637245493047936420.jpeg",
    sourceURL: "sources/dnd/gos"
  },
  {
    id: 44,
    name: "AI",
    description: "Acquisitions Incorporated",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/905/637244674570907870.jpeg",
    sourceURL: "sources/dnd/ai"
  },
  {
    id: 47,
    name: "HftT",
    description: "Hunt for the Thessalhydra",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10432/12/637247932786703735.jpeg",
    sourceURL: "sources/dnd/hftt"
  },
  {
    id: 48,
    name: "BGDiA",
    description: "Baldur’s Gate: Descent into Avernus",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/927/637244675832719441.jpeg",
    sourceURL: "sources/dnd/bgdia"
  },
  {
    id: 49,
    name: "ERftLW",
    description: "Eberron: Rising from the Last War",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10368/6/637245381196842264.jpeg",
    sourceURL: "sources/dnd/erftlw"
  },
  {
    id: 50,
    name: "SLW",
    description: "Storm Lord’s Wrath",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/964/637244676927254855.jpeg",
    sourceURL: "sources/dnd/slw"
  },
  {
    id: 51,
    name: "SDW",
    description: "Sleeping Dragon’s Wake",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/959/637244676820916158.jpeg",
    sourceURL: "sources/dnd/sdw"
  },
  {
    id: 52,
    name: "DC",
    description: "Divine Contention",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10350/951/637244676535367295.jpeg",
    sourceURL: "sources/dnd/dc"
  },
  {
    id: 53,
    name: "SAC",
    description: "Sage Advice Compendium (2014)",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/702/637248145947271474.jpeg",
    sourceURL: "sources/dnd/sac"
  },
  {
    id: 54,
    name: "DDvRaM",
    description: "Dungeons &amp; Dragons vs. Rick and Morty",
    sourceCategoryId: 10,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/229/637245316031917098.jpeg",
    sourceURL: "sources/dnd/ddvram"
  },
  {
    id: 55,
    name: "LR",
    description: "Locathah Rising",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/650/637248098360957592.jpeg",
    sourceURL: "sources/dnd/lr"
  },
  {
    id: 56,
    name: "IMR",
    description: "Infernal Machine Rebuild",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/395/637248086063224834.jpeg",
    sourceURL: "sources/dnd/imr"
  },
  {
    id: 57,
    name: "MFFV1",
    description: "Mordenkainen's Fiendish Folio Volume 1",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/743/637248102793792401.jpeg",
    sourceURL: "sources/dnd/mffv1"
  },
  {
    id: 58,
    name: "SD",
    description: "Sapphire Dragon",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/899/637248153278056972.jpeg",
    sourceURL: ""
  },
  {
    id: 59,
    name: "EGtW",
    description: "Explorer's Guide to Wildemount",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10367/769/637245363413951140.jpeg",
    sourceURL: "sources/dnd/egtw"
  },
  {
    id: 60,
    name: "OGA",
    description: "One Grung Above",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10435/68/637248116464990081.jpeg",
    sourceURL: "sources/dnd/oga"
  },
  {
    id: 61,
    name: "MOoT",
    description: "Mythic Odysseys of Theros",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/10434/885/637248108609488365.jpeg",
    sourceURL: "sources/dnd/moot"
  },
  {
    id: 62,
    name: "WA",
    description: "Frozen Sick",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/9193/755/637200909525723425.jpeg",
    sourceURL: "sources/dnd/wa"
  },
  {
    id: 66,
    name: "IDRotF",
    description: "Icewind Dale: Rime of the Frostmaiden",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/11095/550/637278965847502335.jpeg",
    sourceURL: "sources/dnd/idrotf"
  },
  {
    id: 67,
    name: "TCoE",
    description: "Tasha’s Cauldron of Everything",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/13665/613/637400361423035085.jpeg",
    sourceURL: "sources/dnd/tcoe"
  },
  {
    id: 68,
    name: "CM",
    description: "Candlekeep Mysteries",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/14917/783/637456355214291364.jpeg",
    sourceURL: "sources/dnd/cm"
  },
  {
    id: 69,
    name: "VRGtR",
    description: "Van Richten’s Guide to Ravenloft",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/15973/81/637496917952314322.jpeg",
    sourceURL: "sources/dnd/vrgtr"
  },
  {
    id: 79,
    name: "TWBtW",
    description: "The Wild Beyond the Witchlight",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/18223/997/637587419509160992.jpeg",
    sourceURL: "sources/dnd/twbtw"
  },
  {
    id: 80,
    name: "SACoC",
    description: "Strixhaven: A Curriculum of Chaos",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/18228/52/637587668398315568.jpeg",
    sourceURL: "sources/dnd/sacoc"
  },
  {
    id: 81,
    name: "FToD",
    description: "Fizban's Treasury of Dragons",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/19075/983/637620380256293999.jpeg",
    sourceURL: "sources/dnd/ftod"
  },
  {
    id: 83,
    name: "CotN",
    description: "Critical Role: Call of the Netherdeep",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/20906/943/637695655261542821.jpeg",
    sourceURL: "sources/dnd/cotn"
  },
  {
    id: 85,
    name: "MotM",
    description: "Mordenkainen Presents: Monsters of the Multiverse",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/22937/354/637776964748720726.jpeg",
    sourceURL: "sources/dnd/motm"
  },
  {
    id: 87,
    name: "JttRC",
    description: "Journeys through the Radiant Citadel",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/24454/511/637830510509865265.jpeg",
    sourceURL: "sources/dnd/jttrc"
  },
  {
    id: 89,
    name: "MCv1",
    description: "Monstrous Compendium Vol. 1: Spelljammer Creatures",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/25098/972/637854763136224645.jpeg",
    sourceURL: "sources/dnd/mcv1"
  },
  {
    id: 90,
    name: "SAiS",
    description: "Spelljammer: Adventures in Space",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/25228/876/637859890823057854.jpeg",
    sourceURL: "sources/dnd/sais"
  },
  {
    id: 91,
    name: "TVD",
    description: "The Vecna Dossier",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26305/340/637901114717317528.jpeg",
    sourceURL: "sources/dnd/tvd"
  },
  {
    id: 92,
    name: "TRC",
    description: "The Radiant Citadel",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26479/568/637907273106559243.jpeg",
    sourceURL: "sources/dnd/trc"
  },
  {
    id: 93,
    name: "SJA",
    description: "Spelljammer Academy",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26848/192/637920417931102595.jpeg",
    sourceURL: "sources/dnd/sja"
  },
  {
    id: 94,
    name: "DoSI",
    description: "Dragons of Stormwreck Isle",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/26865/226/637921086362458107.jpeg",
    sourceURL: "sources/dnd/dosi"
  },
  {
    id: 95,
    name: "SotDQ",
    description: "Dragonlance: Shadow of the Dragon Queen",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/27777/666/637951679601337771.jpeg",
    sourceURL: "sources/dnd/sotdq"
  },
  {
    id: 100,
    name: "UA",
    description: "Unearthed Arcana",
    sourceCategoryId: 3,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/34813/11/638216659733422039.jpeg",
    sourceURL: "sources/dnd/ua"
  },
  {
    id: 101,
    name: "MCv2",
    description: "Monstrous Compendium Vol. 2: Dragonlance Creatures",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/30591/814/638054153540284547.jpeg",
    sourceURL: "sources/dnd/mcv2"
  },
  {
    id: 102,
    name: "ToD",
    description: "Tyranny of Dragons",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31000/357/638070661674299942.jpeg",
    sourceURL: "sources/dnd/tod"
  },
  {
    id: 103,
    name: "KftGV",
    description: "Keys from the Golden Vault",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31000/595/638070671792143197.jpeg",
    sourceURL: "sources/dnd/kftgv"
  },
  {
    id: 104,
    name: "TG",
    description: "Thieves’ Gallery",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/32269/153/638120143799885947.jpeg",
    sourceURL: "sources/dnd/tg"
  },
  {
    id: 105,
    name: "P13",
    description: "Prisoner 13",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/31678/948/638097617627683009.jpeg",
    sourceURL: "sources/dnd/p13"
  },
  {
    id: 109,
    name: "TBoMT",
    description: "The Book of Many Things",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/34541/95/638205353415863412.jpeg",
    sourceURL: "sources/dnd/tbomt"
  },
  {
    id: 110,
    name: "GotG",
    description: "Bigby Presents: Glory of the Giants",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33889/811/638179362850507516.jpeg",
    sourceURL: "sources/dnd/gotg"
  },
  {
    id: 111,
    name: "LMI",
    description: "Legendary Magic Items",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/32967/633/638146612553084319.jpeg",
    sourceURL: "sources/dnd/lmi"
  },
  {
    id: 112,
    name: "MPMv1",
    description: "Misplaced Monsters: Volume One",
    sourceCategoryId: 23,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33375/579/638161401159084318.jpeg",
    sourceURL: "sources/dnd/mpmv1"
  },
  {
    id: 113,
    name: "PBTSO",
    description: "Phandelver and Below: The Shattered Obelisk",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/35214/280/638233891719898500.jpeg",
    sourceURL: "sources/dnd/pbtso"
  },
  {
    id: 114,
    name: "PAitM",
    description: "Planescape: Adventures in the Multiverse",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33644/785/638170881547396926.jpeg",
    sourceURL: "sources/dnd/paitm"
  },
  {
    id: 115,
    name: "MCv3",
    description: "Monstrous Compendium Vol. 3: Minecraft Creatures",
    sourceCategoryId: 15,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33103/791/638151695270317390.jpeg",
    sourceURL: "sources/dnd/mcv3"
  },
  {
    id: 116,
    name: "DoD",
    description: "Domains of Delight: A Feywild Accessory",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/33298/313/638158863440629290.jpeg",
    sourceURL: "sources/dnd/dod"
  },
  {
    id: 121,
    name: "GotSF",
    description: "Giants of the Star Forge",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36103/73/638271109629954129.jpeg",
    sourceURL: "sources/dnd/gotsf"
  },
  {
    id: 122,
    name: "BGG",
    description: "Baldur’s Gate Gazetteer",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/35728/82/638254794193165644.jpeg",
    sourceURL: "sources/dnd/bgg"
  },
  {
    id: 123,
    name: "TCSR",
    description: "Tal’Dorei Campaign Setting Reborn",
    sourceCategoryId: 2,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36235/402/638277146643998518.jpeg",
    sourceURL: "sources/dnd/tcsr"
  },
  {
    id: 124,
    name: "MCv4",
    description: "Monstrous Compendium Vol. 4: Eldraine Creatures",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36797/447/638301391860014579.jpeg",
    sourceURL: "sources/dnd/mcv4"
  },
  {
    id: 125,
    name: "AATM",
    description: "Adventure Atlas: The Mortuary",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36921/396/638306623652011464.jpeg",
    sourceURL: "sources/dnd/aatm"
  },
  {
    id: 126,
    name: "LKE",
    description: "Lightning Keep",
    sourceCategoryId: 15,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/36974/217/638309001082198146.jpeg",
    sourceURL: "sources/dnd/lke"
  },
  {
    id: 128,
    name: "ItSI",
    description: "Intro to Stormwreck Isle",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/37224/332/638319433931865291.jpeg",
    sourceURL: "sources/dnd/itsi"
  },
  {
    id: 129,
    name: "HFSCM",
    description: "Heroes’ Feast: Saving the Children’s Menu ",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/37957/430/638350488745211592.jpeg",
    sourceURL: "sources/dnd/hfscm"
  },
  {
    id: 130,
    name: "LoE",
    description: "Lairs of Etharis",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/38227/385/638361857871304044.jpeg",
    sourceURL: "sources/dnd/loe"
  },
  {
    id: 131,
    name: "DoDR",
    description: "Dungeons of Drakkenheim",
    sourceCategoryId: 19,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/38226/811/638361838185130525.jpeg",
    sourceURL: "sources/dnd/dodr"
  },
  {
    id: 132,
    name: "VEoR",
    description: "Vecna: Eve of Ruin",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39768/808/638427681488703113.jpeg",
    sourceURL: "sources/dnd/veor"
  },
  {
    id: 133,
    name: "HCS",
    description: "Humblewood Campaign Setting",
    sourceCategoryId: 20,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/39695/377/638425036767623471.jpeg",
    sourceURL: "sources/dnd/hcs"
  },
  {
    id: 135,
    name: "VNEE",
    description: "Vecna: Nest of the Eldritch Eye",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40687/843/638465408127994219.jpeg",
    sourceURL: "sources/dnd/vnee"
  },
  {
    id: 136,
    name: "DiLCT",
    description: "Descent into the Lost Caverns of Tsojcanth",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40132/872/638442415700463413.jpeg",
    sourceURL: "sources/dnd/dilct"
  },
  {
    id: 137,
    name: "QftIS",
    description: "Quests from the Infinite Staircase",
    sourceCategoryId: 1,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40544/16/638459335923192808.jpeg",
    sourceURL: "sources/dnd/qftis"
  },
  {
    id: 139,
    name: "ToB1",
    description: "Tome of Beasts 1",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/40544/209/638459347386150459.jpeg",
    sourceURL: "sources/dnd/tob1"
  },
  {
    id: 140,
    name: "FMRP",
    description: "Flee Mortals: Rule Primer",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41760/824/638512293338393278.jpeg",
    sourceURL: "sources/dnd/fmrp"
  },
  {
    id: 142,
    name: "FM",
    description: "Flee, Mortals!",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41757/185/638512177128217264.jpeg",
    sourceURL: "sources/dnd/fm"
  },
  {
    id: 143,
    name: "WEL",
    description: "Where Evil Lives",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41757/270/638512180375164348.jpeg",
    sourceURL: "sources/dnd/wel"
  },
  {
    id: 145,
    name: "PHB-2024",
    description: "Player’s Handbook",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41956/70/638520961158909820.jpeg",
    sourceURL: "sources/dnd/phb-2024"
  },
  {
    id: 146,
    name: "DMG-2024",
    description: "Dungeon Master’s Guide",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41956/43/638520960645819732.jpeg",
    sourceURL: "sources/dnd/dmg-2024"
  },
  {
    id: 147,
    name: "MM-2024",
    description: "Monster Manual",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/41956/55/638520960905139721.jpeg",
    sourceURL: "sources/dnd/mm-2024"
  },
  {
    id: 148,
    name: "br-2024",
    description: "D&amp;D Beyond Basic Rules",
    sourceCategoryId: 24,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/48763/493/638809278615622299.jpeg",
    sourceURL: "sources/dnd/br-2024"
  },
  {
    id: 149,
    name: "UHLH",
    description: "Uni and the Hunt for the Lost Horn",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/44398/213/638624641190434995.jpeg",
    sourceURL: "sources/dnd/uhlh"
  },
  {
    id: 150,
    name: "GHPP",
    description: "Grim Hollow: Player Pack",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/42333/528/638537169036542469.jpeg",
    sourceURL: "sources/dnd/ghpp"
  },
  {
    id: 151,
    name: "BoET",
    description: "Book of Ebon Tides",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/42930/371/638563983452341674.jpeg",
    sourceURL: "sources/dnd/boet"
  },
  {
    id: 152,
    name: "TFtS",
    description: "Tales from the Shadows",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/43141/46/638572767902627770.jpeg",
    sourceURL: "sources/dnd/tfts"
  },
  {
    id: 153,
    name: "SoEE",
    description: "Scions of Elemental Evil",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45054/529/638651161016677547.jpeg",
    sourceURL: "sources/dnd/soee"
  },
  {
    id: 154,
    name: "LotRR",
    description: "The Lord of the Rings Roleplaying",
    sourceCategoryId: 25,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45711/77/638679106266962749.jpeg",
    sourceURL: "sources/dnd/lotrr"
  },
  {
    id: 155,
    name: "TIR",
    description: "The Illrigger Revised",
    sourceCategoryId: 22,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/45624/457/638675303929857493.png",
    sourceURL: "sources/dnd/tir"
  },
  {
    id: 156,
    name: "GSB2",
    description: "The Griffon’s Saddlebag: Book Two",
    sourceCategoryId: 27,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/46162/28/638699693204142952.jpeg",
    sourceURL: "sources/dnd/gsb2"
  },
  {
    id: 157,
    name: "HBTD",
    description: "Hold Back The Dead",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/46296/545/638705856968286256.jpeg",
    sourceURL: "sources/dnd/hbtd"
  },
  {
    id: 158,
    name: "HWT",
    description: "Humblewood Tales",
    sourceCategoryId: 20,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/46767/260/638727288656465942.jpeg",
    sourceURL: "sources/dnd/hwt"
  },
  {
    id: 159,
    name: "ISotSS",
    description: "Dungeons of Drakkenheim: In Search of the Smuggler's Secrets\t",
    sourceCategoryId: 19,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/47377/293/638751718810530425.jpeg",
    sourceURL: "sources/dnd/isotss"
  },
  {
    id: 160,
    name: "OTTG",
    description: "Obojima: Tales from the Tall Grass",
    sourceCategoryId: 29,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/47916/932/638773269278133135.jpeg",
    sourceURL: "sources/dnd/ottg"
  },
  {
    id: 161,
    name: "TMoM",
    description: "The Malady of Minarrh",
    sourceCategoryId: 30,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/47952/374/638774901182361295.jpeg",
    sourceURL: "sources/dnd/tmom"
  },
  {
    id: 162,
    name: "HGtMH1",
    description: "Heliana’s Guide to Monster Hunting: Part 1",
    sourceCategoryId: 31,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/47743/901/638766077908089991.jpeg",
    sourceURL: "sources/dnd/hgtmh1"
  },
  {
    id: 163,
    name: "DrDe",
    description: "Dragon Delves",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49845/417/638857756109181610.jpeg",
    sourceURL: "sources/dnd/drde"
  },
  {
    id: 164,
    name: "VSSPP",
    description: "Valda’s Spire of Secrets: Player Pack",
    sourceCategoryId: 32,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/48099/191/638780952881052606.jpeg",
    sourceURL: "sources/dnd/vsspp"
  },
  {
    id: 165,
    name: "DLMP",
    description: "Dragon Lairs Map Pack",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56563/874/639141512459246738.png",
    sourceURL: "sources/dnd/dlmp"
  },
  {
    id: 166,
    name: "SAE",
    description: "Sage Advice &amp; Errata",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/48408/463/638794027036999807.jpeg",
    sourceURL: "sources/dnd/sae"
  },
  {
    id: 167,
    name: "SSH",
    description: "Ruins of Symbaroum: Setting Handbook",
    sourceCategoryId: 25,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/48763/470/638809277854391620.jpeg",
    sourceURL: "sources/dnd/ssh"
  },
  {
    id: 168,
    name: "CZMP1",
    description: "Czepeku Map Pack: Archaeological Dig",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 169,
    name: "CZMP2",
    description: "Czepeku Map Pack: Burial Barrow",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 170,
    name: "CZMP3",
    description: "Czepeku Map Pack: Celestial Gate",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 171,
    name: "CZMP4",
    description: "Czepeku Map Pack: Colosseum of Challenges",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 172,
    name: "CZMP5",
    description: "Czepeku Map Pack: Desert Caravanserai",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 173,
    name: "CZMP6",
    description: "Czepeku Map Pack: Dragon’s Hoard",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 174,
    name: "CZMP7",
    description: "Czepeku Map Pack: Dwarven Throne Hall",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 175,
    name: "CZMP8",
    description: "Czepeku Map Pack: Hanging Gardens",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 176,
    name: "CZMP9",
    description: "Czepeku Map Pack: Hell’s Cocktail Lounge",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 177,
    name: "CZMP10",
    description: "Czepeku Map Pack: Jungle Temple Entrance",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 178,
    name: "CZMP11",
    description: "Czepeku Map Pack: Market City Walls",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 179,
    name: "CZMP12",
    description: "Czepeku Map Pack: Medieval Jail",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 180,
    name: "CZMP13",
    description: "Czepeku Map Pack: Orc Desert Camp",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 181,
    name: "CZMP14",
    description: "Czepeku Map Pack: Port Bastion",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 182,
    name: "CZMP15",
    description: "Czepeku Map Pack: Riverwood Toll Castle",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 183,
    name: "CZMP16",
    description: "Czepeku Map Pack: Ropebridge Chasm",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 184,
    name: "CZMP17",
    description: "Czepeku Map Pack: Secret Fey Fountain",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 185,
    name: "CZMP18",
    description: "Czepeku Map Pack: Sewer Tunnels",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 186,
    name: "CZMP19",
    description: "Czepeku Map Pack: Spider Queen Throne",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 187,
    name: "CZMP20",
    description: "Czepeku Map Pack: Village Hunting Guild",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 188,
    name: "OSWCST",
    description: "One-Shot Wonders: 10 Coastal One-Shot Adventures",
    sourceCategoryId: 33,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49170/773/638827625542016751.jpeg",
    sourceURL: "sources/dnd/oswcst"
  },
  {
    id: 189,
    name: "OSWDST",
    description: "One-Shot Wonders: 10 Desert One-Shot Adventures",
    sourceCategoryId: 33,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49171/272/638827642097330346.jpeg",
    sourceURL: "sources/dnd/oswdst"
  },
  {
    id: 190,
    name: "OSWFST",
    description: "One-Shot Wonders: 10 Forest One-Shot Adventures",
    sourceCategoryId: 33,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49171/58/638827635248036080.jpeg",
    sourceURL: "sources/dnd/oswfst"
  },
  {
    id: 191,
    name: "EFotA",
    description: "Eberron: Forge of the Artificer",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52984/257/638995467851050782.jpeg",
    sourceURL: "sources/dnd/efota"
  },
  {
    id: 192,
    name: "EEMP",
    description: "Eberron Expeditions Digital Map Pack",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 193,
    name: "TCMP1",
    description: "The Crooked Moon Part One: Player Options &amp; Campaign Setting",
    sourceCategoryId: 34,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49759/721/638853793265845495.jpeg",
    sourceURL: "sources/dnd/tcmp1"
  },
  {
    id: 194,
    name: "TCMP2",
    description: "The Crooked Moon Part Two: Monsters &amp; Adventure Campaign",
    sourceCategoryId: 34,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49759/762/638853794159826424.jpeg",
    sourceURL: "sources/dnd/tcmp2"
  },
  {
    id: 195,
    name: "BQGT",
    description: "Borderlands Quest: Goblin Trouble",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49597/118/638846444787622576.jpeg",
    sourceURL: "sources/dnd/bqgt"
  },
  {
    id: 196,
    name: "MoDr",
    description: "Monsters of Drakkenheim",
    sourceCategoryId: 19,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49204/418/638829230579961696.jpeg",
    sourceURL: "sources/dnd/modr"
  },
  {
    id: 197,
    name: "TGC",
    description: "The Gunslinger Class: Valda’s Spire of Secrets",
    sourceCategoryId: 32,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/49204/548/638829235504613833.jpeg",
    sourceURL: "sources/dnd/tgc"
  },
  {
    id: 198,
    name: "Core",
    description: "Core Rules",
    sourceCategoryId: 35,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: ""
  },
  {
    id: 199,
    name: "HotB",
    description: "Heroes of the Borderlands",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/51322/302/638924470222941154.jpeg",
    sourceURL: "sources/dnd/hotb"
  },
  {
    id: 200,
    name: "CtbT",
    description: "Cthulhu by Torchlight",
    sourceCategoryId: 36,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/50117/245/638869963334256166.jpeg",
    sourceURL: "sources/dnd/ctbt"
  },
  {
    id: 202,
    name: "AV",
    description: "Abomination Vaults",
    sourceCategoryId: 37,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/50664/299/638895107009815728.jpeg",
    sourceURL: "sources/dnd/av"
  },
  {
    id: 203,
    name: "WtHC",
    description: "Stranger Things: Welcome to the Hellfire Club",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/51856/545/638947926379928149.jpeg",
    sourceURL: "sources/dnd/wthc"
  },
  {
    id: 205,
    name: "FRHoF",
    description: "Forgotten Realms: Heroes of Faerûn",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52402/285/638971147782119777.jpeg",
    sourceURL: "sources/dnd/frhof"
  },
  {
    id: 206,
    name: "FRAiF",
    description: "Forgotten Realms: Adventures in Faerûn",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52402/307/638971148264550068.jpeg",
    sourceURL: "sources/dnd/fraif"
  },
  {
    id: 207,
    name: "GHPG",
    description: "Grim Hollow: Player’s Guide",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/51049/918/638912410729015597.jpeg",
    sourceURL: "sources/dnd/ghpg"
  },
  {
    id: 208,
    name: "GHCG",
    description: "Grim Hollow: Campaign Guide",
    sourceCategoryId: 18,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/51623/637/638938109186580209.jpeg",
    sourceURL: "sources/dnd/ghcg"
  },
  {
    id: 216,
    name: "NF",
    description: "Netheril’s Fall",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52041/664/638956184000661571.jpeg",
    sourceURL: "sources/dnd/nf"
  },
  {
    id: 217,
    name: "ABoH",
    description: "Astarion's Book of Hungers",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52637/468/638981487305001378.jpeg",
    sourceURL: "sources/dnd/aboh"
  },
  {
    id: 218,
    name: "FRTTS",
    description: "Forgotten Realms: The Tenebrous Stone",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/52183/568/638962183306995243.jpeg",
    sourceURL: "sources/dnd/frtts"
  },
  {
    id: 220,
    name: "LFL",
    description: "Lorwyn: First Light",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/53475/168/639016128027071803.jpeg",
    sourceURL: "sources/dnd/lfl"
  },
  {
    id: 222,
    name: "FFotR",
    description: "Fated Flight of the Recluse",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/53004/840/638996385206175334.jpeg",
    sourceURL: "sources/dnd/ffotr"
  },
  {
    id: 223,
    name: "OSWHAP",
    description: "One-Shot Wonders: Holiday Adventure Pack",
    sourceCategoryId: 33,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/53150/45/639002889856585575.jpeg",
    sourceURL: "sources/dnd/oswhap"
  },
  {
    id: 224,
    name: "HGtMH2",
    description: "Heliana’s Guide to Monster Hunting: Part 2",
    sourceCategoryId: 31,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/55300/534/639085005894216266.jpeg",
    sourceURL: "sources/dnd/hgtmh2"
  },
  {
    id: 225,
    name: "ExEb",
    description: "Exploring Eberron (2024)",
    sourceCategoryId: 39,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/54336/220/639048037191148332.jpeg",
    sourceURL: "sources/dnd/exeb"
  },
  {
    id: 227,
    name: "FPW1",
    description: "Faster, Purple Worm! Everybody Dies, Vol. 1",
    sourceCategoryId: 42,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/54921/214/639069559741302095.jpeg",
    sourceURL: "sources/dnd/fpw1"
  },
  {
    id: 228,
    name: "TPC",
    description: "The Pugilist Class (2024)",
    sourceCategoryId: 40,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/54296/216/639046483090649923.jpeg",
    sourceURL: "sources/dnd/tpc"
  },
  {
    id: 229,
    name: "GSB1",
    description: "The Griffon’s Saddlebag: Book One",
    sourceCategoryId: 27,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/55529/865/639094550191215856.jpeg",
    sourceURL: "sources/dnd/gsb1"
  },
  {
    id: 230,
    name: "DDDoD",
    description: "Dr Dhrolin’s Dictionary of Dinosaurs",
    sourceCategoryId: 41,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/55776/422/639105203709505694.jpeg",
    sourceURL: "sources/dnd/dddod"
  },
  {
    id: 237,
    name: "BQDD",
    description: "Borderlands Quest: Dagger Danger!",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56858/694/639155103860974349.jpeg",
    sourceURL: "sources/dnd/bqdd",
  },
  {
    id: 238,
    name: "NWB",
    description: "Northlands Worldbook",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56482/25/639137860420279749.jpeg",
    sourceURL: "sources/dnd/nwb"
  },
  {
    id: 239,
    name: "NS",
    description: "Northlands Sagas",
    sourceCategoryId: 21,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56481/974/639137858928429914.jpeg",
    sourceURL: "sources/dnd/ns"
  },
  {
    id: 240,
    name: "DMR",
    description: "Dungeon Masters: Ravenloft Play-Along Pack",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56370/252/639132637127802783.jpeg",
    sourceURL: "sources/dnd/dmr"
  },
  {
    id: 241,
    name: "DMRF",
    description: "Dungeon Masters: Zombie Clot Play-Along Pack",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56217/281/639125517439443283.jpeg",
    sourceURL: "sources/dnd/dmrf"
  },
  {
    id: 242,
    name: "DMR2",
    description: "Dungeon Masters: Ravenloft - Gremishkas",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56170/955/639123079161560321.jpeg",
    sourceURL: "sources/dnd/dmr"
  },
  {
    id: 243,
    name: "DMR3",
    description: "Dungeon Masters: Ravenloft - Mist Horrors",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56589/63/639142901806565524.jpeg",
    sourceURL: "sources/dnd/dmr3"
  },
  {
    id: 244,
    name: "DMR4",
    description: "Dungeon Masters: Ravenloft - Waxworks",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56589/59/639142901733985421.jpeg",
    sourceURL: "sources/dnd/dmr4"
  },
  {
    id: 245,
    name: "DMR5",
    description: "Dungeon Masters: Ravenloft - Dullahan",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56603/987/639143621060583791.jpeg",
    sourceURL: "sources/dnd/dmr5"
  },
  {
    id: 246,
    name: "DMR6",
    description: "Dungeon Masters: Ravenloft - Death's Head Tree",
    sourceCategoryId: 16,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/",
    sourceURL: "sources/dnd/dmr6"
  },
  {
    id: 269,
    name: "LoGEER",
    description: "Legends of Greyhawk: Elemental Evil Rising",
    sourceCategoryId: 44,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56054/466/639117855810415949.jpeg",
    sourceURL: "sources/dnd/logeer",
  },
  {
    id: 287,
    name: "LoGTTC",
    description: "Legends of Greyhawk: Tales from Turtleback Cove",
    sourceCategoryId: 38,
    isReleased: true,
    avatarURL: "https://www.dndbeyond.com/avatars/56596/1/639143144825732718.jpeg",
    sourceURL: "sources/dnd/logttc"
  }
];

const categories = [
  {
    id: 1,
    name: "5e Expanded Rules",
    description:
      "<p>Character options from supplementary sourcebooks such as&nbsp;<em>Tasha’s Cauldron of Everything</em> and&nbsp;<em>Xanathar’s Guide to Everything</em>, that are&nbsp;beyond the&nbsp;5e Core Rules.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 2,
    name: "Critical Role",
    description: "",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: "https://www.dndbeyond.com/avatars/105/174/636512853628516966.png"
  },
  {
    id: 3,
    name: "Playtest",
    description:
      "<p><span style=\"color: rgba(255, 0, 0, 1)\"><strong>THIS IS&nbsp;PLAYTEST MATERIAL</strong></span></p>\n<p>The material here is presented for playtesting and to spark your imagination. These game mechanics are in draft form, usable in your campaign but not refined by&nbsp;full game design and editing. They aren’t officially part of the game and aren’t permitted in D&amp;D Adventurers League events.</p>\n<p>If this material is made official, it will be refined based on your feedback, and then it will appear in a D&amp;D product that you can unlock on DDB.</p>\n<p>If this material is not made official, it will be removed from D&amp;D Beyond following the playtest period and you will need to replace it with another option.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: "https://www.dndbeyond.com/avatars/110/171/636516074887091041.png"
  },
  {
    id: 6,
    name: "D&amp;D Beyond",
    description: "<p>D&amp;D Beyond</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 7,
    name: "Magic: The Gathering",
    description: "<p>Magic: The Gathering content for Dungeons &amp; Dragons</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 8,
    name: "Eberron",
    description: "<p>The Eberron campaign setting for Dungeons &amp; Dragons</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: "https://www.dndbeyond.com/avatars/2588/861/636681435608150525.png"
  },
  {
    id: 9,
    name: "Archived",
    description: "<p>The Graveyard</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 10,
    name: "Rick and Morty",
    description: "<p>Source category for Rick and Morty products.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 11,
    name: "Runeterra",
    description:
      "<p><span style=\"color: rgba(255, 0, 0, 1)\"><strong>THIS IS UNOFFICIAL MATERIAL</strong></span></p>\n<p>These game mechanics are usable in your campaign if your DM allows them but not refined by final game design and editing. They aren’t officially part of the Dungeons &amp; Dragons game and aren’t permitted in D&amp;D Adventurers League events unless otherwise stated.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: "https://www.dndbeyond.com/avatars/11008/904/637274855809570341.png"
  },
  {
    id: 12,
    name: "Noncore D&amp;D",
    description:
      "<p><span style=\"color: rgba(255, 0, 0, 1)\"><strong>THIS IS NONCORE D&amp;D MATERIAL</strong></span></p>\n<p>These game mechanics are usable in your campaign if your DM allows them but not refined by final game design and editing.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 13,
    name: "Adventurers League",
    description: "<p>Adventurers League content for fifth edition Dungeons &amp; Dragons</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 14,
    name: "Dragonlance",
    description: "<p>The Dragonlance campaign setting for Dungeons &amp; Dragons.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 15,
    name: "Minecraft",
    description: "",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 16,
    name: "Hidden Sources",
    description:
      "<p>This category is for any source that should be hidden from things like source selections/listings/etc. Generally used for old/placeholder sources.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 17,
    name: "Planescape",
    description: "<p>The Planescape campaign setting for Dungeons &amp; Dragons.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 18,
    name: "Grim Hollow",
    description: "<p>This contains content from the Grim Hollow campaign setting, by Ghostfire Gaming.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 19,
    name: "Drakkenheim",
    description:
      "<p>This contains content from the Drakkenheim campaign setting, by the Dungeon Dudes and Ghostfire Gaming.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 20,
    name: "Humblewood",
    description: "<p>This contains content from the Humblewood Campaign Setting, by Hit Point Press.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 21,
    name: "Kobold Press",
    description: "<p>This contains content by Kobold Press.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 22,
    name: "MCDM",
    description: "<p>This contains content by MCDM.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 23,
    name: "Legacy/Noncore",
    description:
      "<p>Character options from older sources that may conflict with the Core Rules. These include sources that are out of print or created for charity.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 24,
    name: "5.5e Core Rules",
    description:
      "<p>Character options from the 5.5e&nbsp;<em>Player’s Handbook</em>, <em>Dungeon Master’s Guide</em>, <em>Monster Manual</em>,&nbsp;and <em>D&amp;D Beyond Basic Rules</em>.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 25,
    name: "Free League",
    description: "<p>This contains content from Free League Publishing.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 26,
    name: "5e Core Rules",
    description:
      "<p>Character options from the&nbsp;5e&nbsp;<em>Player's Handbook</em>, <em>Dungeon Master's Guide</em>, <em>Monster Manual</em>, and&nbsp;<em>Basic Rules</em>.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 27,
    name: "The Griffon’s Saddlebag",
    description: "<p>This contains content from the Griffon's Saddlebag.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 28,
    name: "Internal",
    description: null,
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 29,
    name: "1985 Games",
    description: "<p>This contains content from 1985 Games.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 30,
    name: "Road to Ithaka Press",
    description: "<p>This contains content from Road to Ithaka Press.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 31,
    name: "Loot Tavern",
    description: "<p>This contains content from Loot Tavern.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 32,
    name: "Mage Hand Press",
    description:
      "<p><span style=\"color: rgba(58, 70, 72, 1); font-family: &quot;Helvetica Neue&quot;, Arial, Helvetica, sans-serif; font-size: 12.012px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0; text-transform: none; display: inline !important; float: none\">This contains content from Mage Hand Press.</span></p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 33,
    name: "Roll &amp; Play Press",
    description: "<p>This contains content from Roll &amp; Play Press.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 34,
    name: "Avantris Entertainment",
    description: "<p>This contains content from Avantris Entertainment.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 35,
    name: "Core Rules",
    description: null,
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 36,
    name: "Chaosium",
    description: "<p>This contains content from Chaosium.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 37,
    name: "Paizo",
    description: "<p>This contains content from Paizo.</p>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 38,
    name: "5.5e Expanded Rules",
    description: "<p>Character options from supplementary sourcebooks beyond the 5.5e Core Rules.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 39,
    name: "Visionary Production and Design Inc.",
    description: "<p>This contains content from Visionary Production and Design Inc.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 40,
    name: "Sterling Vermin",
    description: "<p>This contains content from Sterling Vermin.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 41,
    name: "Palaeo Games",
    description: "<p>This contains content from Palaeo Games.</p>\n<div id=\"tooltip-tag-f3a23x80\">&nbsp;</div>",
    isHideable: true,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 42,
    name: "Beadle &amp; Grimm's",
    description: "<p>This source contains content from Beadle &amp; Grimm's.</p>",
    isHideable: false,
    isEnabledByDefault: true,
    isToggleable: true,
    avatarUrl: ""
  },
  {
    id: 43,
    name: "Monkey DM",
    description: "<p>This contains content from MonkeyDM.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 44,
    name: "Baldman Games",
    description: "<p>This contains content from&nbsp;Baldman Games.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 45,
    name: "Vampire: The Dark Ages",
    description:
      "<p>This contains content from&nbsp;<em>Vampire: The Dark Ages</em>.</p>\n<div id=\"tooltip-tag-f3a23x80\">&nbsp;</div>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: false,
    avatarUrl: ""
  },
  {
    id: 46,
    name: "Subscriber Content",
    description: "<p>This contains content from D&amp;D Beyond Drops, the subscription library.</p>",
    isHideable: false,
    isEnabledByDefault: false,
    isToggleable: true,
    avatarUrl: ""
  }
];

exports.sources = sources;
exports.categories = categories;
