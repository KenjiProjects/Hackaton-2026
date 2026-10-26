"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

export type RoutePlace = {
  label: string;
  latitude: number;
  longitude: number;
};

export type PickTarget = "origin" | "destination";

type RoutePreviewProps = {
  origin: RoutePlace | null;
  destination: RoutePlace | null;
  routeCoordinates: [number, number][] | null;
  pickTarget: PickTarget | null;
  pendingPoint: [number, number] | null;
  onMapPick: (latitude: number, longitude: number) => void;
};

function addPlaceMarker(
  layer: L.LayerGroup,
  place: RoutePlace,
  color: string,
  title: string,
) {
  L.circleMarker([place.latitude, place.longitude], {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: color,
    fillOpacity: 1,
  })
    .bindTooltip(`${title}: ${place.label}`)
    .addTo(layer);
}

export default function RoutePreview({
  origin,
  destination,
  routeCoordinates,
  pickTarget,
  pendingPoint,
  onMapPick,
}: RoutePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const onMapPickRef = useRef(onMapPick);
  const previousSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    onMapPickRef.current = onMapPick;
  }, [onMapPick]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [13.6192, 123.1814],
      zoom: 14,
      scrollWheelZoom: false,
      maxBounds: [
        [13.53, 123.1],
        [13.7, 123.28],
      ],
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

    const layers = L.layerGroup().addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => {
      onMapPickRef.current(event.latlng.lat, event.latlng.lng);
    });
    const resizeMap = () => map.invalidateSize({ pan: false });
    window.addEventListener("resize", resizeMap);
    const initialResize = window.requestAnimationFrame(resizeMap);
    mapRef.current = map;
    layerRef.current = layers;
    tileLayerRef.current = tileLayer;

    return () => {
      window.cancelAnimationFrame(initialResize);
      window.removeEventListener("resize", resizeMap);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const tileLayer = tileLayerRef.current;
    if (!map || !layer || !tileLayer) return;

    if (!map.hasLayer(tileLayer)) {
      tileLayer.addTo(map);
    }

    layer.clearLayers();
    const points: L.LatLngExpression[] = [];

    if (origin) {
      addPlaceMarker(layer, origin, "#FAAC2F", "Start");
      points.push([origin.latitude, origin.longitude]);
    }
    if (destination) {
      addPlaceMarker(layer, destination, "#dc2626", "Destination");
      points.push([destination.latitude, destination.longitude]);
    }
    if (pendingPoint) {
      L.circleMarker(pendingPoint, {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#FAAC2F",
        fillOpacity: 1,
      })
        .bindTooltip("Resolving selected street...")
        .addTo(layer);
    }

    if (routeCoordinates?.length) {
      const routePoints = routeCoordinates.map(
        ([longitude, latitude]): L.LatLngTuple => [latitude, longitude],
      );
      L.polyline(routePoints, {
        color: "#FA8C2F",
        weight: 5,
        opacity: 0.85,
      }).addTo(layer);
      points.push(...routePoints);
    }

    if (routeCoordinates?.length && points.length > 1) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [36, 36],
        maxZoom: 16,
      });
    }

    const refreshFrame = window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      tileLayer.bringToBack();
    });

    return () => window.cancelAnimationFrame(refreshFrame);
  }, [origin, destination, routeCoordinates, pendingPoint, pickTarget]);

  useEffect(() => {
    const selectionKey = JSON.stringify([
      origin?.latitude,
      origin?.longitude,
      destination?.latitude,
      destination?.longitude,
    ]);

    if (previousSelectionRef.current === null) {
      previousSelectionRef.current = selectionKey;
      return;
    }
    if (previousSelectionRef.current === selectionKey) return;

    previousSelectionRef.current = selectionKey;
    const map = mapRef.current;
    const tileLayer = tileLayerRef.current;
    if (!map || !tileLayer) return;

    const refreshFrame = window.requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      tileLayer.redraw();
    });

    return () => window.cancelAnimationFrame(refreshFrame);
  }, [origin, destination]);

  return (
    <div
      ref={containerRef}
      aria-label={
        pickTarget
          ? `Interactive map. Tap a street to choose the ${pickTarget === "origin" ? "starting point" : "destination"}.`
          : "Map showing the selected locations and route"
      }
      className={`h-[min(34dvh,320px)] min-h-56 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:h-[min(50dvh,480px)] sm:min-h-80 ${
        pickTarget ? "cursor-crosshair" : ""
      }`}
    />
  );
}
