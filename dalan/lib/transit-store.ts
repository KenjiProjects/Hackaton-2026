"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultTransitData, type TransitData } from "@/lib/data";

const STORAGE_KEY = "dalan-transit-data";
const CHANGE_EVENT = "dalan-transit-data-changed";

function readTransitData(): TransitData {
  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) return defaultTransitData;

  const data: unknown = JSON.parse(serialized);
  if (
    !data ||
    typeof data !== "object" ||
    !("stops" in data) ||
    !Array.isArray(data.stops) ||
    !("routes" in data) ||
    !Array.isArray(data.routes) ||
    !("farePlans" in data) ||
    !Array.isArray(data.farePlans) ||
    data.farePlans.length === 0 ||
    !("activeFarePlanId" in data) ||
    typeof data.activeFarePlanId !== "string"
  ) {
    throw new Error("Saved transit data is invalid. Please review it in Admin.");
  }

  const savedData = data as TransitData;
  return {
    ...savedData,
    routes: savedData.routes.map((route) => ({
      ...route,
      details: typeof route.details === "string" ? route.details : "",
    })),
    stops: savedData.stops.map((stop) => {
      const stopWithDetails = {
        ...stop,
        details: typeof stop.details === "string" ? stop.details : "",
      };
      const type: unknown = stop.type;
      switch (type) {
        case "jeepney":
          return stopWithDetails;
        case "tricycle":
          return stopWithDetails;
        case "padyak":
          return stopWithDetails;
        case "terminal":
        case "jeep terminal":
        case "jeepney terminal":
        case "waiting":
        case "loading":
          return { ...stopWithDetails, type: "jeepney" };
        case "tricycle terminal":
          return { ...stopWithDetails, type: "tricycle" };
        case "padyak terminal":
        case "padkyak terminal":
          return { ...stopWithDetails, type: "padyak" };
        default:
          throw new Error(
            `Saved terminal "${stop.name}" has an unsupported marker type. Edit or remove it in Admin.`,
          );
      }
    }),
    farePlans: savedData.farePlans.map((plan) => ({
      ...plan,
      estimateRangeMultiplier:
        typeof plan.estimateRangeMultiplier === "number" &&
        Number.isFinite(plan.estimateRangeMultiplier) &&
        plan.estimateRangeMultiplier >= 1
          ? plan.estimateRangeMultiplier
          : defaultTransitData.farePlans[0].estimateRangeMultiplier,
    })),
  };
}

export function useTransitData() {
  const [transitData, setTransitData] = useState(defaultTransitData);
  const [storageError, setStorageError] = useState("");

  const refresh = useCallback(() => {
    try {
      setTransitData(readTransitData());
      setStorageError("");
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "Could not load saved transit data.",
      );
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const saveTransitData = useCallback((nextData: TransitData) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    setTransitData(nextData);
    setStorageError("");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { transitData, saveTransitData, storageError };
}
