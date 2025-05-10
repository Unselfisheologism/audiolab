import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/audio-forge');
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading Audio Lab...</p>
    </div>
  );
}
