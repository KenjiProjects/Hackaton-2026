
"use client";

import { useState } from "react";
import { fareCurrency, fareRules, routingServiceUrl, stops } from "@/lib/data";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: fareCurrency,
});

const CUSTOM_LOCATION_ID = "custom";

type CustomLocation = {
  name: string;
  latitude: string;
  longitude: string;
};

type ResolvedLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type RouteResponse = {
  code: string;
  routes?: { distance: number }[];
};

const emptyLocation: CustomLocation = {
  name: "",
  latitude: "",
  longitude: "",
};

export default function FareCalculatorPage() {
  const [originId, setOriginId] = useState(stops[0]?.id ?? CUSTOM_LOCATION_ID);
  const [destinationId, setDestinationId] = useState(
    stops[1]?.id ?? CUSTOM_LOCATION_ID,
  );
  const [customOrigin, setCustomOrigin] = useState(emptyLocation);
  const [customDestination, setCustomDestination] = useState(emptyLocation);
  const [passengerCount, setPassengerCount] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    distanceKm: number;
    farePerPassenger: number;
    totalFare: number;
  } | null>(null);

  function resolveLocation(
    id: string,
    customLocation: CustomLocation,
  ): ResolvedLocation | null {
    if (id !== CUSTOM_LOCATION_ID) {
      const stop = stops.find((item) => item.id === id);
      return stop
        ? { name: stop.name, latitude: stop.lat, longitude: stop.lng }
        : null;
    }

    const latitude = Number(customLocation.latitude);
    const longitude = Number(customLocation.longitude);
    if (
      !customLocation.name.trim() ||
      customLocation.latitude.trim() === "" ||
      customLocation.longitude.trim() === "" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return {
      name: customLocation.name.trim(),
      latitude,
      longitude,
    };
  }

  async function calculateFare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const origin = resolveLocation(originId, customOrigin);
    const destination = resolveLocation(destinationId, customDestination);

    if (!origin || !destination) {
      setError("Choose valid locations and enter valid coordinates.");
      return;
    }

    if (
      origin.latitude === destination.latitude &&
      origin.longitude === destination.longitude
    ) {
      setError("Choose different starting and final destinations.");
      return;
    }

    setIsCalculating(true);

    try {
      const routeUrl = new URL(
        `/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
        routingServiceUrl,
      );
      routeUrl.searchParams.set("overview", "false");
      routeUrl.searchParams.set("steps", "false");

      const response = await fetch(routeUrl);
      if (!response.ok) {
        throw new Error(`Routing service returned HTTP ${response.status}.`);
      }

      const routeData = (await response.json()) as RouteResponse;
      const distanceMeters = routeData.routes?.[0]?.distance;
      if (
        routeData.code !== "Ok" ||
        typeof distanceMeters !== "number" ||
        !Number.isFinite(distanceMeters)
      ) {
        throw new Error(
          "No driving route was found between those locations. Check the coordinates and try again.",
        );
      }

      const distanceKm = distanceMeters / 1000;
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

  function renderLocationFields(
    label: string,
    selectedId: string,
    onSelect: (id: string) => void,
    customLocation: CustomLocation,
    onCustomLocationChange: (location: CustomLocation) => void,
  ) {
    return (
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {label}
        </legend>
        <select
          aria-label={`${label} location`}
          className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-teal-300 dark:focus:ring-teal-300/20"
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {stops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.name}
            </option>
          ))}
          <option value={CUSTOM_LOCATION_ID}>Enter coordinates</option>
        </select>

        {selectedId === CUSTOM_LOCATION_ID && (
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Location name
              </span>
              <input
                required
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                value={customLocation.name}
                onChange={(event) =>
                  onCustomLocationChange({
                    ...customLocation,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. Naga City Hall"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Latitude
              </span>
              <input
                required
                type="number"
                min={-90}
                max={90}
                step="any"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                value={customLocation.latitude}
                onChange={(event) =>
                  onCustomLocationChange({
                    ...customLocation,
                    latitude: event.target.value,
                  })
                }
                placeholder="13.62"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Longitude
              </span>
              <input
                required
                type="number"
                min={-180}
                max={180}
                step="any"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                value={customLocation.longitude}
                onChange={(event) =>
                  onCustomLocationChange({
                    ...customLocation,
                    longitude: event.target.value,
                  })
                }
                placeholder="123.18"
              />
            </label>
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-5 py-10 font-sans dark:bg-black sm:py-16">
      <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
            Dalan
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Fare calculator
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Estimate a fare from the road distance between two locations.
          </p>
        </div>

        <form className="space-y-6" onSubmit={calculateFare}>
          {renderLocationFields(
            "Starting destination",
            originId,
            setOriginId,
            customOrigin,
            setCustomOrigin,
          )}
          {renderLocationFields(
            "Final destination",
            destinationId,
            setDestinationId,
            customDestination,
            setCustomDestination,
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Passengers
            </span>
            <input
              className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-teal-300 dark:focus:ring-teal-300/20"
              type="number"
              min={1}
              step={1}
              value={passengerCount}
              onChange={(event) =>
                setPassengerCount(
                  Math.max(1, Math.floor(Number(event.target.value) || 1)),
                )
              }
            />
          </label>

          <button
            type="submit"
            disabled={isCalculating}
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
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Road distance is provided by the configured routing service. Edit the
          fare rule and service URL in <code>lib/data.ts</code>.
        </p>
      </section>
    </main>
  );
}
