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
  
];

export const routes: TransitRoute[] = [
  {
    id: "r1",
    name: "Sample Route 1",
    details: "",
    color: "#2563eb",
    path: [[13.62323, 123.18508], [13.62196, 123.1938], [13.61952, 123.19371],[13.62113, 123.21407]],
  },
  {
    id: "r2",
    name: "Sample Route 2",
    details: "",
    color: "#dc2626",
    path: [[13.6218, 123.1948], [13.6180, 123.1980], [13.6150, 123.2000]],
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