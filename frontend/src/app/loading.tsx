export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col items-center justify-center gap-8">
      {/* Kai mascot */}
      <div className="relative animate-pulse">
        <div className="absolute inset-0 rounded-full bg-accent-glow/30 blur-2xl animate-pulse" style={{ width: 120, height: 120, transform: 'translate(-10%, -10%) scale(1.2)' }} />
        <svg
          className="w-28 h-28 relative z-10 drop-shadow-lg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="loadHead" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="loadFin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <radialGradient id="loadGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glow */}
          <circle cx="50" cy="50" r="46" fill="url(#loadGlow)" />

          {/* Ear fins */}
          <path d="M25 44 C10 34 6 52 18 56 C24 58 28 52 28 48Z" fill="url(#loadFin)" opacity="0.9" />
          <path d="M75 44 C90 34 94 52 82 56 C76 58 72 52 72 48Z" fill="url(#loadFin)" opacity="0.9" />

          {/* Wave crest */}
          <path d="M38 28 Q40 18 50 16 Q60 18 62 28 Q56 24 50 23 Q44 24 38 28Z" fill="#6ee7b7" opacity="0.7" />
          <path d="M42 24 Q44 14 50 12 Q56 14 58 24 Q54 21 50 20 Q46 21 42 24Z" fill="#6ee7b7" opacity="0.5" />

          {/* Head */}
          <circle cx="50" cy="54" r="28" fill="url(#loadHead)" />
          <ellipse cx="40" cy="38" rx="14" ry="8" fill="white" opacity="0.1" />

          {/* Eyes - closed/sleepy for loading */}
          <path d="M32 52 Q39 46 46 52" stroke="#064e3b" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M54 52 Q61 46 68 52" stroke="#064e3b" strokeWidth="2.2" strokeLinecap="round" />

          {/* Blush */}
          <ellipse cx="32" cy="60" rx="5.5" ry="3" fill="#34d399" opacity="0.35" />
          <ellipse cx="68" cy="60" rx="5.5" ry="3" fill="#34d399" opacity="0.35" />

          {/* Smile */}
          <path d="M44 63 Q50 68 56 63" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" />

          {/* Water droplets */}
          <path d="M27 78 Q27 83 30 85 Q33 83 33 78 Q30 74 27 78Z" fill="#6ee7b7" opacity="0.4" />
          <path d="M67 82 Q67 87 70 89 Q73 87 73 82 Q70 78 67 82Z" fill="#6ee7b7" opacity="0.4" />
        </svg>
      </div>

      {/* Spinner */}
      <div className="relative">
        <div className="spinner !w-8 !h-8 !border-2" />
      </div>

      <p className="text-text-muted text-sm animate-pulse">Loading...</p>
    </div>
  );
}
