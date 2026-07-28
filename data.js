// Room geometry data for Palace of the Silver Princess (B3) map reveal tool.
// Coordinates are pixel rectangles [x1,y1,x2,y2] in the native resolution of
// each map image (level1.png = 1700x2290, level2.png = 1700x2504).
// These were digitized by eye against the scanned module maps and are
// approximate — use "Edit Mode" in the app to nudge/redraw any room that
// doesn't line up with the artwork.

function rect(x1, y1, x2, y2) {
  return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
}

const DND_MAPS = {
  level1: {
    id: "level1",
    name: "First Level (Entrance)",
    image: "maps/level1.png",
    width: 1700,
    height: 2290,
    rooms: [
      { id: "1", number: "1", label: "Gateyard", points: rect(900, 205, 1010, 320) },
      { id: "2", number: "2", label: "Skeleton Guard Room", points: rect(1010, 230, 1058, 300) },
      { id: "3", number: "3", label: "Lever Room", points: rect(858, 230, 900, 300) },
      { id: "4", number: "4", label: "Hidden Armory", points: rect(900, 150, 948, 205), secret: true },
      { id: "5", number: "5", label: "Library", points: rect(655, 320, 880, 495) },
      { id: "6", number: "6", label: "Storeroom", points: rect(655, 500, 800, 578) },
      { id: "7", number: "7", label: "Pantry", points: rect(655, 580, 880, 700) },
      { id: "8", number: "8", label: "Dining Hall", points: rect(655, 700, 880, 958) },
      { id: "9", number: "9", label: "Hobgoblin Barracks", points: rect(388, 780, 555, 958) },
      { id: "10", number: "10", label: "Deserted Barracks", points: rect(388, 460, 555, 780) },
      { id: "11", number: "11", label: "Cavern Entrance", points: rect(328, 248, 562, 460) },
      { id: "12", number: "12", label: "Oaken Cabinet Room", points: rect(248, 300, 330, 392) },
      { id: "13", number: "13", label: "Sunken Bath", points: rect(143, 245, 292, 300) },
      { id: "14", number: "14", label: "Pink Pedestal", points: rect(163, 300, 250, 392) },
      { id: "15", number: "15", label: "Mosaic Room", points: rect(93, 300, 163, 392) },
      { id: "16", number: "16", label: "Steam Room", points: rect(163, 392, 250, 462) },
      { id: "17", number: "17", label: "Cavern Temple", points: rect(93, 780, 320, 1010) },
      { id: "18", number: "18", label: "Underground Pool", points: rect(1448, 320, 1652, 552) },
      { id: "19", number: "19", label: "Green Slime", points: rect(1138, 458, 1247, 562) },
      { id: "20", number: "20", label: "Sulfur Pool", points: rect(1245, 488, 1400, 592) },
      { id: "21", number: "21", label: "Storeroom", points: rect(1053, 558, 1122, 622) },
      { id: "22", number: "22", label: "Blocked Exit", points: rect(1388, 763, 1462, 810) },
      { id: "23", number: "23", label: "Secret Room", points: rect(1388, 810, 1462, 857) },
      { id: "24", number: "24", label: "Fountain Room", points: rect(1328, 940, 1392, 1000) },
      { id: "25", number: "25", label: "Anteroom", points: rect(1243, 898, 1350, 1000) },
      { id: "26", number: "26", label: "Schoolroom", points: rect(918, 1008, 975, 1062) },
      { id: "27", number: "27", label: "Trapped Passage", points: rect(963, 1088, 1027, 1182) },
      { id: "28", number: "28", label: "Library (Palace)", points: rect(975, 1008, 1052, 1062) },
      { id: "29", number: "29", label: "Fitting Room", points: rect(1153, 1088, 1252, 1182) },
      { id: "30", number: "30", label: "Bedroom", points: rect(1388, 1368, 1452, 1422) },
      { id: "31", number: "31", label: "Sitting Room", points: rect(1153, 1328, 1300, 1422) },
      { id: "32", number: "32", label: "Wardrobe", points: rect(1398, 1418, 1462, 1562) },
      { id: "33", number: "33", label: "Nursery", points: rect(1248, 1578, 1400, 1652) },
      { id: "34", number: "34", label: "Captain of the Guard's Room", points: rect(713, 1008, 782, 1222) },
      { id: "35", number: "35", label: "Barracks", points: rect(828, 1118, 907, 1300) },
      { id: "36", number: "36", label: "Spy Room", points: rect(743, 1273, 822, 1312) },
      { id: "37", number: "37", label: "Armory", points: rect(678, 1368, 772, 1452) },
      { id: "38", number: "38", label: "Orc Guard Post", points: rect(678, 1588, 772, 1652) },
      { id: "39", number: "39", label: "Orc Den", points: rect(553, 1648, 672, 1712) },
      { id: "40", number: "40", label: "Orc Barracks", points: rect(348, 1648, 467, 1772) },
      { id: "41", number: "41", label: "Kitchen", points: rect(293, 1898, 522, 2012) },
      { id: "42", number: "42", label: "Cave", points: rect(93, 1470, 282, 1622) },
      { id: "43", number: "43", label: "Winding Cavern", points: rect(138, 1418, 412, 1612) },
      { id: "44", number: "44", label: "Rubble Cave", points: rect(553, 1398, 682, 1562) },
      { id: "45", number: "45", label: "Spiral Cave", points: rect(93, 1188, 217, 1302) },
      { id: "46", number: "46", label: "Trapped Alcove", points: rect(458, 1193, 547, 1262) },
      { id: "47", number: "47", label: "Side Chamber", points: rect(598, 1193, 717, 1292) },
      { id: "48", number: "48", label: "Storeroom (Ceiling Trap)", points: rect(393, 1073, 502, 1172) }
    ],
    secretFeatures: [
      { id: "s-1-4", label: "Secret door to Room 4", points: rect(898, 190, 948, 210) },
      { id: "s-35-36", label: "Secret door to Spy Room (36)", points: rect(797, 1273, 828, 1300) }
    ]
  },

  level2: {
    id: "level2",
    name: "Second Level (Upper)",
    image: "maps/level2.png",
    width: 1700,
    height: 2504,
    rooms: [
      { id: "49", number: "49", label: "Watch Tower", points: rect(235, 1310, 345, 1390) },
      { id: "50", number: "50", label: "Passageway", points: rect(235, 1190, 345, 1310) },
      { id: "51", number: "51", label: "Laboratory", points: rect(350, 980, 570, 1195) },
      { id: "52", number: "52", label: "Storeroom", points: rect(230, 860, 390, 980) },
      { id: "53", number: "53", label: "Mirabilis' Room", points: rect(390, 860, 460, 980) },
      { id: "54", number: "54", label: "Washroom", points: rect(460, 800, 570, 980) },
      { id: "55", number: "55", label: "Study", points: rect(230, 790, 390, 900) },
      { id: "56", number: "56", label: "Magic User's Bedroom", points: rect(230, 655, 460, 790) },
      { id: "57", number: "57", label: "Alcove", points: rect(230, 590, 345, 655) },
      { id: "58", number: "58", label: "Sanctuary", points: rect(230, 390, 460, 655) },
      { id: "59", number: "59", label: "Chapel", points: rect(230, 330, 345, 390) },
      { id: "60", number: "60", label: "Secret Closet", points: rect(345, 280, 460, 390), secret: true },
      { id: "61", number: "61", label: "Game Room", points: rect(340, 210, 460, 300) },
      { id: "62", number: "62", label: "Ballroom", points: rect(625, 330, 1055, 635) },
      { id: "63", number: "63", label: "Palace Garden", points: rect(625, 655, 820, 850) },
      { id: "64", number: "64", label: "Silent Alarm", points: rect(820, 960, 870, 1010) },
      { id: "65", number: "65", label: "Great Hall", points: rect(870, 700, 980, 820) },
      { id: "66", number: "66", label: "Washroom", points: rect(1015, 890, 1120, 1005) },
      { id: "67", number: "67", label: "Fountain / Passage", points: rect(870, 1000, 980, 1105) },
      { id: "68", number: "68", label: "Chamber", points: rect(685, 1085, 800, 1290) },
      { id: "69", number: "69", label: "Chamber", points: rect(685, 1290, 800, 1400) },
      { id: "70", number: "70", label: "Chamber", points: rect(685, 1400, 800, 1495) },
      { id: "71", number: "71", label: "Room", points: rect(400, 1390, 460, 1470) },
      { id: "72", number: "72", label: "Room", points: rect(460, 1390, 540, 1470) },
      { id: "73", number: "73", label: "Room", points: rect(400, 1470, 540, 1650) },
      { id: "74", number: "74", label: "Guard Room", points: rect(900, 1650, 1015, 1740) },
      { id: "75", number: "75", label: "Room", points: rect(1015, 1650, 1130, 1740) },
      { id: "76", number: "76", label: "Throne Room", points: rect(570, 1470, 850, 1650) }
    ],
    secretFeatures: [
      { id: "s-59-60", label: "Secret door to Closet (60)", points: rect(345, 330, 365, 390) },
      { id: "s-70-76", label: "Secret door south of 70", points: rect(795, 1400, 825, 1450) }
    ]
  }
};

if (typeof module !== "undefined") module.exports = { DND_MAPS };
