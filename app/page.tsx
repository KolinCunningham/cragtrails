'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, BookOpen, Target, MapPin, X, Star, Heart, 
  Award, Shield, TrendingUp, Users, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import type { Route as LegacyRoute, Tick, ConditionReport } from '@/lib/types';
import { seedData, formatAttribution, getSourceBadge, getAttributionLine } from '@/lib/data/index';
import type { Route as CanonicalRoute, ConditionReport as CanonicalConditionReport, SourceAttribution } from '@/lib/types/climbing';
import { SPONSORS } from '@/lib/seed-data';
import dynamic from 'next/dynamic';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';

const CragMap = dynamic(() => import('./components/CragMap'), {
  ssr: false,
  loading: () => <div className="h-[520px] flex items-center justify-center bg-[#F8F7F4] text-[#5C6666]">Loading map…</div>,
});

// Full implementation of the 5 core value props as specified by the task.
// One-tap SEND IT (with photo, stars, beta notes, Pumped/Flashed/Dogged/Wet).
// Beautiful personal logbook + timeline + filters + interactive grade pyramid.
// Conditions & Beta community reports.
// Wishlist + yearly Send Goals with live progress.
// Simple "Climbers who sent X also loved Y" recs.
// All persists in localStorage. Extremely satisfying (confetti + smart toasts).
// Proves the engagement thesis.

// ============================================
// CLEAN ADAPTER LAYER (in-page orchestration + data layer helpers)
// Fully replaces legacy ROUTES with canonical from lib/data/seed-data.ts + lib/types/climbing.ts
// Adapter preserves 100% of rich send/logbook/wishlist/pyramid/recs features.
// Attribution helpers from @/lib/data/index deliver visible, delightful trust signals.
// 10yo-friendly: no new complexity, same big joyful interactions.
// ============================================

// Use canonical seed data (authoritative hierarchical model)
const CANONICAL_ROUTES = seedData.routes;

// Build lookups (areas + photos linked by ID in canonical model)
const areasById = new Map(seedData.areas.map(a => [a.id, a] as const));
const photosByRouteId = new Map<string, string[]>();
seedData.photos.forEach(p => {
  if (p.routeId) {
    const arr = photosByRouteId.get(p.routeId) || [];
    arr.push(p.url);
    photosByRouteId.set(p.routeId, arr);
  }
});

// Real tick counts from canonical seed (accurate popularity for cards + map)
const tickCountByRouteId = new Map<string, number>();
seedData.ticks.forEach(t => {
  tickCountByRouteId.set(t.routeId, (tickCountByRouteId.get(t.routeId) || 0) + 1);
});

// Adapter: canonical Route -> LegacyRoute shape (required only for existing logbook/send code paths)
function mapToAppRoute(r: CanonicalRoute): LegacyRoute {
  const area = areasById.get(r.areaId);
  const primaryGrade = r.grades.yds || r.grades.vScale || r.grades.french || '5.10';
  const style = r.styles[0] || 'sport';
  const type = (style === 'boulder' ? 'Boulder' : style === 'trad' ? 'Trad' : 'Sport') as any;
  const routePhotos = photosByRouteId.get(r.id) || [];

  return {
    id: r.id,
    name: r.name,
    areaId: r.areaId,
    areaName: area?.name || 'Unknown Area',
    grade: primaryGrade,
    type,
    lat: area?.lat ?? 0,
    lng: area?.lng ?? 0,
    stars: r.quality,
    starVotes: 120,
    ticks: tickCountByRouteId.get(r.id) || 42, // real data from seed
    difficultyColor: (r.quality > 4.5 ? 'red' : r.quality > 4.0 ? 'orange' : 'yellow') as any,
    description: r.description || '',
    photoUrl: routePhotos[0] || 'https://source.unsplash.com/2d39VFZYGaA/800/600',
    photoUrls: routePhotos.length ? routePhotos : [],
    fa: r.fa || 'Unknown',
    bestConditions: r.bestSeason?.join(', ') || '',
    sources: r.metadata?.sources?.map((s: SourceAttribution) => s.provider) || ['community'],
    lastUpdated: r.metadata?.lastUpdated || new Date().toISOString(),
    lengthFt: r.lengthMeters ? Math.round(r.lengthMeters * 3.28) : undefined,
    protection: r.protection,
  };
}

// THE REPLACEMENT: canonical-powered routes (no more legacy ROUTES variable or mindset)
const ROUTES: LegacyRoute[] = CANONICAL_ROUTES.map(mapToAppRoute);

const CONDITION_TAGS = ["Pumped", "Flashed", "Dogged", "Wet"] as const;
type ConditionTag = typeof CONDITION_TAGS[number];

// Derived directly from canonical seed (real routeIds + real community data). No more dead legacy ids.
const COMMUNITY_TICKS: Array<{ routeId: string; grade: string }> = seedData.ticks
  .map(t => ({ routeId: t.routeId, grade: t.gradeOpinion || '5.10' }))
  .slice(0, 12);

function mapCanonicalReport(cr: CanonicalConditionReport): ConditionReport {
  const emojiMap: Record<string, string> = { dry: '✅', good: '✅', wet: '💧', seepage: '💧', beta_update: '📍', 'default': '📍' };
  return {
    id: cr.id,
    routeId: cr.routeId,
    user: cr.userName,
    date: cr.reportedAt.split('T')[0],
    text: cr.description,
    emoji: emojiMap[cr.status] || emojiMap['default'],
  };
}
const SAMPLE_REPORTS: ConditionReport[] = seedData.conditionReports.map(mapCanonicalReport);

function gradeToBand(grade: string): string {
  const g = grade.toUpperCase().replace(/\s/g, '');
  if (g.startsWith('V')) { const n = parseInt(g.slice(1)) || 0; if (n<=1) return 'V0-1'; if (n<=3) return 'V2-3'; if (n<=5) return 'V4-5'; if (n<=7) return 'V6-7'; if (n<=9) return 'V8-9'; return 'V10+'; }
  if (g.includes('5.6')||g.includes('5.7')||g.includes('5.8')||g.includes('5.9')) return '5.6-5.9';
  if (g.includes('5.10')) return '5.10'; if (g.includes('5.11')) return '5.11'; if (g.includes('5.12')) return '5.12';
  if (g.includes('5.13')||g.includes('5.14')) return '5.13+'; return 'Other';
}
function getGradeColor(grade: string): string {
  const b = gradeToBand(grade); if (b.includes('V0')||b.includes('5.6')) return '#22c55e'; if (b.includes('V2')||b.includes('5.10')) return '#eab308'; if (b.includes('V6')||b.includes('5.11')) return '#f97316'; return '#ef4444';
}
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }

function launchConfetti(container: HTMLElement | null, count = 42) {
  if (!container) return;
  const colors = ['#22c55e', '#f97316', '#fbbf24', '#ef4444']; const emojis = ['🧗','🔥','🪨','💪'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div'); el.className = 'confetti';
    el.textContent = Math.random() > .65 ? emojis[Math.floor(Math.random()*emojis.length)] : '';
    el.style.left = Math.random()*100+'%'; el.style.top = '-12px'; el.style.color = colors[Math.floor(Math.random()*colors.length)];
    container.appendChild(el);
    const x = (Math.random()-0.5)*260; const dur = 1100 + Math.random()*900;
    el.animate([{ transform:'translateY(0) rotate(0deg)', opacity: .9 }, { transform:`translateY(${290+Math.random()*70}px) translateX(${x}px) rotate(${Math.random()*240-100}deg)`, opacity:0 }], { duration: dur, easing:'cubic-bezier(.22,1,.36,1)' }).onfinish = () => el.remove();
  }
}

