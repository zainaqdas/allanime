import { Suspense } from 'react';
import HomePageContent from '@/components/HomePageContent';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="py-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-xl overflow-hidden border border-border">
              <div className="aspect-[3/4] skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton w-4/5" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
