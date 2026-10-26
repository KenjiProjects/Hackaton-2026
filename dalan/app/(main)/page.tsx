import { Suspense } from "react";
import MapLoader from "../../Components/Maploader";

export default function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <Suspense fallback={<div className="fixed inset-0 h-dvh w-full" />}>
      <MapContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MapContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;

  return (
    <div className="fixed inset-0 h-dvh w-full">
      <MapLoader mode={mode === "routes" ? "routes" : "terminal"} />
    </div>
  );
}