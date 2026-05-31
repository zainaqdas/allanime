'use client';

interface PaginationProps {
  current: number;
  total: number;
  onPage: (page: number) => void;
}

export default function Pagination({ current, total, onPage }: PaginationProps) {
  if (total <= 1) return null;

  const maxVisible = 7;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: (number | 'dots')[] = [];
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('dots');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) {
    if (end < total - 1) pages.push('dots');
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-5">
      <button
        onClick={() => onPage(current - 1)}
        disabled={current <= 1}
        className="min-w-[40px] h-10 flex items-center justify-center border border-border rounded-lg bg-bg-card text-text-secondary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-accent-1 hover:text-text-primary transition-all"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === 'dots' ? (
          <span key={`dots-${i}`} className="text-text-muted px-3 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-[40px] h-10 flex items-center justify-center border rounded-lg text-sm font-medium transition-all ${
              p === current
                ? 'bg-gradient-to-r from-accent-1 to-accent-2 border-transparent text-white'
                : 'border-border bg-bg-card text-text-secondary hover:border-accent-1 hover:text-text-primary'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(current + 1)}
        disabled={current >= total}
        className="min-w-[40px] h-10 flex items-center justify-center border border-border rounded-lg bg-bg-card text-text-secondary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-accent-1 hover:text-text-primary transition-all"
      >
        ›
      </button>
    </div>
  );
}
