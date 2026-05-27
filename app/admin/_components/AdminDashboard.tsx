"use client";

import React, { useState } from "react";
import { 
  Shield, Camera, MapPin, AlertTriangle, TrendingUp, Database, 
  Check, X, Eye, Search, RefreshCw, Clock, Users, FileText, 
  Award, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ---------------- TYPES ----------------
type PendingPhoto = {
  id: string;
  url: string;
  user: { name: string; handle: string };
  crag: string;
  routeName?: string;
  caption: string;
  uploadedAt: string;
};

type Route = {
  id: string;
  crag: string;
  name: string;
  grade: string;
  type: string;
  description: string;
  safetyNotes: string;
  firstAscent?: string;
  length?: number;
};

type FlaggedItem = {
  id: string;
  type: "photo" | "comment" | "route_suggestion" | "beta";
  title: string;
  content: string;
  reportedBy: string;
  reason: string;
  crag: string;
  reportedAt: string;
  severity: "low" | "medium" | "high";
};

type AuditEntry = {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
};

type Tab = "dashboard" | "photos" | "routes" | "moderation" | "health";

// ---------------- INITIAL MOCK DATA (Realistic climbing domain) ----------------
const INITIAL_PHOTOS: PendingPhoto[] = [
  { id: "p1", url: "https://source.unsplash.com/Ec9YU6ATKmg/800/600", user: { name: "Maya Chen", handle: "@mayasends" }, crag: "Red River Gorge", routeName: "Tequila Sunrise", caption: "First lead of the season! Felt solid on the crux.", uploadedAt: "2026-05-24T09:12:00Z" },
  { id: "p2", url: "https://source.unsplash.com/plWDssUkimQ/800/600", user: { name: "Jordan Hale", handle: "@jordanvert" }, crag: "Yosemite Valley", routeName: "Royal Arches", caption: "Golden hour on the Apron. The exposure is wild.", uploadedAt: "2026-05-24T11:45:00Z" },
  { id: "p3", url: "https://source.unsplash.com/oS5O3gVMnpA/800/600", user: { name: "Sam Rivera", handle: "@samarock" }, crag: "Indian Creek", routeName: "Supercrack", caption: "Perfect splitter. Hands were cooked.", uploadedAt: "2026-05-23T18:03:00Z" },
  { id: "p4", url: "https://source.unsplash.com/VnmbcgAfL3Q/800/600", user: { name: "Lena Voss", handle: "@lenavoss" }, crag: "Smith Rock", routeName: "Aggro Gully", caption: "Hardest onsight this year. So pumped!", uploadedAt: "2026-05-23T14:22:00Z" },
  { id: "p5", url: "https://source.unsplash.com/pwb9NTr7vOE/800/600", user: { name: "Kai Nakamura", handle: "@kaiclimbs" }, crag: "Joshua Tree", routeName: "Walk on the Wild Side", caption: "Classic JTree patina. Felt like a time capsule.", uploadedAt: "2026-05-22T20:55:00Z" },
  { id: "p6", url: "https://source.unsplash.com/DmXTuoL17Ao/800/600", user: { name: "Riley Quinn", handle: "@rileytrad" }, crag: "Red River Gorge", routeName: "Midnight Lightning", caption: "Family day at the Motherlode. Kids were stoked.", uploadedAt: "2026-05-22T16:10:00Z" },
];

const INITIAL_ROUTES: Route[] = [
  { id: "r1", crag: "Red River Gorge", name: "Tequila Sunrise", grade: "5.12a", type: "Sport", description: "Classic steep endurance testpiece. Long moves between good pockets on beautiful orange rock.", safetyNotes: "Two bolts are slightly loose — report to local coalition if you clean.", firstAscent: "Porter Jarrard, 1992", length: 32 },
  { id: "r2", crag: "Yosemite Valley", name: "Royal Arches", grade: "5.10c", type: "Trad", description: "Iconic multi-pitch adventure. Incredible exposure on the Apron. Bring lots of gear and patience.", safetyNotes: "Loose blocks near pitch 3. Helmets mandatory.", firstAscent: "Allen Steck & Bob Swift, 1936", length: 280 },
  { id: "r3", crag: "Indian Creek", name: "Supercrack", grade: "5.10d", type: "Trad", description: "The ultimate splitter. Perfect hands all the way. One of the best crack climbs in the world.", safetyNotes: "Classic — no major hazards beyond standard crack climbing risks.", firstAscent: "Unknown, 1970s", length: 55 },
  { id: "r4", crag: "Smith Rock", name: "Aggro Gully", grade: "5.13b", type: "Sport", description: "Powerful, bouldery start into thin technical face. One of the best hard routes at Smith.", safetyNotes: "Crux bolt is old. Consider stick clipping if unsure.", firstAscent: "Alan Watts, 1989", length: 18 },
  { id: "r5", crag: "Joshua Tree", name: "Walk on the Wild Side", grade: "5.11a", type: "Trad", description: "Delicate patina face climbing on a beautiful arete. Classic JTree adventure.", safetyNotes: "Runout section after the crux. Not for the faint of heart.", firstAscent: "Bob Gaines & Dave Evans, 1984", length: 42 },
];

const INITIAL_FLAGGED: FlaggedItem[] = [
  { id: "f1", type: "comment", title: "Inappropriate language on route page", content: "This route sucks and anyone who says otherwise is a poser. Total sandbag garbage.", reportedBy: "@concerned_mom92", reason: "Profanity + hostile tone toward other users", crag: "Red River Gorge", reportedAt: "2026-05-24T08:40:00Z", severity: "medium" },
  { id: "f2", type: "photo", title: "Photo possibly showing unsafe practice", content: "Photo p4 — climber not wearing helmet on multi-pitch", reportedBy: "@safetyfirst", reason: "Safety concern visible in approved photo", crag: "Smith Rock", reportedAt: "2026-05-23T22:15:00Z", severity: "high" },
  { id: "f3", type: "route_suggestion", title: "Duplicate or inaccurate route submission", content: "New route 'The Big Roof' at Indian Creek — already exists as 'Supercrack' under different name", reportedBy: "@localguide", reason: "Duplicate / misinformation", crag: "Indian Creek", reportedAt: "2026-05-23T19:05:00Z", severity: "low" },
  { id: "f4", type: "beta", title: "Potentially dangerous beta comment", content: "Just dyno past the second bolt, the clip is easy from there", reportedBy: "@alex_trad", reason: "Encourages dangerous technique on 5.13", crag: "Smith Rock", reportedAt: "2026-05-22T11:50:00Z", severity: "high" },
];

const INITIAL_AUDIT: AuditEntry[] = [
  { id: "a1", timestamp: "2026-05-24T12:18:00Z", action: "APPROVED PHOTO", actor: "admin@cragtrails.app", details: "p2 • Royal Arches by @jordanvert — no issues" },
  { id: "a2", timestamp: "2026-05-24T11:55:00Z", action: "REJECTED PHOTO", actor: "admin@cragtrails.app", details: "p7 • Reason: Blurry + no clear climbing context" },
  { id: "a3", timestamp: "2026-05-24T09:40:00Z", action: "EDITED ROUTE", actor: "admin@cragtrails.app", details: "r1 • Fixed safety notes on Tequila Sunrise (loose bolts)" },
];

// ---------------- UTILS ----------------
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ---------------- MAIN DASHBOARD COMPONENT ----------------
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Live mutable state
  const [photos, setPhotos] = useState<PendingPhoto[]>(INITIAL_PHOTOS);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [flagged, setFlagged] = useState<FlaggedItem[]>(INITIAL_FLAGGED);
  const [audit, setAudit] = useState<AuditEntry[]>(INITIAL_AUDIT);

  // UI state
  const [photoSearch, setPhotoSearch] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<PendingPhoto | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const [routeSearch, setRouteSearch] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes[0]?.id || null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [modFilter, setModFilter] = useState<"all" | FlaggedItem["type"]>("all");
  const [modSearch, setModSearch] = useState("");
  const [selectedFlagged, setSelectedFlagged] = useState<FlaggedItem | null>(null);
  const [modNote, setModNote] = useState("");

  const [healthMP, setHealthMP] = useState({ lastRun: "2026-05-26T09:12:00Z", status: "healthy" as const, routes: 187420 });
  const [openBetaPct, setOpenBetaPct] = useState(91);

  // Derived
  const pendingPhotos = photos;
  const filteredPhotos = pendingPhotos.filter(p =>
    p.crag.toLowerCase().includes(photoSearch.toLowerCase()) ||
    p.user.name.toLowerCase().includes(photoSearch.toLowerCase()) ||
    (p.routeName || "").toLowerCase().includes(photoSearch.toLowerCase())
  );

  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const filteredRoutes = routes.filter(r =>
    r.name.toLowerCase().includes(routeSearch.toLowerCase()) ||
    r.crag.toLowerCase().includes(routeSearch.toLowerCase())
  );

  const filteredFlagged = flagged.filter(f => {
    const matchesType = modFilter === "all" || f.type === modFilter;
    const matchesSearch = 
      f.title.toLowerCase().includes(modSearch.toLowerCase()) ||
      f.content.toLowerCase().includes(modSearch.toLowerCase()) ||
      f.crag.toLowerCase().includes(modSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ---------------- AUDIT LOG HELPER ----------------
  function logAction(action: string, details: string) {
    const entry: AuditEntry = {
      id: "a" + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      actor: "admin@cragtrails.app",
      details,
    };
    setAudit(prev => [entry, ...prev].slice(0, 24));
  }

  // ---------------- PHOTO MODERATION ACTIONS ----------------
  function approvePhoto(id: string) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelectedPhoto(null);

    logAction("APPROVED PHOTO", `${id} • ${photo.routeName || photo.crag} by ${photo.user.handle}`);
    toast.success("Photo approved", { description: "Now visible to all users. Thank you for keeping the crags clean." });
  }

  function openReject(id: string) {
    setShowRejectModal(id);
    setRejectReason("");
  }

  function confirmReject() {
    if (!showRejectModal) return;
    const photo = photos.find(p => p.id === showRejectModal);
    if (!photo) return;

    setPhotos(prev => prev.filter(p => p.id !== showRejectModal));
    setShowRejectModal(null);
    setSelectedPhoto(null);

    logAction("REJECTED PHOTO", `${showRejectModal} • ${photo.routeName || photo.crag} — Reason: ${rejectReason || "No reason provided"}`);
    toast.error("Photo rejected", { description: rejectReason ? `Reason recorded: ${rejectReason}` : "Reason logged in audit." });
    setRejectReason("");
  }

  function bulkApproveVisible() {
    const visibleIds = filteredPhotos.map(p => p.id);
    if (visibleIds.length === 0) return;

    setPhotos(prev => prev.filter(p => !visibleIds.includes(p.id)));
    logAction("BULK APPROVED", `${visibleIds.length} photos — crag filter: "${photoSearch || "all"}"`);
    toast.success(`Approved ${visibleIds.length} photos`, { description: "All visible pending photos are now public." });
  }

  // ---------------- ROUTE EDITOR ----------------
  function startEditRoute(route: Route) {
    setSelectedRouteId(route.id);
    setEditingRoute({ ...route });
  }

  function updateEditingField<K extends keyof Route>(key: K, value: Route[K]) {
    if (!editingRoute) return;
    setEditingRoute({ ...editingRoute, [key]: value });
  }

  function saveRouteEdit() {
    if (!editingRoute) return;

    const original = routes.find(r => r.id === editingRoute.id);
    const changedFields: string[] = [];
    
    if (original) {
      (["name", "grade", "description", "safetyNotes"] as const).forEach(field => {
        if (original[field] !== editingRoute[field]) changedFields.push(field);
      });
    }

    setRoutes(prev => prev.map(r => r.id === editingRoute.id ? editingRoute : r));
    
    const detail = `${editingRoute.id} • ${editingRoute.name} (${changedFields.join(", ") || "quick save"})`;
    logAction("EDITED ROUTE", detail);
    toast.success("Route data updated", { description: "Changes live for all users. Bad data fixed instantly." });

    setEditingRoute(null);
  }

  function quickFixExample(routeId: string) {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const fixed = { ...route, safetyNotes: "Updated via admin quick-fix: " + route.safetyNotes };
    setRoutes(prev => prev.map(r => r.id === routeId ? fixed : r));
    logAction("QUICK-FIXED ROUTE", `${routeId} • Safety notes improved`);
    toast.success("Quick fix applied", { description: "Safety notes improved for climber safety." });
  }

  // ---------------- FLAGGED / UGC MODERATION ----------------
  function reviewFlagged(item: FlaggedItem) {
    setSelectedFlagged(item);
    setModNote("");
  }

  function resolveFlagged(action: string) {
    if (!selectedFlagged) return;

    const note = modNote.trim() ? ` — Note: ${modNote}` : "";
    logAction(`RESOLVED ${selectedFlagged.type.toUpperCase()}`, `${selectedFlagged.id} • ${action}${note}`);

    setFlagged(prev => prev.filter(f => f.id !== selectedFlagged.id));
    setSelectedFlagged(null);
    setModNote("");

    toast.success("Content moderated", {
      description: `${action}. Logged for accountability.`,
    });
  }

  // ---------------- DATA HEALTH ACTIONS ----------------
  function triggerMPSync() {
    const newTime = new Date().toISOString();
    setHealthMP(prev => ({ ...prev, lastRun: newTime, routes: prev.routes + Math.floor(Math.random() * 180) + 40 }));
    logAction("MP SYNC TRIGGERED", "Manual sync initiated from admin");
    toast.success("Mountain Project sync started", { description: "Data will refresh across the platform shortly." });
  }

  function improveOpenBetaCoverage() {
    const newPct = Math.min(97, openBetaPct + 3);
    setOpenBetaPct(newPct);
    logAction("OPENBETA COVERAGE UPDATED", `Coverage improved to ${newPct}%`);
    toast.success(`OpenBeta coverage now ${newPct}%`, { description: "Manual review of missing crags completed." });
  }

  // ---------------- STATS & CHART DATA ----------------
  const stats = {
    pendingPhotos: pendingPhotos.length,
    totalUsers: 14892,
    routesModeratedToday: 17,
    flaggedOpen: flagged.length,
    photosApprovedThisWeek: 184,
  };

  const growthData = [42, 61, 58, 87, 103, 124, 142]; // last 7 weeks fake signups
  const maxGrowth = Math.max(...growthData);

  // ---------------- RENDER ----------------
  return (
    <div className="pt-8 pb-20">
      {/* Top level powerful nav */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#2f5d3d]" />
            <h1 className="text-4xl font-semibold tracking-[-1.8px]">Admin Console</h1>
          </div>
          <p className="text-[#5c6666] mt-1">Trust &amp; Safety • Content Integrity • Data Health</p>
        </div>

        <div className="flex gap-2 text-sm">
          {(["dashboard", "photos", "routes", "moderation", "health"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`admin-btn px-5 py-2 rounded-full font-medium text-sm transition ${activeTab === t ? "admin-btn-primary" : "admin-btn-secondary"}`}
            >
              {t === "dashboard" && "Dashboard"}
              {t === "photos" && "Photo Approvals"}
              {t === "routes" && "Route Editor"}
              {t === "moderation" && "Flagged + UGC"}
              {t === "health" && "Data Health"}
            </button>
          ))}
        </div>
      </div>

      {/* SAFETY EMPHASIS BANNER */}
      <div className="mb-8 rounded-2xl bg-[#1c2526] text-white p-6 flex items-start gap-4">
        <Award className="w-6 h-6 mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <span className="font-semibold">Trust &amp; Safety is our #1 product feature.</span> Every photo below is reviewed by a human before it reaches the public — including families and children who use CragTrails to find safe climbing areas. Inaccurate route data can cause real harm. We treat every moderation decision with the gravity it deserves.
        </div>
      </div>

      {/* ====================== DASHBOARD ====================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Pending Photos", value: stats.pendingPhotos, icon: Camera, color: "text-amber-600" },
              { label: "Open Flags", value: stats.flaggedOpen, icon: AlertTriangle, color: "text-[#9f3a3a]" },
              { label: "Routes Fixed Today", value: stats.routesModeratedToday, icon: MapPin, color: "text-[#2f5d3d]" },
              { label: "Photos Approved (7d)", value: stats.photosApprovedThisWeek, icon: Check, color: "text-emerald-700" },
              { label: "Total Climbers", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-[#1f2525]" },
            ].map((stat, idx) => (
              <div key={idx} className="admin-card p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-[#5c6666]">{stat.label}</div>
                    <div className="stat-number text-4xl font-semibold tracking-tighter mt-1.5 tabular-nums">{stat.value}</div>
                  </div>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* User Growth */}
          <div className="admin-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="uppercase tracking-[1.5px] text-xs font-semibold text-[#5c6666]">User Growth</div>
                <div className="text-2xl font-semibold tracking-tight">+{growthData[growthData.length - 1]} new climbers this week</div>
              </div>
              <TrendingUp className="text-[#2f5d3d]" />
            </div>

            <div className="flex items-end gap-3 h-40 border-b border-[#e5e2d9] pb-3">
              {growthData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / maxGrowth) * 100}%` }}
                    className="chart-bar w-full min-h-[6px] rounded-t"
                    style={{ height: `${(val / maxGrowth) * 100}%` }}
                  />
                  <div className="text-[10px] text-[#5c6666] font-mono tabular-nums">W{i - 6}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-[#5c6666] mt-3">Strong consistent growth. Clean data &amp; safe photos are what keep families and serious climbers here.</div>
          </div>

          {/* Data Sources Health Preview */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="admin-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="text-[#2f5d3d]" />
                <div className="font-semibold">Mountain Project Sync</div>
              </div>
              <div className="text-sm space-y-2 text-[#3f4f3f]">
                <div>Last run: <span className="font-mono">{formatDate(healthMP.lastRun)}</span></div>
                <div>Routes synced: <span className="font-semibold tabular-nums">{healthMP.routes.toLocaleString()}</span></div>
                <div>Status: <span className="text-emerald-700 font-medium">HEALTHY</span></div>
              </div>
              <button onClick={triggerMPSync} className="admin-btn admin-btn-secondary mt-4 text-xs">Trigger Manual Sync</button>
            </div>

            <div className="admin-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="text-[#2f5d3d]" />
                <div className="font-semibold">OpenBeta Coverage</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-6xl font-semibold tabular-nums tracking-[-2px]">{openBetaPct}</div>
                <div className="text-xl text-[#5c6666]">%</div>
              </div>
              <div className="text-sm mt-1 text-[#5c6666]">of North American crags have high-quality route data.</div>
              <button onClick={improveOpenBetaCoverage} className="admin-btn admin-btn-secondary mt-5 text-xs">Review + Improve Coverage</button>
            </div>
          </div>

          {/* Recent Audit Snapshot */}
          <div className="admin-card p-6">
            <div className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Moderation Activity</div>
            <div className="space-y-2 text-sm">
              {audit.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex justify-between border-b border-[#f0f0eb] pb-2 last:border-0">
                  <div><span className="font-medium text-[#2f5d3d]">{entry.action}</span> — {entry.details}</div>
                  <div className="text-[#5c6666] text-xs tabular-nums">{timeAgo(entry.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================== PHOTO APPROVALS ====================== */}
      {activeTab === "photos" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-2xl font-semibold tracking-tight">Pending User Photos</div>
              <div className="text-[#5c6666]">Review before public. Protect the community.</div>
            </div>
            <div className="flex gap-3">
              <button onClick={bulkApproveVisible} className="admin-btn admin-btn-primary" disabled={filteredPhotos.length === 0}>
                Bulk Approve Visible ({filteredPhotos.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-4 top-3.5 text-[#5c6666] w-4 h-4" />
            <input
              value={photoSearch}
              onChange={(e) => setPhotoSearch(e.target.value)}
              placeholder="Search by crag, climber, or route..."
              className="admin-input pl-11"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {filteredPhotos.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#5c6666]">No pending photos match your search. Great work.</div>
              )}
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="photo-card group">
                  <div className="photo-thumb">
                    <img src={photo.url} alt={photo.caption} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <div className="status-badge badge-pending">PENDING REVIEW</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="font-semibold">{photo.user.name} <span className="font-normal text-[#5c6666]">{photo.user.handle}</span></div>
                      <div className="text-sm text-[#5c6666]">{photo.crag}{photo.routeName ? ` • ${photo.routeName}` : ""}</div>
                    </div>
                    <div className="text-sm italic leading-snug text-[#3f4f3f]">“{photo.caption}”</div>
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="text-[#5c6666] tabular-nums">{timeAgo(photo.uploadedAt)}</div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPhoto(photo)} className="admin-btn admin-btn-ghost px-3 py-1 text-xs flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Review</button>
                        <button onClick={() => approvePhoto(photo.id)} className="admin-btn admin-btn-primary text-xs px-3 py-1">Approve</button>
                        <button onClick={() => openReject(photo.id)} className="admin-btn admin-btn-danger text-xs px-3 py-1">Reject</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ====================== ROUTE EDITOR ====================== */}
      {activeTab === "routes" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Route list */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-3 px-1">
              <div className="font-semibold">Routes • Quick Fix Bad Data</div>
              <input value={routeSearch} onChange={e => setRouteSearch(e.target.value)} placeholder="Filter..." className="admin-input w-40 text-sm py-1" />
            </div>
            <div className="space-y-1.5">
              {filteredRoutes.map(route => (
                <button
                  key={route.id}
                  onClick={() => { setSelectedRouteId(route.id); setEditingRoute(null); }}
                  className={`w-full text-left admin-card p-4 transition flex justify-between items-center ${selectedRouteId === route.id ? "ring-1 ring-[#2f5d3d]" : ""}`}
                >
                  <div>
                    <div className="font-medium">{route.name} <span className="text-[#5c6666] font-normal">• {route.grade}</span></div>
                    <div className="text-xs text-[#5c6666]">{route.crag}</div>
                  </div>
                  <ChevronRight className="text-[#5c6666]" />
                </button>
              ))}
            </div>
            <button onClick={() => selectedRoute && quickFixExample(selectedRoute.id)} className="mt-4 text-xs admin-btn admin-btn-secondary w-full">Quick-fix safety notes on selected route</button>
          </div>

          {/* Editor + Preview */}
          <div className="lg:col-span-3 space-y-6">
            {selectedRoute && (
              <>
                <div className="admin-card p-7">
                  <div className="uppercase text-xs tracking-[1px] text-[#5c6666] mb-3">QUICK EDIT FORM — INSTANT IMPACT</div>
                  {!editingRoute ? (
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight">{selectedRoute.name}</h3>
                      <p className="text-[#5c6666]">{selectedRoute.crag} • {selectedRoute.grade} • {selectedRoute.type}</p>
                      <button onClick={() => startEditRoute(selectedRoute)} className="admin-btn admin-btn-primary mt-6">Edit This Route</button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold">Route Name</label>
                          <input value={editingRoute.name} onChange={e => updateEditingField("name", e.target.value)} className="admin-input mt-1" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold">Grade</label>
                          <input value={editingRoute.grade} onChange={e => updateEditingField("grade", e.target.value)} className="admin-input mt-1" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold">Description</label>
                        <textarea value={editingRoute.description} onChange={e => updateEditingField("description", e.target.value)} rows={3} className="admin-input mt-1 resize-y" />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#9f3a3a]">Safety Notes (critical)</label>
                        <textarea value={editingRoute.safetyNotes} onChange={e => updateEditingField("safetyNotes", e.target.value)} rows={2} className="admin-input mt-1 resize-y border-[#9f3a3a]/30" />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={saveRouteEdit} className="admin-btn admin-btn-primary flex-1">Save &amp; Publish Fix</button>
                        <button onClick={() => setEditingRoute(null)} className="admin-btn admin-btn-secondary flex-1">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Preview */}
                <div>
                  <div className="text-xs uppercase tracking-widest font-medium text-[#5c6666] mb-2 px-1">LIVE PUBLIC PREVIEW</div>
                  <div className="route-preview p-6">
                    <div className="font-semibold text-xl">{(editingRoute || selectedRoute).name}</div>
                    <div className="flex gap-3 text-sm mt-1 text-[#2f5d3d]">
                      <span>{(editingRoute || selectedRoute).grade}</span>
                      <span>•</span>
                      <span>{(editingRoute || selectedRoute).type}</span>
                    </div>
                    <p className="mt-4 leading-snug text-[#3f4f3f]">{(editingRoute || selectedRoute).description}</p>
                    <div className="mt-5 text-sm border-t pt-4 text-[#9f3a3a]">
                      <strong>Safety:</strong> {(editingRoute || selectedRoute).safetyNotes}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================== FLAGGED + UGC MODERATION ====================== */}
      {activeTab === "moderation" && (
        <div>
          <div className="mb-6">
            <div className="text-2xl font-semibold tracking-tight">Flagged Content &amp; User-Generated Moderation</div>
            <p className="text-[#5c6666]">All user reports + auto-flagged UGC. Every decision logged. Kids and families use this platform.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["all", "comment", "photo", "route_suggestion", "beta"].map((f) => (
              <button key={f} onClick={() => setModFilter(f as any)} className={`admin-btn text-sm ${modFilter === f ? "admin-btn-primary" : "admin-btn-secondary"}`}>
                {f === "all" ? "All" : f.replace("_", " ")}
              </button>
            ))}
            <input value={modSearch} onChange={e => setModSearch(e.target.value)} placeholder="Search flags..." className="admin-input flex-1 max-w-xs ml-auto text-sm" />
          </div>

          <div className="space-y-3">
            {filteredFlagged.length === 0 && <div className="text-[#5c6666] py-8 text-center">No matching flagged items. Excellent community.</div>}
            {filteredFlagged.map(item => (
              <div key={item.id} onClick={() => reviewFlagged(item)} className="flag-item admin-card p-5 cursor-pointer flex justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="status-badge badge-flagged">{item.type.toUpperCase()}</span>
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-xs text-[#5c6666]">{item.crag}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#3f4f3f] line-clamp-2">“{item.content}”</p>
                  <div className="text-xs mt-3 text-[#5c6666]">Reported by {item.reportedBy} • {timeAgo(item.reportedAt)} • Severity: <span className="font-medium text-[#9f3a3a]">{item.severity}</span></div>
                </div>
                <div className="text-right text-xs whitespace-nowrap pt-1 text-[#5c6666]">{item.reason}</div>
              </div>
            ))}
          </div>

          {/* Moderation action panel (modal-like) */}
          <AnimatePresence>
            {selectedFlagged && (
              <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-6" onClick={() => setSelectedFlagged(null)}>
                <div className="modal admin-card max-w-xl w-full p-8" onClick={e => e.stopPropagation()}>
                  <div className="uppercase text-xs tracking-[1px] text-[#9f3a3a]">MODERATION REVIEW</div>
                  <h3 className="text-2xl font-semibold tracking-tight mt-1">{selectedFlagged.title}</h3>
                  <p className="mt-3 bg-[#f8f7f4] p-4 rounded-lg text-sm">“{selectedFlagged.content}”</p>

                  <div className="my-6 text-sm">Reason reported: <span className="font-medium">{selectedFlagged.reason}</span></div>

                  <textarea 
                    placeholder="Internal moderator note (required for high severity)..." 
                    value={modNote} 
                    onChange={e => setModNote(e.target.value)} 
                    className="admin-input h-20 mb-6" 
                  />

                  <div className="flex gap-3">
                    <button onClick={() => resolveFlagged("Dismissed — no action needed")} className="admin-btn admin-btn-secondary flex-1">Dismiss Report</button>
                    <button onClick={() => resolveFlagged("Content removed + user warned")} className="admin-btn admin-btn-danger flex-1">Remove Content &amp; Warn User</button>
                    <button onClick={() => resolveFlagged("Content removed + escalated to permanent ban review")} className="admin-btn admin-btn-danger flex-1">Escalate to Ban</button>
                  </div>
                  <button onClick={() => setSelectedFlagged(null)} className="mt-4 text-sm text-[#5c6666] w-full">Close</button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ====================== DATA HEALTH ====================== */}
      {activeTab === "health" && (
        <div className="max-w-3xl space-y-8">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Data Sources Health</div>
            <div className="text-[#5c6666] mt-1">Reliable external data is foundational to climber trust.</div>
          </div>

          <div className="admin-card p-8 space-y-8">
            {/* MP Sync */}
            <div>
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2"><Database className="w-5 h-5" /> Mountain Project Sync</div>
                  <div className="text-sm mt-1 text-[#5c6666]">Last successful sync: <span className="font-mono">{formatDate(healthMP.lastRun)}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-700 font-semibold">HEALTHY</div>
                  <div className="text-xs text-[#5c6666] tabular-nums">{healthMP.routes.toLocaleString()} routes</div>
                </div>
              </div>
              <button onClick={triggerMPSync} className="admin-btn admin-btn-primary mt-5 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Force Manual Sync Now
              </button>
            </div>

            {/* OpenBeta */}
            <div className="border-t pt-8">
              <div className="font-semibold flex items-center gap-2 mb-2"><Award className="w-5 h-5" /> OpenBeta Coverage</div>
              <div className="text-7xl font-semibold tabular-nums tracking-[-3.5px]">{openBetaPct}<span className="text-4xl align-super text-[#5c6666]">%</span></div>
              <div className="text-[#5c6666]">of mapped crags have complete, high-quality route + photo data.</div>
              <button onClick={improveOpenBetaCoverage} className="admin-btn admin-btn-secondary mt-6">Manually Review &amp; Improve Coverage</button>
            </div>
          </div>

          <div className="safety-callout p-6 text-sm rounded-xl">
            Accurate external data syncs + human oversight of user content are what prevent bad beta and dangerous situations. Parents trust us because we take this seriously.
          </div>
        </div>
      )}

      {/* ====================== GLOBAL AUDIT LOG ====================== */}
      <div className="mt-14 pt-8 border-t">
        <div className="font-semibold text-lg tracking-tight mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Full Moderation Audit Log
          <span className="text-xs font-normal text-[#5c6666] ml-2">(Last 24 actions — immutable record)</span>
        </div>
        <div className="admin-card p-1 text-sm max-h-[280px] overflow-auto">
          {audit.length === 0 && <div className="p-6 text-[#5c6666]">No actions yet in this session.</div>}
          {audit.map((entry, index) => (
            <div key={entry.id} className="px-5 py-3 flex justify-between border-b last:border-0 border-[#f4f3ed] font-mono text-xs">
              <div className="text-[#5c6666] w-44 tabular-nums shrink-0">{formatDate(entry.timestamp)}</div>
              <div className="flex-1 text-[#1f2525]"><span className="font-semibold text-[#2f5d3d]">{entry.action}</span> — {entry.details}</div>
              <div className="text-right text-[#5c6666] w-40">{entry.actor}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PHOTO REVIEW MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="modal admin-card w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="grid md:grid-cols-2">
                <div className="bg-black">
                  <img src={selectedPhoto.url} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="p-8">
                  <div className="uppercase text-xs tracking-widest text-[#5c6666]">PHOTO REVIEW • PENDING</div>
                  <div className="text-2xl font-semibold mt-3 tracking-tight">{selectedPhoto.user.name}</div>
                  <div className="text-[#5c6666]">{selectedPhoto.user.handle} • {selectedPhoto.crag}</div>

                  <div className="my-6 text-[15px] leading-snug italic border-l-2 pl-4 border-[#2f5d3d]">“{selectedPhoto.caption}”</div>

                  <div className="space-y-4 text-sm">
                    <div><span className="font-medium text-[#5c6666]">Route:</span> {selectedPhoto.routeName || "—"}</div>
                    <div><span className="font-medium text-[#5c6666]">Uploaded:</span> {formatDate(selectedPhoto.uploadedAt)}</div>
                  </div>

                  <div className="flex gap-3 mt-9">
                    <button onClick={() => approvePhoto(selectedPhoto.id)} className="admin-btn admin-btn-primary flex-1 h-12">Approve — Publish Publicly</button>
                    <button onClick={() => { setSelectedPhoto(null); openReject(selectedPhoto.id); }} className="admin-btn admin-btn-danger flex-1 h-12">Reject with Reason</button>
                  </div>
                  <button onClick={() => setSelectedPhoto(null)} className="mt-5 text-sm block mx-auto text-[#5c6666]">Close review</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECT REASON MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-6" onClick={() => setShowRejectModal(null)}>
            <div className="modal admin-card w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
              <div className="font-semibold tracking-tight text-xl">Reject Photo</div>
              <p className="text-sm text-[#5c6666] mt-1">Please provide a clear reason. This is recorded permanently in the audit log.</p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Blurry image, no climbing context, inappropriate content, duplicate of existing photo..."
                className="admin-input h-28 mt-6"
              />

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowRejectModal(null)} className="admin-btn admin-btn-secondary flex-1">Cancel</button>
                <button onClick={confirmReject} className="admin-btn admin-btn-danger flex-1">Confirm Rejection</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
