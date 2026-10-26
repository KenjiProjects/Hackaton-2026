"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type {
  PickTarget,
  RoutePlace,
} from "@/Components/RoutePreview";
import {
  fareCurrency,
  fareDisclaimer,
  fareRules,
  routingServiceUrl,
} from "@/lib/data";

const RoutePreview = dynamic(() => import("@/Components/RoutePreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[55vh] min-h-80 items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-800">
      Loading map...
    </div>
  ),
});

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: fareCurrency,
});

type ReverseGeocodeResponse = {
  label: string;
  latitude: number;
  longitude: number;
  error?: string;
};

type RouteResponse = {
  code: string;
  routes?: {
    distance: number;
    geometry: { coordinates: [number, number][] };
  }[];
};

export default function FareCalculatorPage() {
  const [origin, setOrigin] = useState<RoutePlace | null>(null);
  const [destination, setDestination] = useState<RoutePlace | null>(null);
  const [pickTarget, setPickTarget] = useState<PickTarget | null>("origin");
  const [pendingPoint, setPendingPoint] = useState<[number, number] | null>(
    null,
  );
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [passengerCount, setPassengerCount] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    distanceKm: number;
    farePerPassenger: number;
    totalFare: number;
    routeCoordinates: [number, number][];
  } | null>(null);
  const isResolvingRef = useRef(false);
  const lastReverseLookupAtRef = useRef(0);

  async function handleMapPick(latitude: number, longitude: number) {
    if (!pickTarget || isResolvingRef.current) return;

    const selectedTarget = pickTarget;
    isResolvingRef.current = true;
    setIsResolvingPlace(true);
    setPendingPoint([latitude, longitude]);
    setError("");
    setResult(null);

    try {
      const waitMs = Math.max(
        0,
        1000 - (Date.now() - lastReverseLookupAtRef.current),
      );
      if (waitMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, waitMs));
      }

      lastReverseLookupAtRef.current = Date.now();
      const response = await fetch(
        `/api/location-search?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      );
      const place = (await response.json()) as ReverseGeocodeResponse;

      if (!response.ok) {
        throw new Error(
          place.error ?? `Could not resolve this map point (HTTP ${response.status}).`,
        );
      }

      const selectedPlace: RoutePlace = {
        label: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
      };
      setMapInstanceKey((key) => key + 1);

      if (selectedTarget === "origin") {
        setOrigin(selectedPlace);
        if (!destination) setPickTarget("destination");
      } else {
        setDestination(selectedPlace);
      }
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Could not resolve the selected street. Please try another map point.",
      );
    } finally {
      isResolvingRef.current = false;
      setIsResolvingPlace(false);
      setPendingPoint(null);
    }
  }

  async function calculateFare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!origin || !destination) {
      setError("Tap the map to choose both the starting point and destination.");
      return;
    }

    if (
      origin.latitude === destination.latitude &&
      origin.longitude === destination.longitude
    ) {
      setError("Choose two different points on the map.");
      return;
    }

    setIsCalculating(true);

    try {
      const routeUrl = new URL(
        `/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
        routingServiceUrl,
      );
      routeUrl.searchParams.set("overview", "full");
      routeUrl.searchParams.set("geometries", "geojson");
      routeUrl.searchParams.set("steps", "false");

      const response = await fetch(routeUrl);
      if (!response.ok) {
        throw new Error(`Routing service returned HTTP ${response.status}.`);
      }

      const routeData = (await response.json()) as RouteResponse;
      const route = routeData.routes?.[0];
      if (
        routeData.code !== "Ok" ||
        typeof route?.distance !== "number" ||
        !Number.isFinite(route.distance) ||
        !route.geometry?.coordinates?.length
      ) {
        throw new Error(
          "No road route was found between these points. Try selecting different points on nearby streets.",
        );
      }

      const distanceKm = route.distance / 1000;
      const additionalKilometers = Math.ceil(
        Math.max(0, distanceKm - fareRules.includedDistanceKm),
      );
      const farePerPassenger =
        fareRules.baseFare +
        additionalKilometers * fareRules.additionalFarePerStartedKm;

      setResult({
        distanceKm,
        farePerPassenger,
        totalFare: farePerPassenger * passengerCount,
        routeCoordinates: route.geometry.coordinates,
      });
    } catch (calculationError) {
      setError(
        calculationError instanceof Error
          ? calculationError.message
          : "Could not calculate the fare. Please try again.",
      );
    } finally {
      setIsCalculating(false);
    }
  }

  function chooseTarget(target: PickTarget) {
    setPickTarget(target);
    setError("");
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 font-sans dark:bg-black sm:px-6 sm:py-10">
      <section className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
            Dalan
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Fare calculator
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Pick your starting point and destination directly on the street map.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={pickTarget === "origin"}
            disabled={isResolvingPlace}
            onClick={() => chooseTarget("origin")}
            className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${
              pickTarget === "origin"
                ? "border-teal-700 bg-teal-50 ring-2 ring-teal-700/20 dark:border-teal-300 dark:bg-teal-950/50"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
              Starting point
            </span>
            <span className="mt-1 block truncate text-sm text-zinc-800 dark:text-zinc-100">
              {origin?.label ?? "Tap a street on the map"}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={pickTarget === "destination"}
            disabled={isResolvingPlace}
            onClick={() => chooseTarget("destination")}
            className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${
              pickTarget === "destination"
                ? "border-red-600 bg-red-50 ring-2 ring-red-600/20 dark:border-red-300 dark:bg-red-950/40"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950"
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
              Destination
            </span>
            <span className="mt-1 block truncate text-sm text-zinc-800 dark:text-zinc-100">
              {destination?.label ?? "Tap a street on the map"}
            </span>
          </button>
        </div>

        <p
          aria-live="polite"
          className="mb-3 text-sm text-zinc-600 dark:text-zinc-400"
        >
          {isResolvingPlace
            ? "Finding the street at that point..."
            : pickTarget
              ? `Tap the map to set your ${pickTarget === "origin" ? "starting point" : "destination"}.`
              : "Select a point above if you want to change either location."}
        </p>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <RoutePreview
            key={mapInstanceKey}
            origin={origin}
            destination={destination}
            routeCoordinates={result?.routeCoordinates ?? null}
            pickTarget={isResolvingPlace ? null : pickTarget}
            pendingPoint={pendingPoint}
            onMapPick={handleMapPick}
          />
        </div>

        <form className="mt-5 space-y-5" onSubmit={calculateFare}>
          <label className="block max-w-xs">
            <span className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Passengers
            </span>
            <input
              className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-teal-300 dark:focus:ring-teal-300/20"
              type="number"
              min={1}
              step={1}
              value={passengerCount}
              onChange={(event) => {
                setPassengerCount(
                  Math.max(1, Math.floor(Number(event.target.value) || 1)),
                );
                setResult(null);
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isCalculating || isResolvingPlace}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {isCalculating ? "Calculating route..." : "Calculate fare"}
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </p>
        )}

        {result && (
          <div
            aria-live="polite"
            className="mt-6 rounded-2xl bg-teal-50 p-5 dark:bg-teal-950/40"
          >
            <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
              Estimated total
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-teal-900 dark:text-teal-100">
              {currencyFormatter.format(result.totalFare)}
            </p>
            <p className="mt-2 text-sm leading-6 text-teal-800 dark:text-teal-200">
              {result.distanceKm.toFixed(2)} km by road ·{" "}
              {currencyFormatter.format(result.farePerPassenger)} per
              passenger · {passengerCount} passenger
              {passengerCount === 1 ? "" : "s"}
            </p>
            <p className="mt-3 border-t border-teal-200 pt-3 text-xs leading-5 text-teal-900 dark:border-teal-800 dark:text-teal-100">
              {fareDisclaimer}
            </p>
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          {fareDisclaimer}
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          OpenStreetMap street data via Nominatim and road distance via OSRM.
          Fares: {currencyFormatter.format(fareRules.baseFare)} for the first{" "}
          {fareRules.includedDistanceKm} km, then{" "}
          {currencyFormatter.format(fareRules.additionalFarePerStartedKm)} for
          each additional started kilometer. Edit the fare rule in{" "}
          <code>lib/data.ts</code>.
        </p>
      </section>
    </main>
  );
}
