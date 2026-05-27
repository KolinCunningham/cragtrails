'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Self-contained Route type (also duplicated in page for simplicity)
export interface Route {
  id: number;
  name: string;
  crag: string;
  lat: number;
  lng: number;
  grade: string;
  difficulty: number;
  popularity: number;
  type: 'Boulder' | 'Sport' | 'Trad';
  description: string;
  height?: number;
  stars: number;
}

// Fix for default icons (not used since we use CircleMarker, but safe)
if (typeof window !== 'undefined') {
  // @ts-expect-error - Leaflet icon path fix for SSR/bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export interface CragMapProps {
  routes: Route[];
  selectedRouteId: number | null;
  onMarkerClick: (route: Route) => void;
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
}

// Grade to color (difficulty)
function getGradeColor(grade: string): string {
  const g = grade.toUpperCase();
  // V-scale bouldering or YDS sport simplified
  if (g.includes('V0') || g.includes('V1') || g.includes('5.6') || g.includes('5.7') || g.includes('5.8') || g.includes('5.9')) return '#22c55e'; // green easy
  if (g.includes('V2') || g.includes('V3') || g.includes('V4') || g.includes('5.10')) return '#eab308'; // yellow moderate
  if (g.includes('V5') || g.includes('V6') || g.includes('5.11')) return '#f97316'; // orange hard
  if (g.includes('V7') || g.includes('V8') || g.includes('V9') || g.includes('5.12') || g.includes('5.13')) return '#ef4444'; // red very hard
  return '#8b5cf6'; // purple expert+
}

// Popularity -> radius (heatmap-ish)
function getMarkerRadius(popularity: number, isSelected: boolean): number {
  // BIGGER for 10yo / grandma fingers: min ~14px (28px diameter) tap-friendly
  const base = 14 + Math.floor(popularity / 11); 
  return isSelected ? base + 6 : base;
}

// Small jitter so overlapping crag routes don't stack exactly
function jitterCoord(coord: number, seed: number): number {
  return coord + (Math.sin(seed) * 0.0006 + Math.cos(seed * 1.3) * 0.00035);
}

function RouteMarkers({ routes, selectedRouteId, onMarkerClick }: { 
  routes: Route[]; 
  selectedRouteId: number | null; 
  onMarkerClick: (r: Route) => void;
}) {
  const map = useMap();

  // Simple client-side clustering for density at low zoom
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom()),
  });

  const isClustered = zoom < 11; // Cluster below zoom 11 for overview density

  const displayItems = useMemo(() => {
    if (!isClustered) {
      return routes.map((route, idx) => ({
        id: route.id,
        lat: jitterCoord(route.lat, idx),
        lng: jitterCoord(route.lng, idx + 7),
        route,
        isCluster: false,
        count: 1,
      }));
    }

    // Group by crag for cluster view (density visualization)
    const groups = new Map<string, Route[]>();
    routes.forEach((r) => {
      if (!groups.has(r.crag)) groups.set(r.crag, []);
      groups.get(r.crag)!.push(r);
    });

    return Array.from(groups.entries()).map(([crag, groupRoutes], idx) => {
      // Centroid of the group
      const avgLat = groupRoutes.reduce((s, r) => s + r.lat, 0) / groupRoutes.length;
      const avgLng = groupRoutes.reduce((s, r) => s + r.lng, 0) / groupRoutes.length;
      // Representative route = highest popularity
      const rep = [...groupRoutes].sort((a, b) => b.popularity - a.popularity)[0];
      return {
        id: rep.id,
        lat: avgLat,
        lng: avgLng,
        route: rep,
        isCluster: true,
        count: groupRoutes.length,
        allRoutes: groupRoutes,
      };
    });
  }, [routes, isClustered]);

  return (
    <>
      {displayItems.map((item, index) => {
        const isSelected = !item.isCluster && item.id === selectedRouteId;
        const color = getGradeColor(item.route.grade);
        const radius = item.isCluster 
          ? Math.max(18, 16 + item.count * 1.8)  // Much larger clusters = easy big tap targets for kids/grandmas
          : getMarkerRadius(item.route.popularity, isSelected);

        return (
          <CircleMarker
            key={`${item.id}-${index}-${isClustered ? 'cluster' : 'single'}`}
            center={[item.lat, item.lng]}
            radius={radius}
            pathOptions={{
              color: '#fff',
              weight: item.isCluster ? 2 : (isSelected ? 3 : 1.5),
              fillColor: color,
              fillOpacity: item.isCluster ? 0.85 : (isSelected ? 0.95 : 0.75 + (item.route.popularity / 400)),
            }}
            eventHandlers={{
              click: () => {
                if (item.isCluster && (item as any).allRoutes) {
                  // On cluster click: zoom in + center on representative
                  map.flyTo([item.lat, item.lng], Math.min(13, zoom + 2.5), { duration: 0.6 });
                  // Select the most popular in cluster
                  const best = [...(item as any).allRoutes].sort((a, b) => b.popularity - a.popularity)[0];
                  onMarkerClick(best);
                } else {
                  onMarkerClick(item.route);
                }
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95} className="font-sans text-xs">
              {item.isCluster 
                ? `${item.count} routes @ ${item.route.crag} — click to zoom` 
                : `${item.route.name} • ${item.route.grade} • ${item.route.crag} • ★${item.route.stars} • ${item.route.type} • ${item.route.popularity} sends`}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

// Inner component that receives map instance
function MapController({ center, zoom, onMapReady }: { 
  center?: [number, number]; 
  zoom?: number; 
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);

  return null;
}

export default function CragMap({ 
  routes, 
  selectedRouteId, 
  onMarkerClick, 
  center, 
  zoom = 7, 
  onMapReady 
}: CragMapProps) {
  // Default center: US West climbing heartland (Bishop / Yosemite area)
  const defaultCenter: [number, number] = [37.6, -118.9];

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-[#E5E2D9] shadow-xl bg-[#F8F7F4]">
      <MapContainer
        center={center ?? defaultCenter}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: '#F8F7F4' }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* OpenStreetMap tiles - free, no key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        <RouteMarkers 
          routes={routes} 
          selectedRouteId={selectedRouteId} 
          onMarkerClick={onMarkerClick} 
        />

        <MapController 
          center={center} 
          zoom={zoom} 
          onMapReady={onMapReady} 
        />
      </MapContainer>

      {/* Zoom / cluster legend + offline hint — NOW BIG + KID FRIENDLY */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur px-4 py-2 rounded-xl text-sm font-medium border border-[#E5E2D9] shadow text-[#1F2525] flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Easy-peasy
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 ml-1" /> Getting fun
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" /> Pretty hard
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Super strong!
        </div>
        <div className="text-[12px] opacity-80">Big circles = super popular climbs. Tap the big colored dots!</div>
      </div>

      {/* Bonus: offline map hint */}
      <div className="absolute top-3 left-3 z-[1000] max-w-[210px] rounded-md bg-white/95 text-[#5C6666] px-2.5 py-1 text-[9px] leading-tight backdrop-blur font-mono tracking-tight border border-[#E5E2D9]">
        OSM tiles. <span className="opacity-75">Offline? Cache tiles via plugins or use dedicated offline maps.</span>
      </div>
    </div>
  );
}
