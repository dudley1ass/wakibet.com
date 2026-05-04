/**
 * Registered teams — **AVP NEXT South Beach May Open** (May 2026, South Florida / Miami area).
 * Tied to schedule key `avp_2026_contender_south_florida` (AVP South Florida Open, May 23–24).
 */

export type AvpBeachTeamDivisionCode =
  | "mens_aa"
  | "mens_aaa"
  | "mens_open"
  | "womens_aa"
  | "womens_aaa"
  | "womens_open"
  | "heritage_mens"
  | "heritage_womens";

export type AvpBeachRegisteredTeam = {
  /** Stable id for picks / CSV join later */
  team_key: string;
  division_code: AvpBeachTeamDivisionCode;
  /** Human label from AVP (e.g. "Mens Open") */
  division_label: string;
  player_one: string;
  player_two: string;
  /** Full team line as published */
  team_label: string;
};

export const AVP_SOUTH_BEACH_MAY_OPEN_TITLE = "AVP NEXT South Beach May Open";

export const AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY = "avp_2026_contender_south_florida" as const;

const teams: AvpBeachRegisteredTeam[] = [
  {
    team_key: "sb26-m-aa-gonzalez-torres",
    division_code: "mens_aa",
    division_label: "Mens AA",
    player_one: "Noah Gonzalez",
    player_two: "Andres Torres",
    team_label: "Noah Gonzalez / Andres Torres",
  },
  {
    team_key: "sb26-m-aa-baena-del-nogal",
    division_code: "mens_aa",
    division_label: "Mens AA",
    player_one: "Joaquin Baena",
    player_two: "Yenser Del Nogal",
    team_label: "Joaquin Baena / Yenser Del Nogal",
  },
  {
    team_key: "sb26-m-aa-barrett-lacy",
    division_code: "mens_aa",
    division_label: "Mens AA",
    player_one: "Ricky Barrett",
    player_two: "Logan Lacy",
    team_label: "Ricky Barrett / Logan Lacy",
  },
  {
    team_key: "sb26-m-aaa-castro-perez",
    division_code: "mens_aaa",
    division_label: "Mens AAA",
    player_one: "Lucas Castro",
    player_two: "Lothar Perez",
    team_label: "Lucas Castro / Lothar Perez",
  },
  {
    team_key: "sb26-m-aaa-bigelow-bowen",
    division_code: "mens_aaa",
    division_label: "Mens AAA",
    player_one: "Joseph Bigelow",
    player_two: "Taylor Bowen",
    team_label: "Joseph Bigelow / Taylor Bowen",
  },
  {
    team_key: "sb26-m-op-perez-rondon",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Guillermo Perez",
    player_two: "Gabriel Rondón",
    team_label: "Guillermo Perez / Gabriel Rondón",
  },
  {
    team_key: "sb26-m-op-lessel-valenzi",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Mike Lessel",
    player_two: "Michael Valenzi",
    team_label: "Mike Lessel / Michael Valenzi",
  },
  {
    team_key: "sb26-m-op-dyner-lozano",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Daniel Dyner",
    player_two: "Brandon Lozano",
    team_label: "Daniel Dyner / Brandon Lozano",
  },
  {
    team_key: "sb26-m-op-defreitas-zamora",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Maxwell DeFreitas",
    player_two: "Isaac Zamora",
    team_label: "Maxwell DeFreitas / Isaac Zamora",
  },
  {
    team_key: "sb26-m-op-miller-ray",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Nathaniel Miller",
    player_two: "Jacob Ray",
    team_label: "Nathaniel Miller / Jacob Ray",
  },
  {
    team_key: "sb26-m-op-kwiatkowski-lopez",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Marcin Kwiatkowski",
    player_two: "Jeremy Lopez",
    team_label: "Marcin Kwiatkowski / Jeremy Lopez",
  },
  {
    team_key: "sb26-m-op-erazo-price",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Alex Erazo",
    player_two: "Cody Price",
    team_label: "Alex Erazo / Cody Price",
  },
  {
    team_key: "sb26-m-op-allajbegu-mccalep",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Engjell Allajbegu",
    player_two: "Luke McCalep",
    team_label: "Engjell Allajbegu / Luke McCalep",
  },
  {
    team_key: "sb26-m-op-cole-dedo",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Tim Cole",
    player_two: "Chris Dedo",
    team_label: "Tim Cole / Chris Dedo",
  },
  {
    team_key: "sb26-m-op-diaz-hartmann",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Alex Diaz",
    player_two: "Adam Hartmann",
    team_label: "Alex Diaz / Adam Hartmann",
  },
  {
    team_key: "sb26-m-op-jimenez-ohman",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Carlos Jimenez",
    player_two: "Kyle Ohman",
    team_label: "Carlos Jimenez / Kyle Ohman",
  },
  {
    team_key: "sb26-m-op-bhatia-lloyd",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Tejas Bhatia",
    player_two: "Connor Lloyd",
    team_label: "Tejas Bhatia / Connor Lloyd",
  },
  {
    team_key: "sb26-m-op-espinosa-mustelier",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Luis Espinosa",
    player_two: "Alberto Mustelier",
    team_label: "Luis Espinosa / Alberto Mustelier",
  },
  {
    team_key: "sb26-m-op-martindale-tsiapalis",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Mason Martindale",
    player_two: "Max Tsiapalis",
    team_label: "Mason Martindale / Max Tsiapalis",
  },
  {
    team_key: "sb26-m-op-homan-williams",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "Adam Homan",
    player_two: "Jack Williams",
    team_label: "Adam Homan / Jack Williams",
  },
  {
    team_key: "sb26-m-op-winsten-zumerchik",
    division_code: "mens_open",
    division_label: "Mens Open",
    player_one: "George Winsten",
    player_two: "Andre Zumerchik",
    team_label: "George Winsten / Andre Zumerchik",
  },
  {
    team_key: "sb26-w-aa-ledoyen-ramos",
    division_code: "womens_aa",
    division_label: "Womens AA",
    player_one: "Olivia LeDoyen",
    player_two: 'Julianna "Julie" Ramos',
    team_label: 'Olivia LeDoyen / Julianna "Julie" Ramos',
  },
  {
    team_key: "sb26-w-aa-bachmann-weikl",
    division_code: "womens_aa",
    division_label: "Womens AA",
    player_one: "Gemma Bachmann",
    player_two: "Sophie Weikl",
    team_label: "Gemma Bachmann / Sophie Weikl",
  },
  {
    team_key: "sb26-w-aa-duran-hufsky",
    division_code: "womens_aa",
    division_label: "Womens AA",
    player_one: "Nicole Duran",
    player_two: "Adriana Hufsky",
    team_label: "Nicole Duran / Adriana Hufsky",
  },
  {
    team_key: "sb26-w-aa-gomez-moreno",
    division_code: "womens_aa",
    division_label: "Womens AA",
    player_one: "Cami Gomez Hein",
    player_two: "Paula Moreno",
    team_label: "Cami Gomez Hein / Paula Moreno",
  },
  {
    team_key: "sb26-w-aaa-angel-fuentes",
    division_code: "womens_aaa",
    division_label: "Womens AAA",
    player_one: "Jasmyne Angel",
    player_two: "Isabel Mascarua Fuentes",
    team_label: "Jasmyne Angel / Isabel Mascarua Fuentes",
  },
  {
    team_key: "sb26-w-aaa-mascarua-rivalta",
    division_code: "womens_aaa",
    division_label: "Womens AAA",
    player_one: "Ana Sofia Mascarua",
    player_two: "Fiorella Rivalta",
    team_label: "Ana Sofia Mascarua / Fiorella Rivalta",
  },
  {
    team_key: "sb26-w-aaa-aziz-decarlo",
    division_code: "womens_aaa",
    division_label: "Womens AAA",
    player_one: "Gabriella Aziz",
    player_two: "Savannah DeCarlo",
    team_label: "Gabriella Aziz / Savannah DeCarlo",
  },
  {
    team_key: "sb26-w-op-hearn-markle",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Meg Hearn",
    player_two: "Ashley Markle",
    team_label: "Meg Hearn / Ashley Markle",
  },
  {
    team_key: "sb26-w-op-gindoff-wachowicz",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Haven Gindoff",
    player_two: "Aleksandra Wachowicz",
    team_label: "Haven Gindoff / Aleksandra Wachowicz",
  },
  {
    team_key: "sb26-w-op-lam-stafford",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Elena Lam",
    player_two: "Sadie Stafford",
    team_label: "Elena Lam / Sadie Stafford",
  },
  {
    team_key: "sb26-w-op-bautz-russell",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Ana Bautz",
    player_two: "Lilly Russell",
    team_label: "Ana Bautz / Lilly Russell",
  },
  {
    team_key: "sb26-w-op-ng-tam",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Yileen Ng",
    player_two: "Rachel Tam",
    team_label: "Yileen Ng / Rachel Tam",
  },
  {
    team_key: "sb26-w-op-dalfo-lozano",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Anna Dalfo",
    player_two: "Jessie Lozano",
    team_label: "Anna Dalfo / Jessie Lozano",
  },
  {
    team_key: "sb26-w-op-andres-visscher",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Hannah Andres",
    player_two: "Jae-Lyn Visscher",
    team_label: "Hannah Andres / Jae-Lyn Visscher",
  },
  {
    team_key: "sb26-w-op-gillis-smith",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Mary Gillis",
    player_two: "Madelin Smith",
    team_label: "Mary Gillis / Madelin Smith",
  },
  {
    team_key: "sb26-w-op-edwards-murczek",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Kendall Edwards",
    player_two: "Sarah Murczek",
    team_label: "Kendall Edwards / Sarah Murczek",
  },
  {
    team_key: "sb26-w-op-bereman-durcakova",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Madelyn Bereman",
    player_two: "Alice Durcakova",
    team_label: "Madelyn Bereman / Alice Durcakova",
  },
  {
    team_key: "sb26-w-op-clark-fernandes",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Stacey Clark",
    player_two: "Flavia Fernandes",
    team_label: "Stacey Clark / Flavia Fernandes",
  },
  {
    team_key: "sb26-w-op-paraspolo-will",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Kathilia Paraspolo",
    player_two: "Katie Will",
    team_label: "Kathilia Paraspolo / Katie Will",
  },
  {
    team_key: "sb26-w-op-janssens-rankin",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Madison Janssens",
    player_two: "Kelsey Rankin",
    team_label: "Madison Janssens / Kelsey Rankin",
  },
  {
    team_key: "sb26-w-op-bennett-ohara",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Angel Bennett",
    player_two: "Brittney OHara",
    team_label: "Angel Bennett / Brittney OHara",
  },
  {
    team_key: "sb26-w-op-race-solo",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Jade Race",
    player_two: "",
    team_label: "Jade Race",
  },
  {
    team_key: "sb26-w-op-huggins-sokolovska",
    division_code: "womens_open",
    division_label: "Womens Open",
    player_one: "Lauren Huggins",
    player_two: "Yana Sokolovska",
    team_label: "Lauren Huggins / Yana Sokolovska",
  },
];

export const AVP_SOUTH_BEACH_MAY_OPEN_TEAMS: AvpBeachRegisteredTeam[] = teams;

export function avpRegisteredTeamPoolForEvent(eventKey: string): {
  title: string;
  teams: AvpBeachRegisteredTeam[];
} | null {
  if (eventKey === AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY) {
    return { title: AVP_SOUTH_BEACH_MAY_OPEN_TITLE, teams: AVP_SOUTH_BEACH_MAY_OPEN_TEAMS };
  }
  return null;
}
