/**
 * 2026 NASCAR Cup Series schedule (broadcast times Eastern).
 * `raceStartIso` uses explicit `-04:00` (EDT) or `-05:00` (EST) for that calendar date.
 * Southern 500: NBC list had "Aug. 6" between Aug 29 and Sept 13 — stored as **Sept 6, 2026** (Darlington).
 */
export type Cup2026ScheduleRow = {
  weekKey: string;
  raceName: string;
  trackName: string;
  /** ISO 8601 instant at green-flag (Eastern). */
  raceStartIso: string;
};

/** Stable key used by Würth / Texas seed and deep links (unchanged). */
export const NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026 = "2026_cup_wurth400_texas" as const;

export const CUP_2026_SCHEDULE: Cup2026ScheduleRow[] = [
  {
    weekKey: "2026_cup_cook_out_clash_bowman_gray",
    raceName: "Cook Out Clash at Bowman Gray",
    trackName: "Bowman Gray Stadium",
    raceStartIso: "2026-02-01T20:00:00-05:00",
  },
  {
    weekKey: "2026_cup_america_250_florida_duel_1_daytona",
    raceName: "America 250 Florida Duel 1 at DAYTONA",
    trackName: "Daytona International Speedway",
    raceStartIso: "2026-02-12T19:00:00-05:00",
  },
  {
    weekKey: "2026_cup_america_250_florida_duel_2_daytona",
    raceName: "America 250 Florida Duel 2 at DAYTONA",
    trackName: "Daytona International Speedway",
    raceStartIso: "2026-02-12T20:45:00-05:00",
  },
  {
    weekKey: "2026_cup_daytona_500",
    raceName: "DAYTONA 500",
    trackName: "Daytona International Speedway",
    raceStartIso: "2026-02-15T14:30:00-05:00",
  },
  {
    weekKey: "2026_cup_autotrader_400",
    raceName: "Autotrader 400",
    trackName: "EchoPark Speedway",
    raceStartIso: "2026-02-22T15:00:00-05:00",
  },
  {
    weekKey: "2026_cup_duramax_grand_prix",
    raceName: "DuraMax Grand Prix",
    trackName: "Circuit of the Americas",
    raceStartIso: "2026-03-01T15:30:00-05:00",
  },
  {
    weekKey: "2026_cup_straight_talk_wireless_500",
    raceName: "Straight Talk Wireless 500",
    trackName: "Phoenix Raceway",
    raceStartIso: "2026-03-08T15:30:00-04:00",
  },
  {
    weekKey: "2026_cup_pennzoil_400",
    raceName: "Pennzoil 400 presented by Jiffy Lube",
    trackName: "Las Vegas Motor Speedway",
    raceStartIso: "2026-03-15T16:00:00-04:00",
  },
  {
    weekKey: "2026_cup_goodyear_400",
    raceName: "Goodyear 400",
    trackName: "Darlington Raceway",
    raceStartIso: "2026-03-22T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_cook_out_400_martinsville",
    raceName: "Cook Out 400",
    trackName: "Martinsville Speedway",
    raceStartIso: "2026-03-29T15:30:00-04:00",
  },
  {
    weekKey: "2026_cup_food_city_500",
    raceName: "Food City 500",
    trackName: "Bristol Motor Speedway",
    raceStartIso: "2026-04-12T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_adventhealth_400",
    raceName: "AdventHealth 400",
    trackName: "Kansas Speedway",
    raceStartIso: "2026-04-19T14:00:00-04:00",
  },
  {
    weekKey: "2026_cup_jack_links_500_talladega",
    raceName: "Jack Link's 500",
    trackName: "Talladega Superspeedway",
    raceStartIso: "2026-04-26T15:00:00-04:00",
  },
  {
    weekKey: NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026,
    raceName: "Würth 400 presented by LIQUI MOLY",
    trackName: "Texas Motor Speedway",
    raceStartIso: "2026-05-03T15:30:00-04:00",
  },
  {
    weekKey: "2026_cup_go_bowling_the_glen",
    raceName: "Go Bowling at The Glen",
    trackName: "Watkins Glen International",
    raceStartIso: "2026-05-10T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_nascar_all_star_race",
    raceName: "NASCAR All-Star Race",
    trackName: "Dover Motor Speedway",
    raceStartIso: "2026-05-17T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_coca_cola_600",
    raceName: "Coca-Cola 600",
    trackName: "Charlotte Motor Speedway",
    raceStartIso: "2026-05-24T18:00:00-04:00",
  },
  {
    weekKey: "2026_cup_cracker_barrel_400",
    raceName: "Cracker Barrel 400",
    trackName: "Nashville Superspeedway",
    raceStartIso: "2026-05-31T19:00:00-04:00",
  },
  {
    weekKey: "2026_cup_firekeepers_casino_400",
    raceName: "Firekeepers Casino 400",
    trackName: "Michigan International Speedway",
    raceStartIso: "2026-06-07T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_pocono",
    raceName: "NASCAR Cup Series Race at Pocono",
    trackName: "Pocono Raceway",
    raceStartIso: "2026-06-14T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_anduril_250",
    raceName: "Anduril 250",
    trackName: "Naval Base Coronado",
    raceStartIso: "2026-06-21T16:00:00-04:00",
  },
  {
    weekKey: "2026_cup_toyota_save_mart_350",
    raceName: "Toyota / Save Mart 350",
    trackName: "Sonoma Raceway",
    raceStartIso: "2026-06-28T15:30:00-04:00",
  },
  {
    weekKey: "2026_cup_chicagoland",
    raceName: "NASCAR Cup Series Race at Chicagoland",
    trackName: "Chicagoland Speedway",
    raceStartIso: "2026-07-05T18:00:00-04:00",
  },
  {
    weekKey: "2026_cup_quaker_state_400",
    raceName: "Quaker State 400 Available at Walmart",
    trackName: "EchoPark Speedway",
    raceStartIso: "2026-07-12T19:30:00-04:00",
  },
  {
    weekKey: "2026_cup_window_world_450",
    raceName: "Window World 450",
    trackName: "North Wilkesboro Speedway",
    raceStartIso: "2026-07-19T19:00:00-04:00",
  },
  {
    weekKey: "2026_cup_brickyard_400",
    raceName: "Brickyard 400",
    trackName: "Indianapolis Motor Speedway",
    raceStartIso: "2026-07-26T14:00:00-04:00",
  },
  {
    weekKey: "2026_cup_iowa_corn_350",
    raceName: "Iowa Corn 350 Powered by Ethanol",
    trackName: "Iowa Speedway",
    raceStartIso: "2026-08-09T15:30:00-04:00",
  },
  {
    weekKey: "2026_cup_cook_out_400_richmond",
    raceName: "Cook Out 400",
    trackName: "Richmond Raceway",
    raceStartIso: "2026-08-15T19:00:00-04:00",
  },
  {
    weekKey: "2026_cup_new_hampshire",
    raceName: "NASCAR Cup Series Race at New Hampshire",
    trackName: "New Hampshire Motor Speedway",
    raceStartIso: "2026-08-23T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_coke_zero_sugar_400",
    raceName: "Coke Zero Sugar 400",
    trackName: "Daytona International Speedway",
    raceStartIso: "2026-08-29T19:30:00-04:00",
  },
  {
    weekKey: "2026_cup_cook_out_southern_500",
    raceName: "Cook Out Southern 500",
    trackName: "Darlington Raceway",
    raceStartIso: "2026-09-06T18:00:00-04:00",
  },
  {
    weekKey: "2026_cup_enjoy_illinois_300",
    raceName: "Enjoy Illinois 300",
    trackName: "World Wide Technology Raceway",
    raceStartIso: "2026-09-13T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_bass_pro_shops_night_race",
    raceName: "Bass Pro Shops Night Race",
    trackName: "Bristol Motor Speedway",
    raceStartIso: "2026-09-19T19:30:00-04:00",
  },
  {
    weekKey: "2026_cup_hollywood_casino_400",
    raceName: "Hollywood Casino 400",
    trackName: "Kansas Speedway",
    raceStartIso: "2026-09-27T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_south_point_400",
    raceName: "South Point 400",
    trackName: "Las Vegas Motor Speedway",
    raceStartIso: "2026-10-04T17:30:00-04:00",
  },
  {
    weekKey: "2026_cup_bank_of_america_roval_400",
    raceName: "Bank of America ROVAL 400",
    trackName: "Charlotte Motor Speedway Road Course",
    raceStartIso: "2026-10-11T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_freeway_insurance_500",
    raceName: "Freeway Insurance 500",
    trackName: "Phoenix Raceway",
    raceStartIso: "2026-10-18T15:00:00-04:00",
  },
  {
    weekKey: "2026_cup_yellawood_500",
    raceName: "YellaWood 500",
    trackName: "Talladega Superspeedway",
    raceStartIso: "2026-10-25T14:00:00-04:00",
  },
  {
    weekKey: "2026_cup_xfinity_500",
    raceName: "Xfinity 500",
    trackName: "Martinsville Speedway",
    raceStartIso: "2026-11-01T14:00:00-05:00",
  },
  {
    weekKey: "2026_cup_championship_homestead",
    raceName: "NASCAR Cup Series Championship",
    trackName: "Homestead-Miami Speedway",
    raceStartIso: "2026-11-08T15:00:00-05:00",
  },
];
