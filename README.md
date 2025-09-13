# 🌍 [Earthquake Visualizer](https://earthquake-visualizer-eoyqble6x-vijith-selvakumars-projects.vercel.app/)

An **interactive earthquake visualization web app** built with **React, Vite, Leaflet, and Heatmaps**.  
It fetches live earthquake data from the **USGS Earthquake API** and displays it on a world map with heatmaps, markers, and a timeline slider for animated playback.

---

## ✨ Features

- 📡 **Live Data** – Fetches real-time earthquake data from [USGS](https://earthquake.usgs.gov/).
- 🗺 **Interactive Map** – Built with [React Leaflet](https://react-leaflet.js.org/).
- 🔥 **Heatmap Layer** – Visualizes earthquake intensity with [leaflet.heat](https://github.com/Leaflet/Leaflet.heat).
- 📍 **Circle Markers** – Show location, magnitude, and details on hover.
- 🎚 **Filters** – Filter earthquakes by magnitude, depth, and date range.
- ⏳ **Timeline Slider** – Move through time and see earthquakes appear sequentially.
- ▶️ **Animation Mode** – Play earthquakes in chronological order for better seismic pattern understanding.
- 📱 **Responsive UI** – Mobile-friendly with a clean design.

---

## 🚀 Tech Stack

- **Frontend**: React + Vite  
- **Map Rendering**: Leaflet + React Leaflet  
- **Heatmap**: leaflet.heat  
- **Styling**: CSS / Tailwind (optional)  
- **Data Source**: [USGS Earthquake GeoJSON API](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)  

---

## 📦 Installation & Setup

Clone the repository:

```bash
git clone https://github.com/<your-username>/quake-visualizer.git
cd quake-visualizer
