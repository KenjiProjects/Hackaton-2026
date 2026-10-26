"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  stopTypeColors,
  stopTypeLabels,
  type TransitRoute,
  type TransitStop,
} from "@/lib/data";

const NAGA_CENTER: L.LatLngTuple = [13.62303, 123.18690];
const NAGA_BOUNDS: L.LatLngBoundsExpression = [
  [13.65774, 123.16330],
  [13.59936, 123.23412],
];
export type SelectedMapPlace = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapViewProps = {
  mode: "terminal" | "routes";
  routes: TransitRoute[];
  stops: TransitStop[];
  selectedStopId: string | null;
  selectedRouteId: string | null;
  locateRequest: number;
  onRouteSelect: (routeId: string) => void;
  onStopSelect: (stopId: string) => void;
  onPlaceSelect: (place: SelectedMapPlace | null) => void;
  onStatusChange: (status: string) => void;
};

type ReverseGeocodeResponse = SelectedMapPlace & { error?: string };

function addPopupText(marker: L.Layer, title: string, detail: string) {
  const popup = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const description = document.createElement("div");
  description.textContent = detail;
  popup.append(heading, description);
  marker.bindPopup(popup);
}

function terminalIcon(stop: TransitStop, isSelected: boolean): L.DivIcon {
  const vehicleSvg: Record<TransitStop["type"], string> = {
    jeepney:
      '<rect x="3" y="5" width="26" height="14" rx="3"/><path d="M6 9h4v4H6zm7 0h4v4h-4zm7 0h4v4h-4zM3 16h26"/><circle cx="9" cy="20" r="2"/><circle cx="23" cy="20" r="2"/>',
    tricycle:
      '<circle cx="8" cy="19" r="3"/><circle cx="22" cy="19" r="3"/><path d="m8 19 4-8 5 8H8l3-5h8l3 5m-11-8h5l2 3m-2-3 2-3h4v8h5v5"/>',
    padyak:
      '<circle cx="7" cy="18" r="5"/><circle cx="25" cy="18" r="5"/><path d="m7 18 6-9 6 9H7l5-7h9l4 7m-12-9h5m4 0 3 2"/>',
  };
  const size = isSelected ? 42 : 36;
  const color = stopTypeColors[stop.type];

  return L.divIcon({
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 5],
    tooltipAnchor: [0, -size],
    html: `<span style="display:flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;border:3px solid white;border-radius:50%;background:${color};box-shadow:0 2px 8px #0006,0 0 0 ${isSelected ? 4 : 0}px ${color}66;transform:${isSelected ? "scale(1.08)" : "scale(1)"};transition:transform .15s,box-shadow .15s"><svg aria-hidden="true" width="${isSelected ? 25 : 21}" height="${isSelected ? 25 : 21}" viewBox="0 0 32 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${vehicleSvg[stop.type]}</svg></span><span style="display:block;width:0;height:0;margin:-1px auto 0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></span>`,
  });
}

