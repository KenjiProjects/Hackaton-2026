"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { SelectedMapPlace } from "@/Components/MapView";
import { stopTypeColors, stopTypeLabels } from "@/lib/data";
import { useTransitData } from "@/lib/transit-store";

const MapView = dynamic(() => import("@/Components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

export default function MapLoader({ mode }: { mode: "terminal" | "routes" }) {
  const { transitData } = useTransitData();
  const [selectedPlace, setSelectedPlace] = useState<SelectedMapPlace | null>(
    null,
  );
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [status, setStatus] = useState("Tap any street or place to see its name.");
  const [locateRequest, setLocateRequest] = useState(0);
  const selectedRoute = transitData.routes.find(
    (route) => route.id === selectedRouteId,
  );
  const selectedStop = transitData.stops.find(
    (stop) => stop.id === selectedStopId,
  );

  function toggleRoute(routeId: string) {
    setSelectedRouteId((current) => (current === routeId ? null : routeId));
  }

  function toggleStop(stopId: string) {
    setSelectedStopId((current) => (current === stopId ? null : stopId));
  }

  const tab = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "brand-gradient text-white"
        : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
    }`;

  return (
    <div className="relative h-full w-full">
      <MapView
        mode={mode}
        routes={transitData.routes}
        stops={transitData.stops}
        selectedStopId={selectedStop?.id ?? null}
        selectedRouteId={selectedRoute?.id ?? null}
        locateRequest={locateRequest}
        onRouteSelect={toggleRoute}
        onStopSelect={toggleStop}
        onPlaceSelect={setSelectedPlace}
        onStatusChange={setStatus}
      />

      <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow-lg dark:bg-zinc-900">
        <Link href="/?mode=terminal" className={tab(mode === "terminal")}>
          Terminals
        </Link>
        <Link href="/?mode=routes" className={tab(mode === "routes")}>
          Jeep Routes
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setLocateRequest((request) => request + 1)}
        className="absolute right-3 top-3 z-[1000] rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-lg transition hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        My location
      </button>

      <aside
        aria-live="polite"
        className={`absolute bottom-[calc(5rem+env(safe-area-inset-bottom)+1rem)] left-3 right-3 z-[1000] mx-auto max-h-[45dvh] overflow-y-auto rounded-2xl bg-white/95 p-4 text-zinc-900 shadow-lg backdrop-blur dark:bg-zinc-950/95 dark:text-zinc-100 ${
          (mode === "routes" && selectedRoute) ||
          (mode === "terminal" && selectedStop)
            ? "max-w-2xl"
            : "max-w-md"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
              {selectedStop
                ? stopTypeLabels[selectedStop.type]
                : selectedRoute
                  ? "Selected route"
                  : mode === "terminal"
                    ? "Transport terminals"
                    : "Jeep routes"}
            </p>
            <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {selectedStop?.name ??
                selectedRoute?.name ??
                selectedPlace?.label ??
                status}
            </p>
          </div>
          <button
            type="button"
            aria-expanded={isInfoExpanded}
            onClick={() => setIsInfoExpanded((expanded) => !expanded)}
            className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {isInfoExpanded ? "Show less" : "Show more"}
          </button>
        </div>

        {isInfoExpanded && (
          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            {selectedStop ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {selectedStop.details || "Terminal details will be added later."}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedStop.lat.toFixed(5)}, {selectedStop.lng.toFixed(5)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {transitData.stops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      aria-pressed={stop.id === selectedStop.id}
                      onClick={() => toggleStop(stop.id)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        stop.id === selectedStop.id
                          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                          : "text-zinc-500 opacity-60 hover:bg-zinc-100 hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: stopTypeColors[stop.type] }}
                      />
                      {stop.name}
                    </button>
                  ))}
                </div>
              </>
            ) : selectedRoute ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {selectedRoute.details || "Route details will be added later."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {transitData.routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      aria-pressed={route.id === selectedRoute.id}
                      onClick={() => toggleRoute(route.id)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        route.id === selectedRoute.id
                          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                          : "text-zinc-500 opacity-60 hover:bg-zinc-100 hover:opacity-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1 w-5 rounded-full"
                        style={{ backgroundColor: route.color }}
                      />
                      {route.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {selectedPlace && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedPlace.latitude.toFixed(5)},{" "}
                      {selectedPlace.longitude.toFixed(5)}
                    </span>
                    <Link
                      href="/fare-calculator"
                      className="brand-gradient shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:brightness-105"
                    >
                      Calculate fare
                    </Link>
                  </div>
                )}
                {mode === "terminal" &&
                  transitData.stops.length > 0 &&
                  transitData.stops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => toggleStop(stop.id)}
                      className="mr-2 mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: stopTypeColors[stop.type] }}
                      />
                      {stop.name}
                    </button>
                  ))}
                {mode === "routes" &&
                  transitData.routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => toggleRoute(route.id)}
                      className="mr-2 mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1 w-5 rounded-full"
                        style={{ backgroundColor: route.color }}
                      />
                      {route.name}
                    </button>
                  ))}
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
