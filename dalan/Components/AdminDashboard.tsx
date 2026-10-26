"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  defaultTransitData,
  stopTypeLabels,
  type FarePlan,
  type StopType,
  type TransitData,
  type TransitRoute,
  type TransitStop,
} from "@/lib/data";
import { useTransitData } from "@/lib/transit-store";

type Section = "terminals" | "routes" | "fares" | "feedback";
type FeedbackEntry = {
  reportType: string;
  incident: string;
  location: string;
  vehicleDetails: string | null;
  description: string;
  incidentTime: string | null;
  submittedAt: string;
};
type StopForm = Omit<TransitStop, "id">;
type RouteForm = {
  name: string;
  details: string;
  color: string;
  coordinates: string;
};
type FareForm = Omit<FarePlan, "id">;

const fieldClass =
  "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20";
const buttonClass =
  "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const FEEDBACK_STORAGE_KEY = "dalan-feedback";

function readFeedbackEntries(): FeedbackEntry[] {
  const saved = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (!saved) return [];

  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved feedback data is invalid.");
  }

  return parsed.map((entry): FeedbackEntry => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("reportType" in entry) ||
      typeof entry.reportType !== "string" ||
      !("incident" in entry) ||
      typeof entry.incident !== "string" ||
      !("location" in entry) ||
      typeof entry.location !== "string" ||
      !("description" in entry) ||
      typeof entry.description !== "string" ||
      !("submittedAt" in entry) ||
      typeof entry.submittedAt !== "string"
    ) {
      throw new Error("A saved feedback report is incomplete or invalid.");
    }

    return {
      reportType: entry.reportType,
      incident: entry.incident,
      location: entry.location,
      vehicleDetails:
        "vehicleDetails" in entry && typeof entry.vehicleDetails === "string"
          ? entry.vehicleDetails
          : null,
      description: entry.description,
      incidentTime:
        "incidentTime" in entry && typeof entry.incidentTime === "string"
          ? entry.incidentTime
          : null,
      submittedAt: entry.submittedAt,
    };
  });
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function newId() {
  return crypto.randomUUID();
}

function parseRouteCoordinates(value: string): [number, number][] {
  const points = value.split(";").map((pair) => {
    const [latText, lngText] = pair.split(",").map((part) => part.trim());
    const lat = Number(latText);
    const lng = Number(lngText);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error("Enter valid latitude, longitude pairs for the route.");
    }
    return [lat, lng] as [number, number];
  });

  if (points.length < 2) {
    throw new Error("A route needs at least two coordinate points.");
  }
  return points;
}

function validFareForm(form: FareForm) {
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: form.currency });
  } catch {
    return false;
  }
  return (
    form.name.trim().length > 0 &&
    form.baseFare >= 0 &&
    form.includedDistanceKm >= 0 &&
    form.additionalFarePerStartedKm >= 0 &&
    Number.isFinite(form.estimateRangeMultiplier) &&
    form.estimateRangeMultiplier >= 1
  );
}

