"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { stops, routes } from "@/lib/data";

const NAGA_CENTER: L.LatLngTuple = [13.6192, 123.1814];
const NAGA_BOUNDS: L.LatLngBoundsExpression = [
  [13.53, 123.10],
  [13.70, 123.28],
];
const STOP_COLOR = { terminal: "#dc2626", waiting: "#2563eb", loading: "#16a34a" };

export default function MapView({ mode }: { mode: "terminal" | "routes" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Create the map once, and destroy it on unmount (this prevents "container reused")
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: NAGA_CENTER,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: NAGA_BOUNDS,
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Click anywhere to drop a pin (useful for collecting coordinates)
    let pin: L.CircleMarker | null = null;
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (!pin) {
        pin = L.circleMarker([lat, lng], {
          radius: 8,
          color: "#111827",
          fillColor: "#facc15",
          fillOpacity: 1,
        }).addTo(map);
      } else {
        pin.setLatLng([lat, lng]);
      }
      pin.bindPopup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
    });

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw layers whenever the mode changes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (mode === "terminal") {
      stops.forEach((s) => {
        L.circleMarker([s.lat, s.lng], {
          radius: 10,
          color: "#ffffff",
          weight: 2,
          fillColor: STOP_COLOR[s.type],
          fillOpacity: 0.95,
        })
          .bindPopup(`<b>${s.name}</b><br/>${s.type}`)
          .addTo(layer);
      });
    } else {
      routes.forEach((r) => {
        L.polyline(r.path, { color: r.color, weight: 5, opacity: 0.85 })
          .bindPopup(`<b>${r.name}</b>`)
          .addTo(layer);
      });
    }
  }, [mode]);

  return <div ref={containerRef} className="h-full w-full" />;
}