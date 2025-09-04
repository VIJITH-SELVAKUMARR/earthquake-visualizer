import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "./App.css";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// Build a USGS API url based on filters
function makeUsgsUrl({ start, end, minMag, limit }) {
  const params = new URLSearchParams({
    format: "geojson",
    orderby: "time",
    starttime: start.toISOString().slice(0, 10),
    endtime: end.toISOString().slice(0, 10),
    minmagnitude: String(minMag),
    limit: String(limit ?? 1000),
  });
  return `${USGS_BASE}?${params.toString()}`;
}

function magnitudeColor(m) {
  if (m >= 7) return "#7f0000"; // dark red
  if (m >= 6) return "#b30000";
  if (m >= 5) return "#e34a33";
  if (m >= 4) return "#fc8d59";
  if (m >= 3) return "#fdbb84";
  if (m >= 2) return "#fdd49e";
  return "#fee8c8";
}

function magToRadius(m) {
  return Math.max(3, Math.pow(m + 1, 2));
}

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const layer = window.L.heatLayer(points, {
      radius: 35,
      blur: 13,
      maxZoom: 17,
      max: 8,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);
  const [darkMode, setDarkMode] = useState(false);

  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(today);
  const [minMag, setMinMag] = useState(3);
  const [limit, setLimit] = useState(2000);
  const [querying, setQuerying] = useState(false);
  const [features, setFeatures] = useState([]);
  const [textFilter, setTextFilter] = useState("");
  const [view, setView] = useState("circles"); // "circles" | "heat"

  // --- Timeline state ---
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // handle play button click
  const handlePlayPause = () => {
    if (!isPlaying) {
      // If starting to play, reset to beginning
      setTimeIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Fetch earthquakes whenever filters change
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setQuerying(true);
      try {
        const url = makeUsgsUrl({ start, end, minMag, limit });
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled) {
          setFeatures(Array.isArray(data.features) ? data.features : []);
          setTimeIndex(0); // reset timeline
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setFeatures([]);
      } finally {
        if (!cancelled) setQuerying(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [start, end, minMag, limit]);


  // Sort features by time
  const sorted = useMemo(() => {
    return [...features].sort((a, b) => a.properties.time - b.properties.time);
  }, [features]);

  // Extract unique times
  const times = useMemo(() => sorted.map((f) => f.properties.time), [sorted]);

  useEffect(() => {
  if (times.length > 0) {
    setTimeIndex(times.length - 1);
  }
}, [times]);



  // Auto-play animation
  // Auto-play effect
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex((prev) => {
          if (prev < times.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev; // stop at the end
          }
        });
      }, 500); // adjust speed here
    }
    return () => clearInterval(interval);
  }, [isPlaying, times.length]);

  // Filtered + timeline cutoff
  const filtered = useMemo(() => {
    let base = sorted;
    if (textFilter.trim()) {
      const q = textFilter.toLowerCase();
      base = base.filter((f) => (f.properties?.place || "").toLowerCase().includes(q));
    }
    if (times.length > 0) {
      const cutoff = times[timeIndex];
      base = base.filter((f) => f.properties.time <= cutoff);
    }
    return base;
  }, [sorted, textFilter, times, timeIndex]);

  const heatPoints = useMemo(
    () =>
      filtered
        .map((f) => {
          const [lng, lat] = f.geometry?.coordinates || [];
          const m = f.properties?.mag ?? 0;
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          return [lat, lng, Math.max(0.1, m)];
        })
        .filter(Boolean),
    [filtered]
  );

  const total = features.length;

  return (
    <div className="min-h-[100vh] bg-slate-50 text-slate-900" data-theme={darkMode ? "dark" : "light"}>
      {/* Header */}
      <header className="sticky top-[0rem] z-10 bg-white border-b border-slate-200">
        <div className="max-w-[80rem] mx-auto px-[1rem] py-[0.75rem] flex flex-col gap-[0.75rem] md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[3rem] leading-[1] font-serif text-blue-300">Earthquake Visualizer</h1>
            <p className="text-[0.875rem] leading-[1.25rem] text-slate-600">
              USGS real-time earthquakes — filter by date, magnitude, and animate over time.
            </p>
          </div>
          <div className="flex flex-wrap gap-[0.75rem] items-end">

            {/* Filters ... (unchanged) */}

            <div className="flex items-center gap-[0.5rem]">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">Theme </label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-[0.75rem] py-[0.5rem] rounded-[0.75rem] border-[0.0625rem] shadow-[0 0.0625rem 0.1875rem rgba(0,0,0,0.1),0 0.0625rem 0.125rem rgba(0,0,0,0.06)] text-[0.875rem] leading-[1.25rem] bg-white hover:bg-slate-100">
                {darkMode ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>

            <div className="flex flex-col">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">Start date  </label>
              <input
                type="date"
                value={fmtDateInput(start)}
                onChange={(e) => setStart(new Date(e.target.value))}
                className="border rounded-[0.75rem] px-[0.75rem] py-[0.5rem] text-[0.875rem] leading-[1.25rem]"
                max={fmtDateInput(end)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">End date  </label>
              <input
                type="date"
                value={fmtDateInput(end)}
                onChange={(e) => setEnd(new Date(e.target.value))}
                className="border rounded-[0.75rem] px-[0.75rem] py-[0.5rem] text-[0.875rem] leading-[1.25rem]"
                min={fmtDateInput(start)}
              />
            </div>
            <div className="flex flex-col w-40">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">Min magnitude:  {minMag}</label>
              <input
                type="range"
                min={0}
                max={8}
                step={0.1}
                value={minMag}
                onChange={(e) => setMinMag(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex flex-col w-44">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">filter by place  </label>
              <input
                type="text"
                placeholder="e.g., Japan, Alaska, India"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                className="border rounded-[0.75rem] px-[0.75rem] py-[0.5rem] text-[0.875rem] leading-[1.25rem]"
              />
            </div>
            <div className="flex flex-col w-36">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">Max results  </label>
              <input
                type="number"
                min={100}
                max={20000}
                step={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border rounded-[0.75rem] px-[0.75rem] py-[0.5rem] text-[0.875rem] leading-[1.25rem]"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-[0.75rem] leading-[1rem] text-slate-500">View  </label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="border rounded-[0.75rem] px-[0.75rem] py-[0.5rem] text-[0.875rem] leading-[1.25rem]"
              >
                <option value="circles">Circles  </option>
                <option value="heat">Heatmap  </option>
              </select>
            </div>
            <div className="text-[0.75rem] leading-[1rem] text-slate-500">
              {querying ? "Loading…" : `${total.toLocaleString()} quakes`}
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="max-w-[80rem] mx-auto p-[1rem]">
        <div className="h-[70vh] w-full rounded-[1rem] overflow-hidden shadow map-container">
          <MapContainer center={[20, 78]} zoom={5} id="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={
                darkMode
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            />
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap" />
              <LayersControl.Overlay checked name="Earthquakes">
                <LayerGroup>
                  {view === "circles" &&
                    filtered.map((f) => {
                      const id = f.id;
                      const [lng, lat, depthKm] = f.geometry?.coordinates || [];
                      const props = f.properties || {};
                      const m = props.mag ?? 0;
                      if (typeof lat !== "number" || typeof lng !== "number") return null;
                      return (
                        <CircleMarker
                          key={id}
                          center={[lat, lng]}
                          radius={magToRadius(m)}
                          pathOptions={{
                            color: magnitudeColor(m),
                            fillColor: magnitudeColor(m),
                            fillOpacity: 0.7,
                            weight: 0.1,
                          }}
                          eventHandlers={{
                            click: () => {
                              if (props.url) window.open(props.url, "_blank");
                            },
                          }}
                        >
                          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                            <div className="text-[0.75rem] leading-[1rem] text-slate-900">
                              <div className="font-semibold">
                                M {m?.toFixed?.(1)} — {props.place || "Unknown"}
                              </div>
                              <div>Depth:  {depthKm?.toFixed?.(1)} km</div>
                              <div>
                                {props.time ? new Date(props.time).toLocaleString() : ""}
                              </div>
                              <div className="underline">Tap for USGS page</div>
                            </div>
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}

                  {view === "heat" && <HeatmapLayer points={heatPoints} />}
                </LayerGroup>
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        </div>

        {/* Timeline Controls */}
        {times.length > 0 && (
          <div className="mt-[1rem] p-[0.75rem] bg-white shadow rounded-[0.75rem] flex items-center gap-[1rem]">
            <button
              onClick={handlePlayPause}
              className="px-[0.75rem] py-[0.25rem] bg-blue-600 text-white rounded-[0.5rem] text-[0.875rem] leading-[1.25rem] hover:bg-blue-700"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <input
              type="range"
              min={0}
              max={times.length - 1}
              value={timeIndex}
              onChange={(e) => setTimeIndex(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-[0.875rem] leading-[1.25rem] text-slate-700">
              {new Date(times[timeIndex]).toLocaleString()}
            </span>
          </div>
        )}

        {/* Footer */}
        <section className="mt-[1rem] text-[0.875rem] leading-[1.25rem] text-slate-700 grid gap-[0.25rem]">
          <p>
            Tip: Use the timeline slider to animate earthquakes. Increase the date
            range and lower the min magnitude to see global patterns.
          </p>
          <p>
            Data source: USGS Earthquake Catalog API. Times are shown in your
            browser's local timezone.
          </p>
        </section>
      </main>
    </div>
  );
}

function fmtDateInput(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