export default function AdminDashboard() {
  const { transitData, saveTransitData, storageError } = useTransitData();
  const [section, setSection] = useState<Section>("terminals");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [feedbackError, setFeedbackError] = useState("");
  const [stopForm, setStopForm] = useState<StopForm>({
    name: "",
    details: "",
    type: "jeepney",
    lat: 13.6192,
    lng: 123.1814,
  });
  const [routeForm, setRouteForm] = useState<RouteForm>({
    name: "",
    details: "",
    color: "#2563eb",
    coordinates: "",
  });
  const [fareForm, setFareForm] = useState<FareForm>({
    name: "",
    currency: "PHP",
    baseFare: 15,
    includedDistanceKm: 3,
    additionalFarePerStartedKm: 5,
    estimateRangeMultiplier: 5,
  });

  useEffect(() => {
    function loadFeedback() {
      try {
        setFeedbackEntries(readFeedbackEntries());
        setFeedbackError("");
      } catch (error) {
        setFeedbackError(
          error instanceof Error
            ? error.message
            : "Could not load saved feedback.",
        );
      }
    }

    const initialLoad = window.setTimeout(loadFeedback, 0);
    window.addEventListener("storage", loadFeedback);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("storage", loadFeedback);
    };
  }, []);

  function commit(nextData: TransitData, successMessage: string) {
    try {
      saveTransitData(nextData);
      setMessage(successMessage);
      setEditingId(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not save changes: ${error.message}`
          : "Could not save changes.",
      );
    }
  }

  function editStop(stop: TransitStop) {
    setEditingId(stop.id);
    setStopForm({
      name: stop.name,
      details: stop.details,
      type: stop.type,
      lat: stop.lat,
      lng: stop.lng,
    });
  }

  function saveStop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !stopForm.name.trim() ||
      !Number.isFinite(stopForm.lat) ||
      !Number.isFinite(stopForm.lng) ||
      stopForm.lat < -90 ||
      stopForm.lat > 90 ||
      stopForm.lng < -180 ||
      stopForm.lng > 180
    ) {
      setMessage("Enter a name and valid latitude and longitude.");
      return;
    }
    const stop = {
      ...stopForm,
      name: stopForm.name.trim(),
      details: stopForm.details.trim(),
    };
    const stops = editingId
      ? transitData.stops.map((item) =>
          item.id === editingId ? { ...item, ...stop } : item,
        )
      : [...transitData.stops, { id: newId(), ...stop }];
    commit({ ...transitData, stops }, editingId ? "Terminal updated." : "Terminal added.");
    setStopForm({
      name: "",
      details: "",
      type: "jeepney",
      lat: 13.6192,
      lng: 123.1814,
    });
  }

  function editRoute(route: TransitRoute) {
    setEditingId(route.id);
    setRouteForm({
      name: route.name,
      details: route.details,
      color: route.color,
      coordinates: route.path.map(([lat, lng]) => `${lat}, ${lng}`).join("; "),
    });
  }

  function saveRoute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const route = {
        name: routeForm.name.trim(),
        details: routeForm.details.trim(),
        color: routeForm.color,
        path: parseRouteCoordinates(routeForm.coordinates),
      };
      if (!route.name) throw new Error("Enter a route name.");
      const routes = editingId
        ? transitData.routes.map((item) =>
            item.id === editingId ? { ...item, ...route } : item,
          )
        : [...transitData.routes, { id: newId(), ...route }];
      commit({ ...transitData, routes }, editingId ? "Route updated." : "Route added.");
      setRouteForm({ name: "", details: "", color: "#2563eb", coordinates: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save route.");
    }
  }

  function editFare(plan: FarePlan) {
    setEditingId(plan.id);
    setFareForm({
      name: plan.name,
      currency: plan.currency,
      baseFare: plan.baseFare,
      includedDistanceKm: plan.includedDistanceKm,
      additionalFarePerStartedKm: plan.additionalFarePerStartedKm,
      estimateRangeMultiplier: plan.estimateRangeMultiplier,
    });
  }

  function saveFare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validFareForm(fareForm)) {
      setMessage(
        "Enter a name, valid currency code, non-negative fare values, and a range multiplier of at least 1.",
      );
      return;
    }
    const fare = { ...fareForm, name: fareForm.name.trim(), currency: fareForm.currency.toUpperCase() };
    const editing = editingId
      ? transitData.farePlans.find((plan) => plan.id === editingId)
      : null;
    const plan = editing ? { id: editing.id, ...fare } : { id: newId(), ...fare };
    const farePlans = editing
      ? transitData.farePlans.map((item) => (item.id === editingId ? plan : item))
      : [...transitData.farePlans, plan];
    commit(
      {
        ...transitData,
        farePlans,
        activeFarePlanId: editing ? transitData.activeFarePlanId : plan.id,
      },
      editing ? "Fare plan updated." : "Fare plan added and activated.",
    );
    setFareForm({
      name: "",
      currency: plan.currency,
      baseFare: 15,
      includedDistanceKm: 3,
      additionalFarePerStartedKm: 5,
      estimateRangeMultiplier: 5,
    });
  }

  function deleteStop(id: string) {
    commit(
      { ...transitData, stops: transitData.stops.filter((stop) => stop.id !== id) },
      "Terminal deleted.",
    );
  }

  function deleteRoute(id: string) {
    commit(
      { ...transitData, routes: transitData.routes.filter((route) => route.id !== id) },
      "Route deleted.",
    );
  }

  function deleteFare(id: string) {
    if (transitData.farePlans.length <= 1) {
      setMessage("At least one fare plan must remain.");
      return;
    }
    const farePlans = transitData.farePlans.filter((plan) => plan.id !== id);
    commit(
      {
        ...transitData,
        farePlans,
        activeFarePlanId:
          transitData.activeFarePlanId === id
            ? farePlans[0].id
            : transitData.activeFarePlanId,
      },
      "Fare plan deleted.",
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage("");
    setStopForm({
      name: "",
      details: "",
      type: "jeepney",
      lat: 13.6192,
      lng: 123.1814,
    });
    setRouteForm({ name: "", details: "", color: "#2563eb", coordinates: "" });
    setFareForm({
      name: "",
      currency: "PHP",
      baseFare: 15,
      includedDistanceKm: 3,
      additionalFarePerStartedKm: 5,
      estimateRangeMultiplier: 5,
    });
  }

  const sections: { id: Section; label: string }[] = [
    { id: "terminals", label: `Terminals (${transitData.stops.length})` },
    { id: "routes", label: `Routes (${transitData.routes.length})` },
    { id: "fares", label: `Fares (${transitData.farePlans.length})` },
    { id: "feedback", label: `Feedback (${feedbackEntries.length})` },
  ];

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
              Dalan administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Manage transit data</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Changes appear on the commuter map and fare calculator in this browser.
            </p>
          </div>
          <Link href="/" className={`${buttonClass} bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100`}>
            Back to map
          </Link>
        </header>

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Transit data">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={section === item.id}
              onClick={() => {
                setSection(item.id);
                cancelEdit();
              }}
              className={`${buttonClass} ${section === item.id ? "brand-gradient text-white" : "bg-white text-zinc-700 shadow-sm dark:bg-zinc-900 dark:text-zinc-200"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(message || storageError) && (
          <p
            className={`mb-4 rounded-xl p-3 text-sm ${storageError || message.startsWith("Could not") || message.startsWith("Enter") || message.startsWith("At least") ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200" : "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200"}`}
            role="status"
          >
            {storageError || message}
          </p>
        )}

        {section === "feedback" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Commuter reports</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Reports saved in this browser, newest first.
              </p>
            </div>
            {feedbackError ? (
              <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                {feedbackError}
              </p>
            ) : feedbackEntries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                No feedback reports have been submitted in this browser.
              </p>
            ) : (
              <div className="space-y-4">
                {[...feedbackEntries].reverse().map((entry, index) => (
                  <article
                    key={`${entry.submittedAt}-${index}`}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {formatLabel(entry.reportType)} · {formatLabel(entry.incident)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {entry.location}
                        </p>
                      </div>
                      <time
                        className="text-xs text-zinc-500"
                        dateTime={entry.submittedAt}
                      >
                        {Number.isNaN(Date.parse(entry.submittedAt))
                          ? entry.submittedAt
                          : new Date(entry.submittedAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {entry.description}
                    </p>
                    {(entry.vehicleDetails || entry.incidentTime) && (
                      <dl className="mt-3 grid gap-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800 sm:grid-cols-2">
                        {entry.vehicleDetails && (
                          <div>
                            <dt className="font-medium text-zinc-500">Vehicle details</dt>
                            <dd>{entry.vehicleDetails}</dd>
                          </div>
                        )}
                        {entry.incidentTime && (
                          <div>
                            <dt className="font-medium text-zinc-500">Incident time</dt>
                            <dd>{entry.incidentTime}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">
              {section === "terminals" ? "Terminal markers" : section === "routes" ? "Jeep routes" : "Fare plans"}
            </h2>
            <div className="space-y-3">
              {section === "terminals" && transitData.stops.map((stop) => (
                <article key={stop.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="min-w-0">
                    <p className="font-semibold">{stop.name}</p>
                    <p className="text-sm text-zinc-500">{stopTypeLabels[stop.type]} · {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editStop(stop)} className={`${buttonClass} bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200`}>Edit</button>
                    <button type="button" onClick={() => deleteStop(stop.id)} className={`${buttonClass} bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200`}>Delete</button>
                  </div>
                </article>
              ))}
              {section === "routes" && transitData.routes.map((route) => (
                <article key={route.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-1 w-8 shrink-0 rounded-full" style={{ backgroundColor: route.color }} />
                    <div>
                      <p className="font-semibold">{route.name}</p>
                      <p className="text-sm text-zinc-500">{route.path.length} map points</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editRoute(route)} className={`${buttonClass} bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200`}>Edit</button>
                    <button type="button" onClick={() => deleteRoute(route.id)} className={`${buttonClass} bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200`}>Delete</button>
                  </div>
                </article>
              ))}
              {section === "fares" && transitData.farePlans.map((plan) => (
                <article key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div>
                    <p className="font-semibold">{plan.name} {plan.id === transitData.activeFarePlanId && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-200">Active</span>}</p>
                    <p className="text-sm text-zinc-500">{plan.currency} {plan.baseFare} / {plan.includedDistanceKm} km + {plan.currency} {plan.additionalFarePerStartedKm} per started km · up to {plan.estimateRangeMultiplier}× estimate</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.id !== transitData.activeFarePlanId && <button type="button" onClick={() => commit({ ...transitData, activeFarePlanId: plan.id }, "Active fare plan changed.")} className={`${buttonClass} bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100`}>Set active</button>}
                    <button type="button" onClick={() => editFare(plan)} className={`${buttonClass} bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200`}>Edit</button>
                    <button type="button" onClick={() => deleteFare(plan.id)} className={`${buttonClass} bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200`}>Delete</button>
                  </div>
                </article>
              ))}
              {((section === "terminals" && transitData.stops.length === 0) || (section === "routes" && transitData.routes.length === 0)) && (
                <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">No entries yet. Add one using the form.</p>
              )}
            </div>
          </section>

          <section className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">{editingId ? "Edit" : "Add"} {section === "terminals" ? "terminal marker" : section === "routes" ? "route" : "fare plan"}</h2>
            {section === "terminals" && (
              <form className="space-y-4" onSubmit={saveStop}>
                <label className="block text-sm font-medium">Name<input required value={stopForm.name} onChange={(event) => setStopForm({ ...stopForm, name: event.target.value })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Terminal details<textarea rows={3} placeholder="Add terminal information shown to commuters" value={stopForm.details} onChange={(event) => setStopForm({ ...stopForm, details: event.target.value })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Marker type<select value={stopForm.type} onChange={(event) => setStopForm({ ...stopForm, type: event.target.value as StopType })} className={fieldClass}><option value="jeepney">Jeepney terminal</option><option value="tricycle">Tricycle terminal</option><option value="padyak">Padyak terminal</option></select></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Latitude<input required type="number" step="any" min="-90" max="90" value={stopForm.lat} onChange={(event) => setStopForm({ ...stopForm, lat: Number(event.target.value) })} className={fieldClass} /></label>
                  <label className="block text-sm font-medium">Longitude<input required type="number" step="any" min="-180" max="180" value={stopForm.lng} onChange={(event) => setStopForm({ ...stopForm, lng: Number(event.target.value) })} className={fieldClass} /></label>
                </div>
                <p className="text-xs text-zinc-500">Use decimal coordinates, e.g. 13.6192, 123.1814.</p>
                <FormActions editing={Boolean(editingId)} onCancel={cancelEdit} />
              </form>
            )}
            {section === "routes" && (
              <form className="space-y-4" onSubmit={saveRoute}>
                <label className="block text-sm font-medium">Route name<input required value={routeForm.name} onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Route details<textarea rows={3} placeholder="Add route information shown to commuters" value={routeForm.details} onChange={(event) => setRouteForm({ ...routeForm, details: event.target.value })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Line color<input type="color" value={routeForm.color} onChange={(event) => setRouteForm({ ...routeForm, color: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white p-1" /></label>
                <label className="block text-sm font-medium">Route points (latitude, longitude)<textarea required rows={5} placeholder="13.62323, 123.18508; 13.62196, 123.1938" value={routeForm.coordinates} onChange={(event) => setRouteForm({ ...routeForm, coordinates: event.target.value })} className={fieldClass} /></label>
                <p className="text-xs text-zinc-500">Separate each point with a semicolon. At least two points are required. Route details are optional and appear in the map’s route panel.</p>
                <FormActions editing={Boolean(editingId)} onCancel={cancelEdit} />
              </form>
            )}
            {section === "fares" && (
              <form className="space-y-4" onSubmit={saveFare}>
                <label className="block text-sm font-medium">Plan name<input required value={fareForm.name} onChange={(event) => setFareForm({ ...fareForm, name: event.target.value })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Currency code<input required maxLength={3} value={fareForm.currency} onChange={(event) => setFareForm({ ...fareForm, currency: event.target.value.toUpperCase() })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Base fare<input required type="number" min="0" step="0.01" value={fareForm.baseFare} onChange={(event) => setFareForm({ ...fareForm, baseFare: Number(event.target.value) })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Distance included (km)<input required type="number" min="0" step="0.1" value={fareForm.includedDistanceKm} onChange={(event) => setFareForm({ ...fareForm, includedDistanceKm: Number(event.target.value) })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Fare per started km after included distance<input required type="number" min="0" step="0.01" value={fareForm.additionalFarePerStartedKm} onChange={(event) => setFareForm({ ...fareForm, additionalFarePerStartedKm: Number(event.target.value) })} className={fieldClass} /></label>
                <label className="block text-sm font-medium">Estimated range multiplier<input required type="number" min="1" step="0.1" value={fareForm.estimateRangeMultiplier} onChange={(event) => setFareForm({ ...fareForm, estimateRangeMultiplier: Number(event.target.value) })} className={fieldClass} /></label>
                <p className="text-xs text-zinc-500">The range runs from the calculated fare up to this multiple. New fare plans become active immediately.</p>
                <FormActions editing={Boolean(editingId)} onCancel={cancelEdit} />
              </form>
            )}
          </section>
        </div>
        )}

        <p className="mt-6 text-xs text-zinc-500">
          Transit data and feedback are saved in this browser only. Clearing browser storage or using another device will not transfer these changes.
          {transitData.farePlans.length === 0 && defaultTransitData.farePlans.length > 0 ? " At least one fare plan is required." : ""}
        </p>
      </div>
    </main>
  );
}

function FormActions({ editing, onCancel }: { editing: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" className={`${buttonClass} brand-gradient flex-1 text-white transition hover:brightness-105`}>
        {editing ? "Save changes" : "Add"}
      </button>
      {editing && <button type="button" onClick={onCancel} className={`${buttonClass} bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100`}>Cancel</button>}
    </div>
  );
}
