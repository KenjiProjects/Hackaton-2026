"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const MapView = dynamic(() => import("@/Components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

export default function MapLoader({ mode }: { mode: "terminal" | "routes" }) {
  const tab = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium ${
      active ? "bg-blue-600 text-white" : "bg-white text-gray-700"
    }`;

  
  return (
    <div className="relative h-full w-full">
      <MapView mode={mode} />
      <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow">
        <Link href="/?mode=terminal" className={tab(mode === "terminal")}>Terminals</Link>
        <Link href="/?mode=routes" className={tab(mode === "routes")}>Jeep Routes</Link>
      </div>

      {mode == "terminal" && (
          <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2 rounded-lg bg-white p-3 shadow-md">
            <span className="text-sm font-bold text-gray-800">LEGEND</span>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              Jeepney Terminal
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              Tricycle Terminal
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              Padyak Terminal
            </div>
          </div>
        )}


        {mode == "routes" && (
          <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2 rounded-lg bg-white p-3 shadow-md">
            <span className="text-sm font-bold text-gray-800">LEGEND</span>

           
          </div>
        )}
    </div>
  );
}