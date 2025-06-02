
import type { Metadata } from 'next';
import AppHeader from '@/components/audioviz/app-header';
import AppFooter from '@/components/audioviz/app-footer';

// Optional: If this route segment needs its own metadata distinct from the root
// export const metadata: Metadata = {
//   title: 'AudioViz Studio - Visualizer',
//   description: 'Craft your audio into stunning visual experiences.',
// };

export default function AudioVizStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="audioviz-page-theme flex flex-col min-h-screen"> {/* Apply theme and basic page structure */}
      <AppHeader />
      {/* The children prop will be the content from src/app/audiovizstudio/page.tsx */}
      {children}
      <AppFooter />
    </div>
  );
}
