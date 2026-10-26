// SAMPLE data: replace with real Naga terminals, routes, and coordinates
export type StopType = "jeepney" | "tricycle" | "padyak";

export const stopTypeLabels: Record<StopType, string> = {
  jeepney: "Jeepney terminal",
  tricycle: "Tricycle terminal",
  padyak: "Padyak terminal",
};

export const stopTypeColors: Record<StopType, string> = {
  jeepney: "#dc2626",
  tricycle: "#2563eb",
  padyak: "#16a34a",
};

export type TransitStop = {
  id: string;
  name: string;
  details: string;
  type: StopType;
  lat: number;
  lng: number;
};

export type TransitRoute = {
  id: string;
  name: string;
  details: string;
  color: string;
  path: [number, number][];
};

export type FarePlan = {
  id: string;
  name: string;
  currency: string;
  baseFare: number;
  includedDistanceKm: number;
  additionalFarePerStartedKm: number;
  estimateRangeMultiplier: number;
};

export type TransitData = {
  stops: TransitStop[];
  routes: TransitRoute[];
  farePlans: FarePlan[];
  activeFarePlanId: string;
};

export const stops: TransitStop[] = [
  {
    id: "liboton-waiting-area",
    name: "Liboton Waiting Area",
    details: "",
    type: "padyak",
    lat: 13.6342,
    lng: 123.18754,
  },
  {
    id: "plaza-waiting-area",
    name: "Plaza Waiting Area",
    details: "",
    type: "tricycle",
    lat: 13.62323,
    lng: 123.18514,
  },
  {
    id: "san-felipe-jeep-terminal",
    name: "San Felipe Jeep Terminal",
    details: "",
    type: "jeepney",
    lat: 13.62351,
    lng: 123.18463,
  },
  {
    id: "del-rosario-jeep-terminal",
    name: "Del Rosario Jeep Terminal",
    details: "",
    type: "jeepney",
    lat: 13.62314,
    lng: 123.18608,
  },
  {
    id: "terminal-tricycle-waiting-hub",
    name: "Terminal Tricycle Waiting Hub",
    details: "",
    type: "tricycle",
    lat: 13.61979,
    lng: 123.18903,
  },
  {
    id: "sm-waiting-area",
    name: "SM Waiting Area",
    details: "",
    type: "tricycle",
    lat: 13.62213,
    lng: 123.18975,
  },
  {
    id: "pacol-jeep-terminal",
    name: "Pacol Jeep Terminal",
    details: "",
    type: "jeepney",
    lat: 13.62097,
    lng: 123.18465,
  },
];

export const routes: TransitRoute[] = [
  {
    id: "san-felipe",
    name: "San Felipe",
    details: "",
    color: "#2563eb",
    path: [
      [13.62151, 123.18542],
      [13.62131, 123.18491],
      [13.62124, 123.18412],
      [13.623, 123.18447],
      [13.62415, 123.18483],
      [13.62412, 123.18593],
      [13.62466, 123.18624],
      [13.62605, 123.18751],
      [13.62752, 123.18848],
      [13.63044, 123.19147],
      [13.63398, 123.19552],
      [13.63474, 123.19622],
      [13.63614, 123.19918],
      [13.63656, 123.20052],
      [13.63771, 123.20208],
      [13.64065, 123.2035],
      [13.64333, 123.2047],
      [13.64684, 123.21459],
      [13.6505, 123.2227],
      [13.65125, 123.22848],
      [13.65058, 123.23005],
    ],
  },
  {
    id: "magsaysay-centro",
    name: "Magsaysay - centro",
    details: "",
    color: "#dc2626",
    path: [
      [13.63332, 123.19464],
      [13.63139, 123.19676],
      [13.62677, 123.20067],
      [13.62602, 123.20096],
      [13.62099, 123.20087],
      [13.61987, 123.20048],
      [13.61943, 123.2001],
      [13.61576, 123.19355],
      [13.61564, 123.19273],
      [13.61666, 123.18531],
      [13.61638, 123.18424],
      [13.61696, 123.18317],
      [13.61923, 123.18378],
      [13.62122, 123.18412],
      [13.62297, 123.18446],
      [13.6242, 123.18488],
      [13.62414, 123.18595],
      [13.62468, 123.18626],
      [13.62538, 123.18699],
      [13.62752, 123.18849],
      [13.63333, 123.19466],
    ],
  },
];

// Edit these values to update the distance-based fare calculation.
export const fareCurrency = "PHP";
export const fareRules = {
  baseFare: 15,
  includedDistanceKm: 3,
  additionalFarePerStartedKm: 5,
  estimateRangeMultiplier: 3,
};

export const defaultTransitData: TransitData = {
  stops,
  routes,
  farePlans: [
    {
      id: "fare-standard",
      name: "Standard fare",
      currency: fareCurrency,
      ...fareRules,
    },
  ],
  activeFarePlanId: "fare-standard",
};

export function getActiveFarePlan(data: TransitData): FarePlan {
  return (
    data.farePlans.find((plan) => plan.id === data.activeFarePlanId) ??
    data.farePlans[0] ??
    defaultTransitData.farePlans[0]
  );
}
export const fareDisclaimer =
  "This is an estimated fare. The fare may be adjusted or increased for special requests, and the driver may request double fare. Confirm the final fare with the driver before starting the trip.";

// OSRM provides driving-road distances; replace this URL to use another router.
export const routingServiceUrl = "https://router.project-osrm.org";
// Nominatim resolves the nearest named OSM place or street for a map tap.
export const reverseGeocodingServiceUrl =
  "https://nominatim.openstreetmap.org/reverse";