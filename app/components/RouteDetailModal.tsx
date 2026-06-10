'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, MapPin, Mountain, ChevronLeft, ChevronRight,
  Shield, Wind, AlertTriangle, Info, Camera, Send,
  Navigation, Clock, Users, Thermometer
} from 'lucide-react';
import type { Route } from '@/lib/types';

type ConditionReportItem = { id: string; text: string; emoji: string; date: string; user: string; photoUrl?: string };

interface RouteDetailModalProps {
  route: Route | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (route: Route) => void;
  onWishlist: (routeId: string) => void;
  isWishlisted: boolean;
  conditionReports?: ConditionReportItem[];
}

function StarRating({ stars, votes }: { stars: number; votes: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={16}
            fill={i <= Math.round(stars) ? '#FBBF24' : 'none'}
            stroke={i <= Math.round(stars) ? '#FBBF24' : '#9CA3AF'}
          />
        ))}
      </div>
      <span className="text-sm text-[#5C6666]">{stars.toFixed(1)} ({votes} votes)</span>
    </div>
  );
}

function PhotoCarousel({ photos, routeName }: { photos: string[]; routeName: string }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  if (!photos.length) {
    return (
      <div className="w-full h-52 bg-gradient-to-br from-[#1a2e1a] to-[#0f1a0f] flex items-center justify-center rounded-2xl">
        <Mountain size={40} className="text-[#22C55E] opacity-40" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-[#1a2e1a]">
      {/* Blur placeholder while loading */}
      {!loaded[idx] && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e1a] to-[#0f1a0f] animate-pulse" />
      )}
      <img
        key={photos[idx]}
        src={photos[idx]}
        alt={`${routeName} - photo ${idx + 1}`}
        loading="lazy"
        onLoad={() => setLoaded(p => ({ ...p, [idx]: true }))}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded[idx] ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Photo counter */}
      <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2.5 py-1 text-white text-xs font-medium flex items-center gap-1">
        <Camera size={11} />
        {idx + 1}/{photos.length}
      </div>

      {/* Nav arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-3' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BetaSection({ route }: { route: Route }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = route.description.length > 240;
  const display = isLong && !expanded ? route.description.slice(0, 240) + '…' : route.description;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-[#0A0C0A] text-base flex items-center gap-2">
        <Info size={16} className="text-[#22C55E]" />
        Route Beta
      </h3>
      <p className="text-[#374151] text-sm leading-relaxed">{display}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[#22C55E] text-sm font-semibold"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {/* Structured beta fields */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {route.protection && (
          <div className="bg-[#F8F7F4] rounded-xl p-3">
            <div className="text-xs text-[#5C6666] font-medium mb-1 flex items-center gap-1">
              <Shield size={11} /> GEAR / PROTECTION
            </div>
            <div className="text-sm text-[#374151] font-medium">{route.protection}</div>
          </div>
        )}
        {route.fa && (
          <div className="bg-[#F8F7F4] rounded-xl p-3">
            <div className="text-xs text-[#5C6666] font-medium mb-1 flex items-center gap-1">
              <Mountain size={11} /> FIRST ASCENT
            </div>
            <div className="text-sm text-[#374151] font-medium">{route.fa}</div>
          </div>
        )}
        {route.bestConditions && (
          <div className="bg-[#F8F7F4] rounded-xl p-3">
            <div className="text-xs text-[#5C6666] font-medium mb-1 flex items-center gap-1">
              <Thermometer size={11} /> BEST CONDITIONS
            </div>
            <div className="text-sm text-[#374151] font-medium">{route.bestConditions}</div>
          </div>
        )}
        {route.hazards && (
          <div className="bg-[#FEF2F2] rounded-xl p-3 border border-[#FECACA]">
            <div className="text-xs text-[#DC2626] font-medium mb-1 flex items-center gap-1">
              <AlertTriangle size={11} /> HAZARDS
            </div>
            <div className="text-sm text-[#DC2626] font-medium">{route.hazards}</div>
          </div>
        )}
        {route.lengthFt && (
          <div className="bg-[#F8F7F4] rounded-xl p-3">
            <div className="text-xs text-[#5C6666] font-medium mb-1 flex items-center gap-1">
              <Navigation size={11} /> LENGTH
            </div>
            <div className="text-sm text-[#374151] font-medium">{route.lengthFt} ft</div>
          </div>
        )}
        {route.pitches && route.pitches > 1 && (
          <div className="bg-[#F8F7F4] rounded-xl p-3">
            <div className="text-xs text-[#5C6666] font-medium mb-1 flex items-center gap-1">
              <Clock size={11} /> PITCHES
            </div>
            <div className="text-sm text-[#374151] font-medium">{route.pitches} pitches</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionChip({ report }: { report: ConditionReportItem }) {
  return (
    <div className="bg-[#F8F7F4] rounded-xl p-3 flex gap-3">
      <span className="text-xl">{report.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#374151] leading-snug">{report.text}</p>
        <p className="text-xs text-[#9CA3AF] mt-1">{report.user} · {report.date}</p>
        {report.photoUrl && (
          <img
            src={report.photoUrl}
            alt="condition report"
            loading="lazy"
            className="mt-2 rounded-lg w-full max-h-32 object-cover"
          />
        )}
      </div>
    </div>
  );
}

export default function RouteDetailModal({
  route,
  isOpen,
  onClose,
  onSend,
  onWishlist,
  isWishlisted,
  conditionReports = [],
}: RouteDetailModalProps) {
  const routeReports = conditionReports.filter(r => (r as any).routeId === route?.id).slice(0, 3);

  const allPhotos = route
    ? [route.photoUrl, ...route.photoUrls].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const typeIcon = route?.type === 'Boulder' ? '🪨' : route?.type === 'Trad' ? '🔧' : '⚡';

  return (
    <AnimatePresence>
      {isOpen && route && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[91] bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#E5E2D9] rounded-full" />
            </div>

            <div className="px-4 pb-32 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between pt-1">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{typeIcon}</span>
                    <span className="text-xs font-semibold text-[#5C6666] uppercase tracking-wide">{route.type}</span>
                  </div>
                  <h2 className="font-black text-2xl text-[#0A0C0A] leading-tight">{route.name}</h2>
                  <div className="flex items-center gap-1 mt-1 text-[#5C6666] text-sm">
                    <MapPin size={13} />
                    <span>{route.areaName}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grade + stats row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-4 py-1.5 rounded-full font-black text-white text-lg"
                  style={{ background: route.difficultyColor === 'green' ? '#22C55E' : route.difficultyColor === 'yellow' ? '#EAB308' : route.difficultyColor === 'orange' ? '#F97316' : route.difficultyColor === 'red' ? '#EF4444' : '#8B5CF6' }}
                >
                  {route.grade}
                </span>
                <StarRating stars={route.stars} votes={route.starVotes} />
                <div className="flex items-center gap-1 text-[#5C6666] text-sm">
                  <Users size={14} />
                  <span>{route.ticks.toLocaleString()} sends</span>
                </div>
              </div>

              {/* Photo carousel */}
              <PhotoCarousel photos={allPhotos} routeName={route.name} />

              {/* Ad slot: 300×100, after description, before log ascent — labeled Sponsored by [Brand] */}
              <div
                className="ad-route-modal w-full rounded-xl bg-[#F8F7F4] border border-[#E5E2D9] flex items-center gap-3 px-4 py-3"
                style={{ minHeight: '64px' }}
                aria-label="Advertisement"
              >
                <div className="text-2xl">🎒</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] tracking-[1.5px] text-[#9CA3AF] uppercase">Sponsored by Black Diamond</div>
                  <div className="font-semibold text-sm text-[#374151] truncate">Gear up for your next project</div>
                </div>
              </div>

              {/* Beta section */}
              <BetaSection route={route} />

              {/* Condition reports */}
              {routeReports.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-[#0A0C0A] text-base flex items-center gap-2">
                    <Wind size={16} className="text-[#22C55E]" />
                    Recent Conditions
                  </h3>
                  <div className="space-y-2">
                    {routeReports.map(r => <ConditionChip key={r.id} report={r} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed action bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2D9] px-4 py-3 flex gap-3 z-[92]">
              <button
                onClick={() => onWishlist(route.id)}
                className={`px-5 py-3.5 rounded-2xl font-bold text-sm border transition-all ${isWishlisted ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]' : 'bg-white border-[#E5E2D9] text-[#374151]'}`}
              >
                {isWishlisted ? '⭐ Wishlisted' : '☆ Wishlist'}
              </button>
              <button
                onClick={() => { onSend(route); onClose(); }}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-base bg-[#22C55E] text-[#0A0C0A] flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
              >
                <Send size={18} />
                SEND IT
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
