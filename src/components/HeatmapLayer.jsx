import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points?.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 15,
      blur: 25,
      maxZoom: 8,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
