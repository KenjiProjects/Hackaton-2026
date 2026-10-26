"use client";

import { useState } from "react";

const FEEDBACK_STORAGE_KEY = "dalan-feedback";
const inputClassName =
  "mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-orange-300";

export default function FeedbackPage() {
  const [reportType, setReportType] = useState("driver-violation");
  const [incident, setIncident] = useState("reckless-driving");
  const [location, setLocation] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [description, setDescription] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const savedFeedback = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const previousEntries: unknown = savedFeedback
        ? JSON.parse(savedFeedback)
        : [];
      if (!Array.isArray(previousEntries)) {
        throw new Error("Saved feedback data is invalid.");
      }

      const feedback = {
        reportType,
        incident,
        location: location.trim(),
        vehicleDetails: vehicleDetails.trim() || null,
        description: description.trim(),
        incidentTime: incidentTime || null,
        submittedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        FEEDBACK_STORAGE_KEY,
        JSON.stringify([...previousEntries, feedback]),
      );
      setLocation("");
      setVehicleDetails("");
      setDescription("");
      setIncidentTime("");
      setStatus("Report saved on this device. It has not been sent anywhere.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Feedback could not be saved. Please try again.",
      );
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-5 py-8 font-sans dark:bg-black sm:py-12">
      <section className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
            Commuter safety
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Report an incident
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Let us know about a driver violating traffic rules or a road problem
            affecting your trip, such as heavy traffic caused by an accident.
          </p>
        </div>

        <form className="space-y-5" onSubmit={submitFeedback}>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            What are you reporting?
            <select
              required
              className={inputClassName}
              value={reportType}
              onChange={(event) => {
                setReportType(event.target.value);
                setIncident(
                  event.target.value === "driver-violation"
                    ? "reckless-driving"
                    : "accident-traffic",
                );
              }}
            >
              <option value="driver-violation">
                Driver violating traffic rules
              </option>
              <option value="road-problem">Road or traffic problem</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Incident type
            <select
              required
              className={inputClassName}
              value={incident}
              onChange={(event) => setIncident(event.target.value)}
            >
              {reportType === "driver-violation" ? (
                <>
                  <option value="reckless-driving">Reckless driving</option>
                  <option value="traffic-signal">Ignored a traffic signal</option>
                  <option value="illegal-stopping">
                    Illegal stopping or parking
                  </option>
                  <option value="wrong-way">Driving against traffic</option>
                  <option value="other-driver">Other traffic violation</option>
                </>
              ) : (
                <>
                  <option value="accident-traffic">
                    Accident causing heavy traffic
                  </option>
                  <option value="road-closure">Road closure</option>
                  <option value="road-damage">Road damage or obstruction</option>
                  <option value="flooding">Flooding</option>
                  <option value="other-road">Other road or traffic problem</option>
                </>
              )}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Where did it happen?
            <input
              required
              maxLength={160}
              className={inputClassName}
              placeholder="Street, barangay, or nearby landmark"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>

          {reportType === "driver-violation" && (
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Vehicle details (optional)
              <input
                maxLength={120}
                className={inputClassName}
                placeholder="Vehicle type, route, or plate number"
                value={vehicleDetails}
                onChange={(event) => setVehicleDetails(event.target.value)}
              />
            </label>
          )}

          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            When did it happen? (optional)
            <input
              type="datetime-local"
              className={inputClassName}
              value={incidentTime}
              onChange={(event) => setIncidentTime(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            What happened?
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={5}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-orange-300"
              placeholder="Describe what you saw. Please do not put yourself in danger to collect information."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <span className="mt-1 block text-right text-xs text-zinc-500">
              {description.length}/1000
            </span>
          </label>

          <button
            type="submit"
            className="brand-gradient flex h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-white transition hover:brightness-105"
          >
            Save incident report
          </button>
        </form>

        {status && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100"
          >
            {status}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Reports are currently stored only in this browser and are not
          transmitted to authorities or the Dalan team. For emergencies or
          immediate danger, contact local emergency services directly.
        </p>
      </section>
    </main>
  );
}
