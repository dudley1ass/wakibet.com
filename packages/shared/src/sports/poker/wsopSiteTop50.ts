/**
 * WSOP.com-style “top players” leaderboard snapshot (top 50 by earnings shown on site).
 * Source: operator-provided paste — includes earnings and bracelet / ring / cash counts as displayed.
 */

export type WsopSiteLeaderboardPlayer = {
  wsop_rank: number;
  player_name: string;
  country: string;
  /** Career WSOP earnings on leaderboard (USD). */
  earnings_usd: number;
  bracelets: number;
  rings: number;
  cashes: number;
};

export const WSOP_SITE_TOP_50_PLAYERS: WsopSiteLeaderboardPlayer[] = [
  { wsop_rank: 1, player_name: "Marius Kudzmanas", country: "Lithuania", earnings_usd: 2_294_201, bracelets: 1, rings: 0, cashes: 4 },
  { wsop_rank: 2, player_name: "Akihiro Konishi", country: "Japan", earnings_usd: 1_374_854, bracelets: 0, rings: 0, cashes: 1 },
  { wsop_rank: 3, player_name: "Christopher Nam Nguyen", country: "Austria", earnings_usd: 1_296_332, bracelets: 1, rings: 0, cashes: 3 },
  { wsop_rank: 4, player_name: "Christopher Brian Hunichen", country: "United States", earnings_usd: 920_854, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 5, player_name: "Александр Басин", country: "Russia", earnings_usd: 876_595, bracelets: 0, rings: 0, cashes: 1 },
  { wsop_rank: 6, player_name: "Tony Ren Lin", country: "China", earnings_usd: 805_435, bracelets: 0, rings: 0, cashes: 2 },
  { wsop_rank: 7, player_name: "Leonardo Nascimento", country: "Brazil", earnings_usd: 726_581, bracelets: 0, rings: 1, cashes: 3 },
  { wsop_rank: 8, player_name: "Christian Frimodt", country: "Norway", earnings_usd: 698_884, bracelets: 1, rings: 0, cashes: 2 },
  { wsop_rank: 9, player_name: "Nikolay Bibov", country: "Bulgaria", earnings_usd: 658_784, bracelets: 0, rings: 0, cashes: 1 },
  { wsop_rank: 10, player_name: "Paulius Vaitiekunas", country: "Lithuania", earnings_usd: 573_543, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 11, player_name: "Andrey Shitov", country: "Russia", earnings_usd: 564_488, bracelets: 0, rings: 0, cashes: 7 },
  { wsop_rank: 12, player_name: "Allen Li-xin Shen", country: "Canada", earnings_usd: 557_725, bracelets: 0, rings: 3, cashes: 14 },
  { wsop_rank: 13, player_name: "Pablo Alfredo Nazar", country: "Unknown Country", earnings_usd: 553_746, bracelets: 0, rings: 0, cashes: 2 },
  { wsop_rank: 14, player_name: "ThithuTrang Hoang", country: "Vietnam", earnings_usd: 553_324, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 15, player_name: "Yannick Schneider", country: "Germany", earnings_usd: 535_765, bracelets: 0, rings: 0, cashes: 7 },
  { wsop_rank: 16, player_name: "Dimitrios Michailidis", country: "Czechia", earnings_usd: 523_475, bracelets: 0, rings: 0, cashes: 8 },
  { wsop_rank: 17, player_name: "Nikolai Ogoltsov", country: "Russia", earnings_usd: 521_299, bracelets: 1, rings: 0, cashes: 1 },
  { wsop_rank: 18, player_name: "Alexei Ivashchenkov", country: "Belarus", earnings_usd: 520_139, bracelets: 0, rings: 1, cashes: 3 },
  { wsop_rank: 19, player_name: "Ole Schemion", country: "Unknown Country", earnings_usd: 514_731, bracelets: 1, rings: 0, cashes: 7 },
  { wsop_rank: 20, player_name: "Antonio Guimaraens Garcia", country: "Spain", earnings_usd: 486_927, bracelets: 0, rings: 0, cashes: 1 },
  { wsop_rank: 21, player_name: "Punnat Punsri", country: "Thailand", earnings_usd: 480_650, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 22, player_name: "Vladimir Kotuhov", country: "Austria", earnings_usd: 455_836, bracelets: 0, rings: 0, cashes: 8 },
  { wsop_rank: 23, player_name: "Klas Lofberg", country: "Sweden", earnings_usd: 441_908, bracelets: 0, rings: 1, cashes: 8 },
  { wsop_rank: 24, player_name: "Alex Anton", country: "United States", earnings_usd: 410_268, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 25, player_name: "Bernard Larabi", country: "Hungary", earnings_usd: 404_652, bracelets: 0, rings: 1, cashes: 7 },
  { wsop_rank: 26, player_name: "Santtu Leinonen", country: "Finland", earnings_usd: 400_875, bracelets: 0, rings: 1, cashes: 7 },
  { wsop_rank: 27, player_name: "Unknown Player", country: "Canada", earnings_usd: 390_309, bracelets: 1, rings: 1, cashes: 14 },
  { wsop_rank: 28, player_name: "Maxwell Guo", country: "United States", earnings_usd: 387_035, bracelets: 0, rings: 1, cashes: 2 },
  { wsop_rank: 29, player_name: "Jones Jesse", country: "United States", earnings_usd: 386_456, bracelets: 0, rings: 1, cashes: 5 },
  { wsop_rank: 30, player_name: "Thomas Brabham", country: "United States", earnings_usd: 368_545, bracelets: 0, rings: 1, cashes: 1 },
  { wsop_rank: 31, player_name: "Hengtao Zhu", country: "Finland", earnings_usd: 366_628, bracelets: 0, rings: 0, cashes: 1 },
  { wsop_rank: 32, player_name: "Shaun Deeb", country: "United States", earnings_usd: 364_487, bracelets: 0, rings: 1, cashes: 13 },
  { wsop_rank: 33, player_name: "ZiQian Wang", country: "China", earnings_usd: 359_539, bracelets: 0, rings: 1, cashes: 6 },
  { wsop_rank: 34, player_name: "Bruno Matheus Volkmann", country: "Unknown Country", earnings_usd: 358_235, bracelets: 0, rings: 0, cashes: 8 },
  { wsop_rank: 35, player_name: "Michael Sklenicka", country: "Czechia", earnings_usd: 349_269, bracelets: 0, rings: 0, cashes: 4 },
  { wsop_rank: 36, player_name: "pei li", country: "Unknown Country", earnings_usd: 346_745, bracelets: 0, rings: 1, cashes: 14 },
  { wsop_rank: 37, player_name: "Miroslav Alilovic", country: "Spain", earnings_usd: 325_382, bracelets: 0, rings: 0, cashes: 2 },
  { wsop_rank: 38, player_name: "Senthuran Vijayaratnam", country: "Canada", earnings_usd: 313_513, bracelets: 0, rings: 1, cashes: 7 },
  { wsop_rank: 39, player_name: "Franco Tucci", country: "Canada", earnings_usd: 313_233, bracelets: 0, rings: 3, cashes: 14 },
  { wsop_rank: 40, player_name: "Niklas Astedt", country: "Unknown Country", earnings_usd: 308_877, bracelets: 0, rings: 0, cashes: 11 },
  { wsop_rank: 41, player_name: "David Mzareulov", country: "United States", earnings_usd: 297_708, bracelets: 0, rings: 0, cashes: 8 },
  { wsop_rank: 42, player_name: "Ivan Ilichev", country: "Russia", earnings_usd: 295_306, bracelets: 0, rings: 0, cashes: 9 },
  { wsop_rank: 43, player_name: "Pedro Faustino", country: "Portugal", earnings_usd: 287_541, bracelets: 1, rings: 0, cashes: 6 },
  { wsop_rank: 44, player_name: "Thomas Eychenne", country: "France", earnings_usd: 283_243, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 45, player_name: "Sandro Carucci", country: "Unknown Country", earnings_usd: 279_000, bracelets: 0, rings: 1, cashes: 1 },
  { wsop_rank: 46, player_name: "Zachary VanKeuren", country: "Mexico", earnings_usd: 269_679, bracelets: 0, rings: 1, cashes: 2 },
  { wsop_rank: 47, player_name: "Peter Ng", country: "United States", earnings_usd: 265_757, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 48, player_name: "Aleksandr Tipikin", country: "Unknown Country", earnings_usd: 263_664, bracelets: 0, rings: 0, cashes: 3 },
  { wsop_rank: 49, player_name: "Victor Pertile", country: "Brazil", earnings_usd: 263_308, bracelets: 0, rings: 1, cashes: 4 },
  { wsop_rank: 50, player_name: "Benjamin Pierre Hammann", country: "France", earnings_usd: 260_921, bracelets: 0, rings: 1, cashes: 4 },
];