export default function MapView({
  mode,
  routes,
  stops,
  selectedStopId,
  selectedRouteId,
  locateRequest,
  onRouteSelect,
  onStopSelect,
  onPlaceSelect,
  onStatusChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const featureLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onStatusChangeRef = useRef(onStatusChange);
  const onRouteSelectRef = useRef(onRouteSelect);
  const onStopSelectRef = useRef(onStopSelect);
  const lastLookupAtRef = useRef(0);
  const requestInProgressRef = useRef(false);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onStatusChangeRef.current = onStatusChange;
    onRouteSelectRef.current = onRouteSelect;
    onStopSelectRef.current = onStopSelect;
  }, [onPlaceSelect, onStatusChange, onRouteSelect, onStopSelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: NAGA_CENTER,
      zoom: 18,
      minZoom: 15,
      maxZoom: 18,
      maxBounds: NAGA_BOUNDS,
      maxBoundsViscosity: 1,
    });
    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ).addTo(map);

    featureLayerRef.current = L.layerGroup().addTo(map);
    selectionLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    async function selectMapPoint(latitude: number, longitude: number) {
      if (requestInProgressRef.current) return;
      requestInProgressRef.current = true;
      onStatusChangeRef.current("Finding the street at that location...");

      try {
        const waitMs = Math.max(
          0,
          1000 - (Date.now() - lastLookupAtRef.current),
        );
        if (waitMs) {
          await new Promise((resolve) => window.setTimeout(resolve, waitMs));
        }
        lastLookupAtRef.current = Date.now();

        const response = await fetch(
          `/api/location-search?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
        );
        const place = (await response.json()) as ReverseGeocodeResponse;
        if (!response.ok) {
          throw new Error(
            place.error ?? `Location lookup failed (HTTP ${response.status}).`,
          );
        }

        const selectedPlace = {
          label: place.label,
          latitude: place.latitude,
          longitude: place.longitude,
        };
        onPlaceSelectRef.current(selectedPlace);

        const selectionLayer = selectionLayerRef.current;
        if (selectionLayer) {
          selectionLayer.clearLayers();
          const marker = L.circleMarker(
            [selectedPlace.latitude, selectedPlace.longitude],
            {
              radius: 9,
              color: "#ffffff",
              weight: 3,
              fillColor: "#FAAC2F",
              fillOpacity: 1,
            },
          ).addTo(selectionLayer);
          addPopupText(
            marker,
            selectedPlace.label,
            `${selectedPlace.latitude.toFixed(5)}, ${selectedPlace.longitude.toFixed(5)}`,
          );
          marker.openPopup();
          selectedMarkerRef.current = marker;
        }

        onStatusChangeRef.current(`Selected: ${selectedPlace.label}`);
      } catch (error) {
        onPlaceSelectRef.current(null);
        onStatusChangeRef.current(
          error instanceof Error
            ? error.message
            : "Could not identify this location. Try another point.",
        );
      } finally {
        requestInProgressRef.current = false;
      }
    }

    map.on("click", (event: L.LeafletMouseEvent) => {
      void selectMapPoint(event.latlng.lat, event.latlng.lng);
    });
    const resizeMap = () => {
      map.invalidateSize({ pan: false });
      tileLayer.bringToBack();
    };
    window.addEventListener("resize", resizeMap);
    const initialResize = window.requestAnimationFrame(resizeMap);

    return () => {
      window.cancelAnimationFrame(initialResize);
      window.removeEventListener("resize", resizeMap);
      map.remove();
      mapRef.current = null;
      featureLayerRef.current = null;
      selectionLayerRef.current = null;
      selectedMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = featureLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (mode === "terminal") {
      const orderedStops = [...stops].sort((a, b) => {
        if (a.id === selectedStopId) return 1;
        if (b.id === selectedStopId) return -1;
        return 0;
      });
      orderedStops.forEach((stop) => {
        const isSelected = stop.id === selectedStopId;
        const marker = L.marker([stop.lat, stop.lng], {
          icon: terminalIcon(stop, isSelected),
          opacity: selectedStopId && !isSelected ? 0.45 : 1,
          zIndexOffset: isSelected ? 1000 : 0,
          keyboard: true,
          title: `${stop.name} — ${stopTypeLabels[stop.type]}`,
        }).addTo(layer);
        addPopupText(
          marker,
          stop.name,
          stop.details || stopTypeLabels[stop.type],
        );
        marker.on("click", (event: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(event);
          onStopSelectRef.current(stop.id);
        });
      });
    } else {
      const orderedRoutes = [...routes].sort((a, b) => {
        if (a.id === selectedRouteId) return 1;
        if (b.id === selectedRouteId) return -1;
        return 0;
      });
      orderedRoutes.forEach((route) => {
        const isSelected = route.id === selectedRouteId;
        const line = L.polyline(route.path, {
          color: route.color,
          weight: isSelected ? 9 : selectedRouteId ? 4 : 6,
          opacity: isSelected ? 1 : selectedRouteId ? 0.2 : 0.9,
        }).addTo(layer);
        addPopupText(
          line,
          route.name,
          route.details || "Select this route to view its details.",
        );
        line.on("click", (event: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(event);
          onRouteSelectRef.current(route.id);
        });
      });
    }
  }, [mode, routes, stops, selectedRouteId, selectedStopId]);

  useEffect(() => {
    if (locateRequest === 0) return;
    const map = mapRef.current;
    if (!map) return;

    let isActive = true;
    onStatusChangeRef.current("Finding your location...");

    if (!navigator.geolocation) {
      onStatusChangeRef.current("Location access is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          !isActive ||
          mapRef.current !== map ||
          !containerRef.current?.isConnected
        ) {
          return;
        }

        map.setView([coords.latitude, coords.longitude], 17);
        onStatusChangeRef.current("Showing your current location.");
      },
      (error) => {
        if (!isActive || mapRef.current !== map) return;
        onStatusChangeRef.current(`Could not get your location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );

    return () => {
      isActive = false;
    };
  }, [locateRequest]);

  return <div ref={containerRef} className="h-full min-h-[24rem] w-full" />;
}
