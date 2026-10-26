import { NextResponse } from "next/server";
import { reverseGeocodingServiceUrl } from "@/lib/data";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 13.53 ||
    latitude > 13.7 ||
    longitude < 123.1 ||
    longitude > 123.28
  ) {
    return NextResponse.json(
      { error: "Select a point inside the Naga City map area." },
      { status: 400 },
    );
  }

  const reverseUrl = new URL(reverseGeocodingServiceUrl);
  reverseUrl.searchParams.set("lat", String(latitude));
  reverseUrl.searchParams.set("lon", String(longitude));
  reverseUrl.searchParams.set("format", "jsonv2");
  reverseUrl.searchParams.set("addressdetails", "1");
  reverseUrl.searchParams.set("zoom", "18");

  try {
    const response = await fetch(reverseUrl, {
      headers: {
        "User-Agent": "DalanTransitGuide/0.1 (OpenStreetMap map selection)",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Location provider returned HTTP ${response.status}.` },
        { status: 502 },
      );
    }

    const place = (await response.json()) as {
      lat?: string;
      lon?: string;
      name?: string;
      display_name?: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
      };
    };
    const road = place.address?.road;
    const locality =
      place.address?.neighbourhood ??
      place.address?.suburb ??
      place.address?.city ??
      place.address?.town ??
      place.address?.village;
    const label = [
      road ?? place.name ?? place.display_name?.split(",")[0],
      locality,
      "Naga City",
    ]
      .filter((part, index, parts): part is string =>
        Boolean(part && parts.indexOf(part) === index),
      )
      .join(", ");

    return NextResponse.json(
      {
        label:
          label ||
          `Map point ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude: Number(place.lat) || latitude,
        longitude: Number(place.lon) || longitude,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Reverse geocoding request failed:", error);
    return NextResponse.json(
      { error: "Location search is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
