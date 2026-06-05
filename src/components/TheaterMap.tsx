import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Theater } from "../types";
import { MapPin, Phone, Compass, Popcorn } from "lucide-react";

interface Props {
  theaters: Theater[];
  selectedTheaterId: string | null;
  onSelectTheater: (theaterId: string) => void;
}

export default function TheaterMap({ theaters, selectedTheaterId, onSelectTheater }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on Seoul by default
    const map = L.map(mapContainerRef.current, {
      center: [37.545, 126.985],
      zoom: 12,
      scrollWheelZoom: true,
    });

    const darkTiles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }
    );

    darkTiles.addTo(map);
    mapRef.current = map;
    setMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when map and theaters are loaded
  useEffect(() => {
    if (!mapRef.current || theaters.length === 0) return;

    const map = mapRef.current;

    // Clear old markers if any
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    theaters.forEach((theater) => {
      // Choose neon marker color scheme based on Cinema Brand
      const brandColor =
        theater.brand === "CGV"
          ? "#ef4444" // CGV Red
          : theater.brand === "Lotte"
          ? "#ec4899" // Lotte Cinema Deep Pink
          : "#06b6d4"; // Megabox Tech Blue

      // Custom HTML Marker Pin
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-60" style="background-color: ${brandColor};"></span>
            <div class="relative rounded-full w-4 h-4 shadow-lg border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-black" style="background-color: ${brandColor};">
              🍿
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([theater.lat, theater.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <strong style="color: #ffffff; font-size: 14px; display: block; margin-bottom: 4px;">
              ${theater.name}
            </strong>
            <span style="color: #a3a3a3; font-size: 11px; display: block; margin-bottom: 6px;">
              ${theater.brand === "CGV" ? "CGV 멀티플렉스" : theater.brand === "Lotte" ? "롯데시네마 타워" : "메가박스 씨네마"}
            </span>
            <div style="color: #e5e5e5; margin-bottom: 4px;">📍 ${theater.address}</div>
            <div style="color: #38bdf8;">📞 ${theater.phone}</div>
          </div>
        `);

      // Add click handler to select theater in global React state
      marker.on("click", () => {
        onSelectTheater(theater.id);
      });

      markersRef.current[theater.id] = marker;
    });
  }, [theaters, mapInitialized]);

  // Orbit pan map to selected theater
  useEffect(() => {
    if (!mapRef.current || !selectedTheaterId) return;

    const selectedTheater = theaters.find((t) => t.id === selectedTheaterId);
    if (selectedTheater) {
      mapRef.current.setView([selectedTheater.lat, selectedTheater.lng], 15, {
        animate: true,
        duration: 1.2,
      });

      // Highlight marker popup trigger
      const marker = markersRef.current[selectedTheaterId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedTheaterId, theaters]);

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-sm p-6 shadow-xl overflow-hidden mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-red-500 animate-spin-slow" />
            NEIGHBORHOOD CINEMA LOCATOR / 주변 극장 연동 맵
          </h2>
          <p className="text-xs text-white/50 font-mono uppercase tracking-wide mt-1">
            INTELLIGENT LOCATION MULTIPLEX INDEX (CGV, LOTTE, MEGABOX). INTERCONNECTED SPATIAL ANALYTICS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[420px] lg:h-[480px]">
        {/* Left Side Sidebar List */}
        <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-2.5 h-full max-h-[460px] custom-scroller">
          {theaters.map((theater) => {
            const isSelected = selectedTheaterId === theater.id;
            const brandBadge =
              theater.brand === "CGV"
                ? "bg-red-600/10 text-red-500 border border-red-500/30"
                : theater.brand === "Lotte"
                ? "bg-white/10 text-white border border-white/30"
                : "bg-neutral-900 text-[#a3a3a3] border border-white/10";

            return (
              <button
                key={theater.id}
                onClick={() => onSelectTheater(theater.id)}
                className={`w-full text-left p-3.5 rounded-none border transition-all duration-300 flex flex-col gap-1 cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#111] border-white text-white shadow-lg"
                    : "bg-[#050505] border-white/10 hover:bg-[#0f0f0f] text-white/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[14px] uppercase tracking-wide">{theater.name}</span>
                  <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 ${brandBadge}`}>
                    {theater.brand}
                  </span>
                </div>
                <div className="flex items-start gap-1 text-[11px] text-white/50 mt-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                  <span className="line-clamp-2">{theater.address}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/30 mt-1 font-mono">
                  <Phone className="w-3 h-3 text-red-500" />
                  <span>{theater.phone}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side Map Canvas */}
        <div className="lg:col-span-2 rounded-none overflow-hidden relative border border-white/10 bg-[#050505] h-full">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>
      </div>
    </div>
  );
}
