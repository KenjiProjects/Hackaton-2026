import { Suspense } from "react";
import MapLoader from "../../Components/Maploader";

export default function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-[calc(100dvh-4rem)] w-full" />}>
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
    <div className="h-[calc(100dvh-4rem)] w-full">
      <MapLoader mode={mode === "routes" ? "routes" : "terminal"} />
    </div>
  );
}