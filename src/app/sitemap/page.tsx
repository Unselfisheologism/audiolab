import Link from 'next/link';
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';

export default function SitemapPage() {
  const mainPages = [
    { name: 'Home', path: '/' },
    { name: 'Audio Forge', path: '/audio-forge' },
    { name: 'Cookies', path: '/cookies' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Licenses', path: '/licenses' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Terms', path: '/terms' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-6">Site Map</h1>
        <ul className="list-disc list-inside space-y-2">
          {mainPages.map((page) => (
            <li key={page.path}>
              <Link href={page.path} className="text-blue-600 hover:underline">
                {page.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <AppFooter />
    </div>
  );
}