'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  return (
    <header className="glass sticky top-0 z-50 px-6 py-4">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
          {/* KaiStream logo: Kai the sea dragon mascot */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-accent-glow/30 blur-md group-hover:bg-accent-glow/50 transition-all duration-300" />
            <svg
              className="w-10 h-10 relative z-10 group-hover:scale-105 transition-transform duration-300"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="crestGrad">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6ee7b7" />
                </linearGradient>
                <radialGradient id="bgGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background glow */}
              <circle cx="50" cy="50" r="46" fill="url(#bgGlow)" />

              {/* Ear fins */}
              <path d="M25 44 C10 34 6 52 18 56 C24 58 28 52 28 48Z" fill="url(#finGrad)" opacity="0.9" />
              <path d="M75 44 C90 34 94 52 82 56 C76 58 72 52 72 48Z" fill="url(#finGrad)" opacity="0.9" />

              {/* Wave crest on top */}
              <path d="M38 28 Q40 18 50 16 Q60 18 62 28 Q56 24 50 23 Q44 24 38 28Z" fill="url(#crestGrad)" />
              <path d="M42 24 Q44 14 50 12 Q56 14 58 24 Q54 21 50 20 Q46 21 42 24Z" fill="#6ee7b7" opacity="0.5" />

              {/* Head */}
              <circle cx="50" cy="54" r="28" fill="url(#headGrad)" />
              
              {/* Head highlight */}
              <ellipse cx="40" cy="38" rx="14" ry="8" fill="white" opacity="0.1" />

              {/* Eyes */}
              <ellipse cx="39" cy="52" rx="7" ry="8" fill="white" />
              <ellipse cx="61" cy="52" rx="7" ry="8" fill="white" />
              
              {/* Pupils */}
              <ellipse cx="40" cy="53" rx="4" ry="4.5" fill="#064e3b" />
              <ellipse cx="60" cy="53" rx="4" ry="4.5" fill="#064e3b" />

              {/* Primary eye highlights */}
              <circle cx="42" cy="50" r="2" fill="white" />
              <circle cx="58" cy="50" r="2" fill="white" />
              
              {/* Secondary eye highlights */}
              <circle cx="38" cy="55" r="1.2" fill="white" opacity="0.6" />
              <circle cx="62" cy="55" r="1.2" fill="white" opacity="0.6" />

              {/* Blush */}
              <ellipse cx="32" cy="60" rx="5.5" ry="3" fill="#34d399" opacity="0.35" />
              <ellipse cx="68" cy="60" rx="5.5" ry="3" fill="#34d399" opacity="0.35" />

              {/* Smile */}
              <path d="M44 63 Q50 68 56 63" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" />

              {/* Water droplet left */}
              <path d="M27 78 Q27 83 30 85 Q33 83 33 78 Q30 74 27 78Z" fill="#6ee7b7" opacity="0.5" />
              <circle cx="28.5" cy="79.5" r="1" fill="white" opacity="0.4" />

              {/* Water droplet right */}
              <path d="M67 82 Q67 87 70 89 Q73 87 73 82 Q70 78 67 82Z" fill="#6ee7b7" opacity="0.5" />
              <circle cx="68.5" cy="83.5" r="1" fill="white" opacity="0.4" />
            </svg>
          </div>
          
          {/* KaiStream wordmark */}
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-emerald-400">Kai</span>
            <span className="text-emerald-500">Stream</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-[520px] relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, manga, characters..."
            className="w-full py-3 pl-12 pr-4 bg-bg-card border border-border rounded-2xl text-text-primary text-sm outline-none transition-all duration-200 focus:border-accent-1 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] placeholder:text-text-muted"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-white/5">
            Browse
          </Link>
          <Link href="/?sortBy=Trending" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-white/5">
            Trending
          </Link>
        </nav>
      </div>
    </header>
  );
}
