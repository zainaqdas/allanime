import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'KaiStream - Stream Anime Episodes',
  description: 'Stream anime episodes with a clean, modern interface. KaiStream brings you the best of anime streaming.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\' fill=\'none\'><defs><linearGradient id=\'h\' x1=\'0\' y1=\'0\' x2=\'1\' y2=\'1\'><stop offset=\'0%\' stop-color=\'%2334d399\'/><stop offset=\'100%\' stop-color=\'%23059669\'/></linearGradient><linearGradient id=\'f\' x1=\'0\' y1=\'0\' x2=\'0\' y2=\'1\'><stop offset=\'0%\' stop-color=\'%236ee7b7\'/><stop offset=\'100%\' stop-color=\'%2310b981\'/></linearGradient></defs><circle cx=\'16\' cy=\'16\' r=\'16\' fill=\'url(%23h)\'/><path d=\'M8 13 C4 10 4 17 8 18C10 19 10 17 10 16\' fill=\'url(%23f)\' opacity=\'0.9\'/><path d=\'M24 13 C28 10 28 17 24 18C22 19 22 17 22 16\' fill=\'url(%23f)\' opacity=\'0.9\'/><circle cx=\'16\' cy=\'17\' r=\'11\' fill=\'url(%23h)\'/><ellipse cx=\'12\' cy=\'16\' rx=\'3\' ry=\'3.2\' fill=\'white\'/><ellipse cx=\'20\' cy=\'16\' rx=\'3\' ry=\'3.2\' fill=\'white\'/><ellipse cx=\'12.5\' cy=\'16.5\' rx=\'1.6\' ry=\'1.8\' fill=\'%23064e3b\'/><ellipse cx=\'19.5\' cy=\'16.5\' rx=\'1.6\' ry=\'1.8\' fill=\'%23064e3b\'/><circle cx=\'13\' cy=\'15\' r=\'0.9\' fill=\'white\'/><circle cx=\'19\' cy=\'15\' r=\'0.9\' fill=\'white\'/><path d=\'M13 20 Q16 22 19 20\' stroke=\'%23064e3b\' strokeWidth=\'1\' strokeLinecap=\'round\'/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-primary text-text-primary min-h-screen">
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