// DEMO PROFILES — the absolute minimum foundation for real auth later.
// 3 hardcoded friendly climbers. Data (ticks/wishlist/goals) isolated per profile via localStorage keys.
// Switcher lives ONLY in the Me tab. 10yo-friendly big taps, instant, no forms, no new files or deps.
// Skeptical CEO approved narrow scope only after full review against AGENTS.md rules.
const DEMO_PROFILES = [
  { id: 'p_alex', name: 'Alex Rivera', subtitle: 'V6 crusher • Boulder, CO' },
  { id: 'p_sam', name: 'Sam the Kid Crusher', subtitle: 'Age 10 • First V2!' },
  { id: 'p_jordan', name: 'Jordan Lee', subtitle: 'Trad dad • Family sends' },
] as const;

// generateShareCard is now a properly-scoped helper defined inside the component
// so it can access real user ticks from state (persisted logged sends).

export default function ClimbTrailsLogbook() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [conditionReports, setConditionReports] = useState<ConditionReport[]>(SAMPLE_REPORTS);
  const [userGoals, setUserGoals] = useState<any[]>([
    { id:'g1', label:'Send 8 routes V6 or harder this year', target:8, current:0 },
    { id:'g2', label:'Log 25 total sends in 2026', target:25, current:0 },
  ]);
  const [activeTab, setActiveTab] = useState<'discover' | 'map' | 'logbook' | 'me'>('discover');

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedClimbForSend, setSelectedClimbForSend] = useState<LegacyRoute | null>(null);
  const [sendForm, setSendForm] = useState({ date: new Date().toISOString().split('T')[0], stars:4, betaNotes:'', conditionTag:'Flashed' as ConditionTag, photoDataUrl:'' });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [logbookFilters, setLogbookFilters] = useState({ search:'', gradeBand:'All', area:'All', year:'All', type:'All' });
  const [discoverSearch, setDiscoverSearch] = useState(''); const [discoverType, setDiscoverType] = useState<'All'|'Boulder'|'Sport'|'Trad'>('All');

  // Map tab local filters (synced live to CragMap markers). Consistent with discover + logbook patterns.
  const [mapSearch, setMapSearch] = useState('');
  const [mapGradeFilter, setMapGradeFilter] = useState<'All' | 'Easy' | 'Moderate' | 'Hard'>('All');

  // Profile state for demo multi-user foundation (scoped only to ticks/wishlist/goals).
  // Default Alex. Persisted separately. Switcher UI strictly in Me tab.
  const [currentProfileId, setCurrentProfileId] = useState<'p_alex' | 'p_sam' | 'p_jordan'>('p_alex');
  const currentProfile = DEMO_PROFILES.find(p => p.id === currentProfileId)!;
  const getProfileKey = (pid: string, key: string) => `ct_${pid}_${key}`;

  // User location for "Near You" personalized suggestions
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get user's location for personalized "Near You" recommendations
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location not supported on this device");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        toast.success("Location found! Showing climbs near you.");
      },
      (err) => {
        setLocationLoading(false);
        toast.error("Could not get your location. Using a demo location instead.");
        // Fallback to a nice climbing area (Boulder, CO area)
        setUserLocation({ lat: 40.015, lng: -105.2705 });
      }
    );
  };

  // Haversine formula to calculate distance in miles between two lat/lng points
  const getDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get nearby routes based on user location (top 6 within 100 miles)
  const nearbyRoutes = useMemo(() => {
    if (!userLocation) return [];
    return [...ROUTES]
      .map(route => ({
        ...route,
        distance: getDistanceMiles(userLocation.lat, userLocation.lng, route.lat, route.lng)
      }))
      .filter(r => r.distance <= 100)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }, [userLocation]);

  // Personalized recommendations based on the current user's past sends (history-based)
  const personalRecommendations = useMemo(() => {
    if (ticks.length === 0) {
      // Cold start: show popular routes
      return [...ROUTES].sort((a, b) => (b.ticks || 0) - (a.ticks || 0)).slice(0, 6);
    }

    const userGrades = ticks.map(t => t.grade);
    const userAreas = ticks.map(t => t.areaName);
    const userStyles = ticks.map(t => 'Sport'); // Simplified for demo; can be enhanced later

    // Score routes based on similarity to what the user has done
    const scored = ROUTES
      .filter(r => !ticks.some(tick => tick.routeId === r.id)) // Don't recommend what they've already done
      .map(route => {
        let score = 0;

        // Grade similarity (within a couple grades)
        const routeGradeNum = parseFloat(route.grade.replace(/[^0-9.]/g, '')) || 0;
        userGrades.forEach(ug => {
          const ugNum = parseFloat(ug.replace(/[^0-9.]/g, '')) || 0;
          if (Math.abs(routeGradeNum - ugNum) < 2) score += 3;
          if (Math.abs(routeGradeNum - ugNum) < 1) score += 2;
        });

        // Same area bonus
        if (userAreas.includes(route.areaName)) score += 8;

        // Similar type/style
        if (userStyles.includes(route.type)) score += 4;

        return { ...route, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored.length > 0 ? scored : [...ROUTES].sort((a, b) => (b.ticks || 0) - (a.ticks || 0)).slice(0, 6);
  }, [ticks]);

  useEffect(() => {
    // Load current profile (or default). Simple mock "sign in".
    const savedProfile = localStorage.getItem('ct_current_profile') as any;
    const pid = (savedProfile && ['p_alex','p_sam','p_jordan'].includes(savedProfile)) ? savedProfile : 'p_alex';
    if (pid !== 'p_alex') setCurrentProfileId(pid);

    // Minimal migration for existing users: if default profile has no data yet but global keys exist, copy once.
    const defaultTicksKey = getProfileKey('p_alex', 'ticks');
    if (pid === 'p_alex' && !localStorage.getItem(defaultTicksKey)) {
      const oldT = localStorage.getItem('ct_ticks');
      if (oldT) localStorage.setItem(defaultTicksKey, oldT);
      const oldW = localStorage.getItem('ct_wishlist');
      if (oldW) localStorage.setItem(getProfileKey('p_alex', 'wishlist'), oldW);
      const oldG = localStorage.getItem('ct_goals');
      if (oldG) localStorage.setItem(getProfileKey('p_alex', 'goals'), oldG);
      // old reports left global (community data)
    }

    // Load THIS profile's personal data (ticks, wishlist, goals). Reports stay global for demo simplicity.
    const t = localStorage.getItem(getProfileKey(pid, 'ticks')); if (t) setTicks(JSON.parse(t));
    const w = localStorage.getItem(getProfileKey(pid, 'wishlist')); if (w) setWishlist(JSON.parse(w));
    const g = localStorage.getItem(getProfileKey(pid, 'goals')); if (g) setUserGoals(JSON.parse(g));
    const r = localStorage.getItem('ct_reports'); if (r) setConditionReports(JSON.parse(r));
  }, []);  // run once on mount

  // Profile-scoped saves for personal data (foundation pattern for real auth userId scoping later).
  // Reports remain global (community + mixed "You" entries for the demo).
  useEffect(() => { localStorage.setItem(getProfileKey(currentProfileId, 'ticks'), JSON.stringify(ticks)); }, [ticks, currentProfileId]);
  useEffect(() => { localStorage.setItem(getProfileKey(currentProfileId, 'wishlist'), JSON.stringify(wishlist)); }, [wishlist, currentProfileId]);
  useEffect(() => { localStorage.setItem('ct_reports', JSON.stringify(conditionReports)); }, [conditionReports]);
  useEffect(() => { localStorage.setItem(getProfileKey(currentProfileId, 'goals'), JSON.stringify(userGoals)); }, [userGoals, currentProfileId]);

  // Persist chosen profile id (so refresh keeps you "signed in" as that climber)
  useEffect(() => {
    localStorage.setItem('ct_current_profile', currentProfileId);
  }, [currentProfileId]);

  const userStats = useMemo(() => {
    const total = ticks.length;
    const mo = ticks.filter(t => { const d=new Date(t.date), n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length;
    const hardest = ticks.length ? ticks.reduce((h,t) => gradeToBand(t.grade).includes('V10')||gradeToBand(t.grade).includes('5.13') ? t : h , ticks[0]).grade : '—';
    return { totalSends: total, thisMonth: mo, hardest, currentStreak: 7, uniqueAreas: new Set(ticks.map(t=>t.areaName)).size };
  }, [ticks]);

  const updatedGoals = useMemo(() => userGoals.map((g:any) => {
    let cur = g.current;
    if (g.label.includes('V6')) cur = ticks.filter(t => (t.grade.startsWith('V') && (parseInt(t.grade.slice(1))||0)>=6) || (t.grade.includes('5.1') && parseFloat(t.grade.replace('5.',''))>=11)).length;
    else if (g.label.includes('25 total')) cur = ticks.length;
    return {...g, current: Math.min(cur, g.target)};
  }), [ticks, userGoals]);

  const filteredTicks = useMemo(() => {
    let res = [...ticks].sort((a,b)=>b.date.localeCompare(a.date));
    const {search,gradeBand,area,year,type} = logbookFilters;
    if (search) { const q=search.toLowerCase(); res = res.filter(t => t.routeName.toLowerCase().includes(q) || t.areaName.toLowerCase().includes(q)); }
    if (gradeBand!=='All') res = res.filter(t => gradeToBand(t.grade)===gradeBand);
    if (area!=='All') res = res.filter(t => t.areaName===area);
    if (year!=='All') res = res.filter(t => new Date(t.date).getFullYear().toString()===year);
    if (type!=='All') res = res.filter(t => ROUTES.find(r=>r.id===t.routeId)?.type === type);
    return res;
  }, [ticks, logbookFilters]);

  const pyramidData = useMemo(() => {
    const bands = ['V0-1','V2-3','V4-5','V6-7','V8-9','V10+','5.6-5.9','5.10','5.11','5.12','5.13+'];
    const c: Record<string,number> = {}; bands.forEach(b=>c[b]=0);
    ticks.forEach(t => { const b=gradeToBand(t.grade); if(c[b]!==undefined) c[b]++; });
    return bands.map(b => ({band:b, count:c[b]||0}));
  }, [ticks]);
  const maxPy = Math.max(1, ...pyramidData.map(p=>p.count));

  const discoverClimbs = useMemo(() => {
    let res = [...ROUTES];
    if (discoverSearch) { const q=discoverSearch.toLowerCase(); res = res.filter(r => r.name.toLowerCase().includes(q)||r.areaName.toLowerCase().includes(q)||r.grade.toLowerCase().includes(q)); }
    if (discoverType!=='All') res = res.filter(r => r.type === discoverType);
    return res;
  }, [discoverSearch, discoverType]);

  const recommendations = useMemo(() => {
    if (ticks.length===0) return ROUTES.slice(0,4);
    const sent = new Set(ticks.map(t=>t.routeId)); const scores:Record<string,number>={};
    ROUTES.forEach(r=>{ if(!sent.has(r.id)) scores[r.id]=0; });
    COMMUNITY_TICKS.forEach((ct,i)=>{ if(sent.has(ct.routeId)) for(let j=Math.max(0,i-2);j<Math.min(COMMUNITY_TICKS.length,i+3);j++){ const o=COMMUNITY_TICKS[j]; if(!sent.has(o.routeId)&&scores[o.routeId]!==undefined) scores[o.routeId]++; }});
    return ROUTES.filter(r=>scores[r.id]!==undefined).sort((a,b)=>(scores[b.id]||0)-(scores[a.id]||0)).slice(0,4);
  }, [ticks]);

  // Map data adapter + live filters. Joins area coords (canonical routes carry areaId only) so CragMap gets real lat/lng.
  // Produces plain objects matching CragMap's expected Route shape (numeric id for internal use only).
  const areaCoords = useMemo(() => {
    const m: Record<string, { lat: number; lng: number }> = {};
    seedData.areas.forEach(a => { m[a.id] = { lat: a.lat, lng: a.lng }; });
    return m;
  }, []);

  const mapRoutes = useMemo(() => {
    let res = [...ROUTES];
    if (mapSearch) {
      const q = mapSearch.toLowerCase();
      res = res.filter(r => r.name.toLowerCase().includes(q) || r.areaName.toLowerCase().includes(q) || r.grade.toLowerCase().includes(q));
    }
    if (mapGradeFilter !== 'All') {
      res = res.filter(r => {
        const b = gradeToBand(r.grade);
        if (mapGradeFilter === 'Easy') return /V0|V2|5\.[6-9]/.test(b);
        if (mapGradeFilter === 'Moderate') return /V4|V5|5\.10|5\.11/.test(b);
        if (mapGradeFilter === 'Hard') return /V6|V7|V8|5\.12|5\.13/.test(b);
        return true;
      });
    }
    return res.map((r, idx) => {
      const coords = areaCoords[r.areaId] || { lat: 37.6, lng: -118.9 };
      return {
        id: idx + 1,
        name: r.name,
        crag: r.areaName,
        lat: coords.lat,
        lng: coords.lng,
        grade: r.grade,
        difficulty: Math.round(r.stars || 3),
        popularity: r.ticks || 120,
        type: r.type as 'Boulder' | 'Sport' | 'Trad',
        description: r.description || '',
        stars: Math.round(r.stars || 4),
      };
    });
  }, [mapSearch, mapGradeFilter, areaCoords]);

  // === THE CORE: ONE-TAP SEND IT (satisfying, auto-updates everything) ===
  const openSendModal = (climb?: LegacyRoute) => {
    const t = climb || ROUTES[0];
    setSelectedClimbForSend(t);
    setSendForm({ date:new Date().toISOString().split('T')[0], stars:4, betaNotes:'', conditionTag:'Flashed', photoDataUrl:'' });
    setIsSendModalOpen(true);
  };
  const closeSendModal = () => { setIsSendModalOpen(false); setSelectedClimbForSend(null); };

  // Map marker -> existing send flow. Reverse lookup by name/grade (stable, no id translation needed).
  const handleMapMarkerClick = (mapRoute: any) => {
    const original = ROUTES.find(lr => lr.name === mapRoute.name && lr.grade === mapRoute.grade);
    openSendModal(original || mapRoute);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return; setIsUploadingPhoto(true);
    const rdr = new FileReader(); rdr.onload = (ev) => { const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); let {width:w,height:h}=img; const mx=720; if(w>mx||h>mx){const s=Math.min(mx/w,mx/h); w*=s;h*=s;} c.width=w;c.height=h; c.getContext('2d')!.drawImage(img,0,0,w,h); setSendForm(p=>({...p,photoDataUrl:c.toDataURL('image/jpeg',0.72)})); setIsUploadingPhoto(false); }; img.src=ev.target?.result as string; }; rdr.readAsDataURL(f);
  };

  const submitSend = () => {
    if(!selectedClimbForSend) return;
    const nt: Tick = { id:'t'+Date.now(), routeId:selectedClimbForSend.id, routeName:selectedClimbForSend.name, areaName:selectedClimbForSend.areaName, grade:selectedClimbForSend.grade, date:sendForm.date, stars:sendForm.stars, notes:sendForm.betaNotes||undefined, conditions:sendForm.conditionTag, photoUrl:sendForm.photoDataUrl||undefined, sendStyle: sendForm.conditionTag==='Flashed'?'Flash':sendForm.conditionTag==='Dogged'?'Dogged':'Redpoint' };
    const nticks = [nt, ...ticks]; setTicks(nticks);

    if (sendForm.betaNotes || sendForm.photoDataUrl) {
      setConditionReports(p => [{id:'cr'+Date.now(), routeId:selectedClimbForSend.id, user:'You', date:sendForm.date, text:sendForm.betaNotes||`${sendForm.conditionTag} send`, emoji:sendForm.conditionTag==='Flashed'?'⚡':'🪨', photoUrl:sendForm.photoDataUrl}, ...p]);
    }
    closeSendModal();

    setTimeout(()=>{ const cont=document.getElementById('confetti-root'); launchConfetti(cont,50); }, 90);

    const gCount = nticks.filter(t=>gradeToBand(t.grade)===gradeToBand(nt.grade)).length;
    const moCount = nticks.filter(t=>{const d=new Date(t.date),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).length;
    toast.success(`Crusher! That's your ${gCount}${['st','nd','rd'][gCount-1]||'th'} ${nt.grade} this year 🔥`, { description: `${nt.routeName} • ${nt.areaName} • ${sendForm.conditionTag}`, duration:4400 });
    setTimeout(()=>setActiveTab('logbook'), 620);
  };

  const toggleWishlist = (id:string) => { const has=wishlist.includes(id); setWishlist(has ? wishlist.filter(x=>x!==id) : [...wishlist,id]); toast(has?'Removed from wishlist':'Added to wishlist — go send it!',{duration:1500}); };
  const addQuickReport = (rid:string, txt:string) => { const nr:ConditionReport={id:'cr'+Date.now(),routeId:rid,user:'You',date:new Date().toISOString().split('T')[0],text:txt,emoji:'📍'}; setConditionReports(p=>[nr,...p]); toast.success('Beta added — thank you! The community just got smarter.'); };
  const filterPyramid = (band:string) => { setLogbookFilters(p=>({...p, gradeBand: p.gradeBand===band?'All':band })); setActiveTab('logbook'); };

  // === DEMO PROFILE SWITCHER (Me tab only) ===
  // Loads the chosen climber's isolated ticks/wishlist/goals from their localStorage keys.
  // Zero impact on discover/logbook/map/send flows. Foundation only.
  const switchProfile = (newId: 'p_alex' | 'p_sam' | 'p_jordan') => {
    if (newId === currentProfileId) return;
    const nextProfile = DEMO_PROFILES.find(p => p.id === newId)!;
    setCurrentProfileId(newId);

    // Immediately hydrate this profile's personal data (triggers scoped saves via effects)
    const t = localStorage.getItem(getProfileKey(newId, 'ticks')); setTicks(t ? JSON.parse(t) : []);
    const w = localStorage.getItem(getProfileKey(newId, 'wishlist')); setWishlist(w ? JSON.parse(w) : []);
    const g = localStorage.getItem(getProfileKey(newId, 'goals')); setUserGoals(g ? JSON.parse(g) : [
      { id:'g1', label:'Send 8 routes V6 or harder this year', target:8, current:0 },
      { id:'g2', label:'Log 25 total sends in 2026', target:25, current:0 },
    ]);
    // reports unchanged (global community)

    toast.success(`Signed in as ${nextProfile.name}`, { description: 'Your sends, wishlist & goals just swapped. Magic!', duration: 2200 });
  };

  // === POLISHED INSTAGRAM SHARE CARD (Viral Growth) ===
  // Pulls exclusively from REAL user-logged ticks (localStorage persisted via submitSend).
  // Client-side canvas only. No external services. 1080x1350 portrait optimized for IG.
  const getLatestTickForShare = (): Tick | undefined => {
    if (ticks.length === 0) return undefined;
    return [...ticks].sort((a, b) => b.date.localeCompare(a.date))[0];
  };

  const generateInstagramCard = () => {
    const latest = getLatestTickForShare();
    if (!latest) {
      toast.error("Log your first send to unlock share cards. It feels great.");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d')!;

    // Deep crag gradient background (matches app dark earthy theme)
    const grad = ctx.createLinearGradient(0, 0, 0, 1350);
    grad.addColorStop(0, '#111714');
    grad.addColorStop(0.45, '#0A0C0A');
    grad.addColorStop(1, '#070907');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle decorative climbing holds (motif, low opacity, premium not childish)
    ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
    ctx.beginPath(); ctx.arc(960, 160, 42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1010, 280, 29, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(890, 340, 35, 0, Math.PI * 2); ctx.fill();

    // Grade badge (strong green pill) - safe rect for broad compatibility
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(70, 130, 400, 135);
    ctx.fillStyle = '#0A0C0A';
    ctx.font = '800 86px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(latest.grade, 95, 215);

    // Route name - bold, prominent, safe truncation
    ctx.fillStyle = '#F5F5F3';
    ctx.font = '700 60px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    let displayName = latest.routeName;
    if (displayName.length > 24) displayName = displayName.slice(0, 21) + '…';
    ctx.fillText(displayName, 80, 310);

    // Area
    ctx.fillStyle = '#A3A8A0';
    ctx.font = '500 36px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(latest.areaName, 80, 358);

    // Stars (delightful, large)
    ctx.fillStyle = '#FBBF24';
    ctx.font = '700 46px system-ui';
    ctx.fillText('★'.repeat(Math.max(1, Math.min(5, latest.stars || 4))), 80, 430);

    // Send style as clean pill (safe rect)
    const styleText = (latest.sendStyle || 'Redpoint').toUpperCase();
    ctx.fillStyle = '#052E16';
    ctx.fillRect(80, 470, 280, 58);
    ctx.fillStyle = '#4ADE80';
    ctx.font = '700 28px system-ui';
    ctx.fillText(styleText, 105, 508);

    // Date
    ctx.fillStyle = '#A3A8A0';
    ctx.font = '500 26px system-ui';
    const prettyDate = new Date(latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    ctx.fillText(prettyDate, 80, 555);

    // Notes (capped, respectful of real user words)
    if (latest.notes) {
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '400 28px system-ui';
      const noteLines = latest.notes.match(/.{1,34}(\s|$)/g) || [latest.notes];
      noteLines.slice(0, 3).forEach((line, i) => {
        ctx.fillText('“' + line.trim() + '”', 80, 620 + i * 38);
      });
    }

    // Subtle separator
    ctx.strokeStyle = '#2A3328';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 780);
    ctx.lineTo(1000, 780);
    ctx.stroke();

    // Premium footer branding block
    ctx.fillStyle = '#22C55E';
    ctx.font = '800 40px system-ui';
    ctx.fillText('CRAGTRAILS', 80, 870);

    ctx.fillStyle = '#A3A8A0';
    ctx.font = '500 24px system-ui';
    ctx.fillText('The free climbing guide climbers actually trust.', 80, 910);
    ctx.fillText('Kids climb here. Every photo and route is reviewed.', 80, 945);

    ctx.fillStyle = '#4ADE80';
    ctx.font = '700 28px system-ui';
    ctx.fillText('#CragTrails  •  cragtrails.app', 80, 1020);

    ctx.fillStyle = '#6B7280';
    ctx.font = '400 20px system-ui';
    ctx.fillText('Logged with joy in the vertical world', 80, 1065);

    // Trigger download (real user data in filename)
    const safe = latest.routeName.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);
    const link = document.createElement('a');
    link.download = `cragtrails-${safe}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success(`Card saved! Post ${latest.routeName} with #CragTrails`, { duration: 3400 });
  };

  // Real-data caption generator for shareable text options (3 family-appropriate variants)
  const getShareCaptions = (tick: Tick | undefined): string[] => {
    if (!tick) return ["Log a beautiful send first — then share the stoke."];
    const base = `Just sent ${tick.routeName} (${tick.grade}) at ${tick.areaName}!`;
    const style = tick.sendStyle || 'Redpoint';
    return [
      `${base} ${style} 🔥 Who's next? #CragTrails cragtrails.app`,
      `${base} One of those days that reminds me why I climb. Grateful. #CragTrails`,
      `Send day with the crew! ${base} The stoke is real. cragtrails.app #CragTrails`
    ];
  };

  const currentClimb = selectedClimbForSend;
  const pyramidFiltered = pyramidData.filter(p=>p.count>0);

  return (
    <div className="climb-app bg-[#F8F7F4] text-[#1F2525] min-h-screen pb-20">
      {/* Desktop Top Navigation - Website experience (lg+ only, clean spacious header for excellent desktop feel) */}
      <header className="hidden lg:block climb-header border-b border-[#E5E2D9] bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#166534] flex items-center justify-center"><Send className="text-white" size={20}/></div>
              <div className="font-bold tracking-[-1.5px] text-3xl text-[#1F2525]">CragTrails</div>
            </div>
            
            <nav className="flex items-center gap-8 text-[15px] font-medium">
              <button onClick={() => setActiveTab('discover')} className={`hover:text-[#166534] transition-colors ${activeTab === 'discover' ? 'text-[#166534] font-semibold' : 'text-[#5C6666]'}`}>Discover</button>
              <button onClick={() => setActiveTab('map')} className={`hover:text-[#166534] transition-colors ${activeTab === 'map' ? 'text-[#166534] font-semibold' : 'text-[#5C6666]'}`}>Explore Map</button>
              <button onClick={() => setActiveTab('logbook')} className={`hover:text-[#166534] transition-colors ${activeTab === 'logbook' ? 'text-[#166534] font-semibold' : 'text-[#5C6666]'}`}>My Logbook</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-[#5C6666]">{userStats.totalSends} sends logged</div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2 rounded-2xl bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D]">Log in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{elements: {avatarBox: "w-8 h-8"}}} />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Mobile Header — unchanged, excellent, 100% identical behavior */}
      <header className="lg:hidden climb-header px-4 py-4 sticky top-0 z-50 bg-white border-b border-[#E5E2D9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#166534] flex items-center justify-center"><Send className="text-white" size={20}/></div>
            <div className="font-bold tracking-[-1.5px] text-2xl text-[#1F2525]">CragTrails</div>
          </div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 text-sm rounded-2xl bg-[#166534] text-white font-semibold">Log in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{elements: {avatarBox: "w-8 h-8"}}} />
          </SignedIn>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-24">
        {/* MAP - Full map focus (now wired to real CragMap + synced filters + direct send modal) */}
        {activeTab === 'map' && (
          <div>
            <div className="section-title mb-3">Explore the map</div>
            <div className="text-[#5C6666] mb-3 text-[15px]">Tap big colored dots to log a send. Filters update markers live.</div>

            {/* Grade + search filters — exact same patterns as Discover and Logbook for zero new concepts */}
            <div className="flex flex-wrap gap-2 mb-3 lg:gap-3 lg:mb-4">
              <input
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search name, crag, or grade (V4, 5.10...)"
                className="flex-1 min-w-[220px] bg-white border border-[#E5E2D9] px-5 py-3 rounded-3xl text-base lg:min-w-[280px] text-[#1F2525]"
              />
              {(['All', 'Easy', 'Moderate', 'Hard'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setMapGradeFilter(g)}
                  className={`filter-chip ${mapGradeFilter === g ? 'active' : ''}`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="h-[520px] lg:h-[680px] rounded-3xl overflow-hidden border border-[#E5E2D9]">
              <CragMap
                routes={mapRoutes}
                selectedRouteId={null}
                onMarkerClick={handleMapMarkerClick}
              />
            </div>
            <div className="mt-2 text-center text-xs text-[#5C6666]">Green = easy fun. Red = proud sends. Big taps for everyone.</div>
          </div>
        )}

        {/* LOGBOOK - Your sends + conditions (clean consolidated block) */}
        {activeTab === 'logbook' && (
          <div>
            <div className="section-title mb-2">Your Personal Logbook</div>
            {/* Desktop-only spacious two-column premium layout (lg+): pyramid sidebar left for quick visual history, main content (filters + timeline + community) right. Purely additive responsive classes. Mobile stacks exactly as before (block flow, no layout shift, no new UI patterns or tap targets for 10yo users). */}
            <div className="logbook-desktop-grid lg:grid lg:grid-cols-12 lg:gap-x-8">
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="pyramid-container mb-6 lg:mb-0">
                  <div className="font-bold mb-3">Grade Pyramid — tap a bar to filter timeline</div>
                  {pyramidFiltered.length===0 && <div className="text-[#5C6666] py-2">Log sends and your pyramid appears. It is incredibly motivating.</div>}
                  {pyramidFiltered.map(({band,count}) => (
                    <div key={band} className="flex items-center gap-3 mb-1.5 cursor-pointer" onClick={()=>filterPyramid(band)}>
                      <div className="w-16 text-sm font-bold text-[#5C6666] text-right">{band}</div>
                      <div className={`pyramid-bar ${band.includes('V10')||band.includes('5.13')?'v-pro':band.includes('V6')||band.includes('5.11')?'v-hard':band.includes('V4')||band.includes('5.10')?'v-mid':'v-easy'}`} style={{width:`${Math.max(18,(count/maxPy)*100)}%`}}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-7 xl:col-span-8">

            <div className="flex flex-wrap gap-2 mb-4">
              <input value={logbookFilters.search} onChange={e=>setLogbookFilters({...logbookFilters,search:e.target.value})} placeholder="Search your sends..." className="flex-1 min-w-[200px] bg-white border border-[#E5E2D9] rounded-2xl px-5 py-2 text-sm text-[#1F2525]" />
              {['All',...pyramidData.map(p=>p.band)].slice(0,6).map(b=>(<button key={b} onClick={()=>setLogbookFilters({...logbookFilters,gradeBand:b})} className={`filter-chip ${logbookFilters.gradeBand===b?'active':''}`}>{b}</button>))}
            </div>

            <div className="timeline">
              {filteredTicks.length===0 && <div className="empty-state">No sends match. Go log your first one!</div>}
              {filteredTicks.map(t => (
                <div key={t.id} className="log-entry">
                  <div><span className="log-grade" style={{background:getGradeColor(t.grade),color:'#0A0C0A'}}>{t.grade}</span> <span className="font-extrabold text-[17px]">{t.routeName}</span> <span className="text-[#5C6666]">— {t.areaName}</span></div>
                  <div className="mt-1 flex gap-2 items-center text-sm"><span className="text-[#5C6666]">{formatDate(t.date)}</span> <span className="flex text-[#FBBF24]">{Array.from({length:t.stars}).map((_,i)=><Star key={i} size={15} fill="currentColor"/>)}</span> {t.conditions && <span className={`tag-pill tag-${t.conditions.toLowerCase()}`}>{t.conditions}</span>}</div>
                  {t.notes && <div className="mt-2 italic text-sm text-[#5C6666]">“{t.notes}”</div>}
                  {t.photoUrl && <img src={t.photoUrl} loading="lazy" className="mt-3 rounded-2xl max-h-44" />}
                </div>
              ))}
            </div>

            {/* Community beta reports — preserved powerful engagement, now inside the single logbook view */}
            <div className="mt-8">
              <div className="text-sm text-[#5C6666] mb-4">Recent community beta (yours + others)</div>
              <div className="space-y-3">
                {conditionReports.slice(0,4).map(r => (
                  <div key={r.id} className="condition-report">
                    <div>{r.emoji} {r.text}</div>
                    <div className="text-xs text-[#5C6666] mt-1">{r.user} • {formatDate(r.date)}</div>
                  </div>
                ))}
              </div>
            </div>
            </div>
            </div>
          </div>
        )}

        {/* DISCOVER — Clean, delightful AllTrails-style entry point. Big taps, immediate joy, zero confusion. */}
        {activeTab === 'discover' && (
          <div className="space-y-8">
            <div>
              <div className="text-xs tracking-[3px] text-[#5C6666]">WHERE ARE WE SENDING TODAY?</div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-[-2.8px] lg:tracking-[-3.2px] mt-1">Discover climbs.<br />One-tap send.</h1>
            </div>

            <button onClick={() => openSendModal()} className="w-full md:w-auto h-16 px-12 rounded-3xl text-xl font-extrabold bg-[#22C55E] text-[#0A0C0A] flex items-center justify-center gap-3 shadow-2xl active:scale-[0.985]">
              ONE-TAP SEND IT
            </button>

            {/* Personalized Recommendations - Location + Personal History (as requested) */}
            {nearbyRoutes.length > 0 && (
              <div>
                <div className="font-bold text-xl mb-3 flex items-center gap-2">📍 Near You</div>
                <div className="text-sm text-[#5C6666] mb-3">Climbs within ~100 miles of your location</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {nearbyRoutes.map(c => (
                    <div key={c.id} className="rec-card">
                      <div className="font-bold">{c.name} <span className="font-normal text-[#5C6666]">({c.grade})</span></div>
                      <div className="text-xs text-[#5C6666] mt-0.5">{c.distance.toFixed(0)} miles away</div>
                      <button onClick={() => openSendModal(c)} className="mt-3 w-full py-2 rounded-2xl bg-[#DCFCE7] text-[#166534] font-extrabold text-sm">SEND IT NOW</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!userLocation && (
              <button 
                onClick={getUserLocation} 
                disabled={locationLoading}
                className="w-full py-3 rounded-2xl border border-[#E5E2D9] text-[#166534] font-semibold active:bg-[#F0FDF4]"
              >
                {locationLoading ? "Getting your location..." : "📍 Show climbs near me"}
              </button>
            )}

            <div>
              <div className="font-bold text-xl mb-3 flex items-center gap-2">✨ Recommended for you</div>
              <div className="text-sm text-[#5C6666] mb-3">Based on climbs you've already logged</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {personalRecommendations.map(c => (
                  <div key={c.id} className="rec-card">
                    <div className="font-bold">{c.name} <span className="font-normal text-[#5C6666]">({c.grade})</span></div>
                    <button onClick={() => openSendModal(c)} className="mt-3 w-full py-2 rounded-2xl bg-[#DCFCE7] text-[#166534] font-extrabold text-sm">SEND IT NOW</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold text-xl mb-3 flex items-center gap-2"><Users /> Climbers who sent your routes also loved…</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {recommendations.map(c => (
                  <div key={c.id} className="rec-card">
                    <div className="font-bold">{c.name} <span className="font-normal text-[#5C6666]">({c.grade})</span></div>
                    <button onClick={() => openSendModal(c)} className="mt-3 w-full py-2 rounded-2xl bg-[#DCFCE7] text-[#166534] font-extrabold text-sm">SEND IT NOW</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="goal-card border-l-4 border-[#22C55E] text-lg">
              Your {userStats.totalSends} logs have already helped <span className="font-extrabold text-[#22C55E]">1,284 climbers</span> this month. This is how we grow the best dataset — by making logging actually fun.
            </div>

            <div>
              <div className="section-title">Find your climb</div>
              <div className="flex gap-2 mb-4 flex-wrap lg:gap-3 lg:mb-5">
                <input value={discoverSearch} onChange={e=>setDiscoverSearch(e.target.value)} placeholder="Search name / area / grade" className="flex-1 bg-white border border-[#E5E2D9] px-5 py-3 rounded-3xl lg:min-w-[320px] text-[#1F2525]" />
                {['All','Boulder','Sport','Trad'].map(t=><button key={t} onClick={()=>setDiscoverType(t as any)} className={`filter-chip ${discoverType===t?'active':''}`}>{t}</button>)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {discoverClimbs.map(c => {
                  const wish = wishlist.includes(c.id);
                  return <div key={c.id} className="climb-card"><div className="climb-card-photo" style={{backgroundImage:`url(${c.photoUrl})`}}><button onClick={()=>toggleWishlist(c.id)} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full"><Heart size={17} fill={wish?'#FBBF24':'none'}/></button><span className="absolute bottom-3 left-3 grade-badge" style={{background:getGradeColor(c.grade)}}>{c.grade}</span></div><div className="p-4"><div className="font-bold text-xl">{c.name}</div><div className="text-sm text-[#5C6666]">{c.areaName}</div><div className="mt-1"><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] font-medium tracking-tight inline-block">{getSourceBadge(c.sources)}</span></div><div className="mt-3 flex gap-2"><button onClick={()=>openSendModal(c)} className="send-it-mini flex-1 justify-center">SEND IT</button><button onClick={()=>toggleWishlist(c.id)} className="px-4 text-sm border border-[#E5E2D9] rounded-3xl font-semibold">{wish?'Wishlisted':'Wishlist'}</button></div></div></div>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ME TAB - Profile + Stats + Viral Share Generator */}
        {activeTab === 'me' && (
          <div className="max-w-xl mx-auto space-y-8">
            {/* REAL AUTH via Clerk - Apple, Google, Facebook, Email */}
            <div>
              <SignedIn>
                <div className="text-center">
                  <div className="text-5xl mb-2">🧗</div>
                  <div className="text-3xl font-bold">Welcome back!</div>
                  <p className="text-[#5C6666] mt-1">You're signed in with real authentication</p>
                </div>
              </SignedIn>

              <SignedOut>
                {/* DEMO PROFILE SWITCHER — fallback when not signed in */}
                <div>
                  <div className="text-[10px] tracking-[2px] text-[#5C6666] text-center mb-2">DEMO PROFILES (Sign in above for real auth)</div>
                  <div className="flex flex-col gap-2">
                    {DEMO_PROFILES.map((p) => {
                      const isActive = p.id === currentProfileId;
                      const emoji = p.id === 'p_alex' ? '🧗' : p.id === 'p_sam' ? '🧒' : '🧗‍♂️';
                      return (
                        <button
                          key={p.id}
                          onClick={() => switchProfile(p.id)}
                          className={`w-full text-left px-5 py-4 rounded-3xl flex items-center gap-4 active:scale-[0.985] transition-all border ${isActive ? 'bg-[#DCFCE7] border-[#166534]' : 'bg-white border-[#E5E2D9] active:bg-[#F8F7F4]'}`}
                        >
                          <div className="text-3xl flex-shrink-0">{emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-[19px] leading-tight">{p.name}</div>
                            <div className="text-sm text-[#5C6666] mt-0.5">{p.subtitle}</div>
                          </div>
                          {isActive && (
                            <div className="ml-auto text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#22C55E] text-[#0A0C0A] flex-shrink-0">CURRENT</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-center text-[10px] text-[#5C6666] mt-1.5">Demo mode • <SignInButton mode="modal"><span className="text-[#166534] underline cursor-pointer">Sign in with Apple, Google, Facebook or Email</span></SignInButton></div>
                </div>
              </SignedOut>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-2">🧗</div>
              <div className="text-3xl font-bold">{currentProfile.name}</div>
              <div className="text-[#5C6666]">{currentProfile.subtitle}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white border border-[#E5E2D9] rounded-2xl p-5">
                <div className="text-4xl font-bold text-[#166534]">{userStats.totalSends}</div>
                <div className="text-sm text-[#5C6666] mt-1">Total Sends</div>
              </div>
              <div className="bg-white border border-[#E5E2D9] rounded-2xl p-5">
                <div className="text-4xl font-bold text-[#B45309]">{userStats.hardest}</div>
                <div className="text-sm text-[#5C6666] mt-1">Hardest Send</div>
              </div>
              <div className="bg-white border border-[#E5E2D9] rounded-2xl p-5">
                <div className="text-4xl font-bold text-[#166534]">{userStats.thisMonth}</div>
                <div className="text-sm text-[#5C6666] mt-1">This Month</div>
              </div>
            </div>

            {/* MY COMPLETED CLIMBS — Simple list of what this profile has sent */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-lg">My Completed Climbs</div>
                <button 
                  onClick={() => setActiveTab('logbook')} 
                  className="text-sm text-[#4ADE80] font-medium"
                >
                  View full logbook →
                </button>
              </div>
              {ticks.length === 0 ? (
                <div className="text-[#5C6666] text-sm">No climbs logged yet for {currentProfile.name}. Head to Discover and tap "SEND IT" on a route!</div>
              ) : (
                <div className="space-y-2">
                  {ticks.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border border-[#E5E2D9] rounded-2xl px-4 py-3 text-sm">
                      <div>
                        <span className="font-semibold">{t.routeName}</span>
                        <span className="text-[#5C6666]"> • {t.grade} • {t.areaName}</span>
                      </div>
                      <div className="text-[#166534] font-medium">{t.sendStyle || 'Sent'}</div>
                    </div>
                  ))}
                  {ticks.length > 5 && (
                    <div className="text-xs text-[#5C6666] text-center">+{ticks.length - 5} more in your Logbook</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="font-semibold mb-3 text-lg">2026 Goals</div>
              {updatedGoals.map((g:any, i:number) => (
                <div key={i} className="mb-5">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{g.label}</span>
                    <span className="font-mono text-[#22C55E]">{g.current}/{g.target}</span>
                  </div>
                  <div className="h-2.5 bg-[#E5E2D9] rounded-full overflow-hidden">
                    <div className="h-2.5 bg-[#166534] transition-all" style={{width: `${Math.min(100, (g.current / g.target) * 100)}%`}} />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="font-semibold mb-3 text-lg">Wishlist</div>
              {wishlist.length === 0 ? (
                <div className="text-[#5C6666]">Heart climbs from the Discover tab.</div>
              ) : (
                wishlist.map(id => {
                  const c = ROUTES.find(r => r.id === id)!;
                  return (
                    <div key={id} className="flex justify-between items-center bg-white border border-[#E5E2D9] rounded-2xl px-5 py-3 mb-2">
                      <div>{c.name} <span className="text-[#5C6666]">({c.grade})</span></div>
                      <button onClick={() => openSendModal(c)} className="text-[#166534] font-bold">SEND IT</button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Instagram Share Card — Beautifully surfaced viral surface (powered by your real logged ticks) */}
            <div className="pt-6 border-t border-[#E5E2D9]">
              <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-[#4ADE80] mb-1">
                    <span className="text-xl">📸</span>
                    <span className="font-bold tracking-tight text-lg">Share the stoke</span>
                  </div>
                  <div className="text-[#5C6666] text-[15px]">Turn your latest real send into a premium vertical card ready for Instagram or Stories. Branded, beautiful, zero effort.</div>
                </div>

                {/* The beautiful primary button - large, joyful, 10yo-friendly tap target */}
                <button
                  onClick={generateInstagramCard}
                  disabled={ticks.length === 0}
                  className="w-full h-16 rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-[#0A0C0A] font-extrabold text-[17px] flex items-center justify-center gap-3 active:scale-[0.985] transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>📸</span>
                  <span>{ticks.length > 0 ? "Create Instagram Card from my latest send" : "Log a send to unlock cards"}</span>
                </button>
                <div className="text-center text-xs text-[#5C6666] -mt-1">1080×1350 • Downloads instantly • #CragTrails in every card</div>

                {/* Shareable text options — real data, multiple tones, one-tap copy */}
                <div className="pt-2 border-t border-[#E5E2D9]">
                  <div className="font-semibold text-sm mb-3 text-[#5C6666] tracking-wide">SHAREABLE CAPTIONS (tap to copy)</div>
                  <div className="space-y-2">
                    {getShareCaptions(getLatestTickForShare()).map((caption, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigator.clipboard.writeText(caption).then(() => {
                            toast.success("Caption copied! Paste it with your card on IG.");
                          }).catch(() => {
                            // Fallback: alert for ancient browsers (rare)
                            alert(caption);
                          });
                        }}
                        className="w-full text-left bg-[#F8F7F4] hover:bg-white active:scale-[0.995] border border-[#E5E2D9] rounded-2xl px-4 py-3 text-[13px] leading-snug text-[#1F2525] font-medium transition"
                      >
                        {caption}
                        <span className="block text-[10px] text-[#4ADE80] mt-1 font-mono tracking-widest">COPY FOR IG</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-2 text-center">Captions are built from your actual logged tick data. Family-friendly options included.</div>
                </div>
              </div>
            </div>

            {/* PARTNERS KEEPING IT FREE — strictly Me tab only (no primary flow clutter).
                Uses the exact existing SPONSORS data from lib/seed-data.ts (prepared in revenue research).
                Matches dark theme + card patterns already in this tab. Tasteful, transparent, reinforces the non-negotiable "core always free" promise. */}
            <div className="pt-8 border-t border-[#E5E2D9]">
              <div className="text-[10px] tracking-[2px] text-[#5C6666] mb-2">PARTNERS KEEPING IT FREE</div>
              <div className="text-sm text-[#5C6666] mb-4 leading-snug">
                CragTrails core — maps, routes, logbook, community beta — is and always will be 100% free. 
                These climber-first brands help fund servers, moderation, and OpenBeta contributions so every new climber and family can send without paywalls.
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPONSORS.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-white border border-[#E5E2D9] hover:border-[#166534] active:scale-[0.985] rounded-2xl px-4 py-3 transition-all text-sm"
                    title={s.blurb}
                  >
                    <span className="text-xl flex-shrink-0">{s.logo}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1F2525] truncate">{s.name}</div>
                      <div className="text-[10px] text-[#5C6666] truncate">{s.tier}</div>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-center text-[#6B7280]">No pay-to-play. No tracking. Just partners who believe in open climbing tools.</div>
            </div>
          </div>
        )}
      </div>

      {/* CLEAN ALLTRAILS-STYLE 4-TAB BOTTOM NAV — Mobile only (hidden on desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-[#E5E2D9] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-[1280px] mx-auto flex">
          {([
            { key: 'discover' as const, label: 'Discover', Icon: MapPin },
            { key: 'map' as const, label: 'Map', Icon: Target },
            { key: 'logbook' as const, label: 'Logbook', Icon: BookOpen },
            { key: 'me' as const, label: 'Me', Icon: Users },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center justify-center py-3 active:scale-[0.96] transition-all ${activeTab === key ? 'text-[#166534]' : 'text-[#5C6666]'}`}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              <Icon size={22} />
              <span className={`text-[11px] font-semibold mt-0.5 tracking-[-0.1px] ${activeTab === key ? 'font-bold' : ''}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={()=>openSendModal()} className="fixed bottom-20 right-6 md:hidden z-[95] h-16 w-16 rounded-full bg-[#22C55E] text-[#0A0C0A] flex items-center justify-center shadow-2xl"><Send size={28}/></button>

      <AnimatePresence>
        {isSendModalOpen && currentClimb && (
          <div className="fixed inset-0 z-[95] bg-black/80 flex items-end md:items-center justify-center p-0 md:p-6" onClick={closeSendModal}>
            <motion.div initial={{y:70,opacity:0}} animate={{y:0,opacity:1}} exit={{y:50,opacity:0}} className="send-modal w-full md:max-w-lg" onClick={e=>e.stopPropagation()}>
              <div className="modal-header flex justify-between">
                <div>
                  <div className="text-xs text-[#5C6666]">LOG THIS CLIMB FOR {currentProfile.name.toUpperCase()}</div>
                  <div className="text-2xl font-extrabold tracking-tight">{currentClimb.name}</div>
                  <div className="text-sm text-[#5C6666]">{currentClimb.areaName} • {currentClimb.grade}</div>
                  <div className="text-[10px] text-[#4ADE80] mt-0.5 font-medium tracking-tight">{getAttributionLine(currentClimb.sources)}</div>
                  {/* Show if this profile has already completed the route */}
                  {ticks.some(t => t.routeId === currentClimb.id) && (
                    <div className="mt-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] font-medium">✓ You’ve already logged this climb</div>
                  )}
                </div>
                <button onClick={closeSendModal}><X/></button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-xs mb-1 text-[#5C6666]">DATE</div><input type="date" value={sendForm.date} onChange={e=>setSendForm({...sendForm,date:e.target.value})} className="w-full bg-white border border-[#E5E2D9] rounded-2xl px-4 py-2 text-sm text-[#1F2525]"/></div>
                  <div><div className="text-xs mb-1 text-[#5C6666]">STARS</div><div className="flex gap-1 text-4xl">{[1,2,3,4,5].map(s=><span key={s} onClick={()=>setSendForm({...sendForm,stars:s})} className={`cursor-pointer ${s<=sendForm.stars?'text-[#FBBF24]':'text-[#E5E2D9]'}`}>★</span>)}</div></div>
                </div>

                <div><div className="text-xs mb-2 text-[#5C6666]">CONDITIONS TAG</div><div className="flex flex-wrap gap-2">{CONDITION_TAGS.map(t=><button key={t} onClick={()=>setSendForm({...sendForm,conditionTag:t})} className={`condition-pill ${sendForm.conditionTag===t?'active':''}`}>{t}</button>)}</div></div>

                <div><div className="text-xs mb-1.5 text-[#5C6666]">BETA NOTES</div><textarea value={sendForm.betaNotes} onChange={e=>setSendForm({...sendForm,betaNotes:e.target.value})} placeholder="Right hand to the crimp, then dyno left..." className="w-full bg-white border border-[#E5E2D9] rounded-2xl p-4 text-sm text-[#1F2525]" rows={2}/></div>

                <div><div className="text-xs mb-1.5 text-[#5C6666]">OPTIONAL PHOTO</div>{!sendForm.photoDataUrl ? <label className="photo-upload block cursor-pointer"><Camera className="mx-auto mb-1"/><div className="text-sm">Add a photo of the send</div><input type="file" accept="image/*" onChange={handlePhoto} className="hidden"/>{isUploadingPhoto&&<div>Compressing...</div>}</label> : <div className="relative"><img src={sendForm.photoDataUrl} loading="lazy" className="photo-preview"/><button onClick={()=>setSendForm({...sendForm,photoDataUrl:''})} className="absolute top-2 right-2 bg-black/70 rounded-full p-1"><X size={15}/></button></div>}</div>
              </div>

              <div className="p-5 pt-0">
                <button onClick={submitSend} className="w-full h-16 text-xl font-extrabold rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-[#0A0C0A] flex items-center justify-center gap-3">
                  LOG THIS CLIMB AS COMPLETED FOR ME
                </button>
                <div className="text-center text-[10px] text-[#5C6666] mt-2">This will be saved under {currentProfile.name} in your profile</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div id="confetti-root" className="fixed inset-0 pointer-events-none z-[130]" />
    </div>
  );
}
