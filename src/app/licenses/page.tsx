
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const licenses = [
  {
    name: "Next.js",
    version: "Refer to package.json",
    license: "MIT License",
    url: "https://github.com/vercel/next.js/blob/canary/license.md"
  },
  {
    name: "React",
    version: "Refer to package.json",
    license: "MIT License",
    url: "https://github.com/facebook/react/blob/main/LICENSE"
  },
  {
    name: "Tailwind CSS",
    version: "Refer to package.json",
    license: "MIT License",
    url: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE"
  },
  {
    name: "Shadcn/ui (Radix UI & Other Primitives)",
    version: "Refer to components.json & package.json",
    license: "MIT License (for components, Radix UI, etc.)",
    url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md"
  },
  {
    name: "Lucide Icons",
    version: "Refer to package.json",
    license: "ISC License",
    url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE"
  },
  {
    name: "Recharts",
    version: "Refer to package.json",
    license: "MIT License",
    url: "https://github.com/recharts/recharts/blob/master/LICENSE"
  },
  {
    name: "Geist Font",
    version: "N/A",
    license: "SIL Open Font License 1.1",
    url: "https://github.com/vercel/geist-font/blob/main/LICENSE.md"
  }
  // Add other significant libraries if necessary
];

export default function ThirdPartyLicensesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audio Lab
            </Button>
          </Link>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Third-Party Licenses</CardTitle>
            <CardDescription>Audio Lab utilizes various open-source software. We are grateful to the developers and communities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>This application incorporates material from the FOSS (Free and Open Source Software) projects listed below. We thank their developers and contributors. The following is a list of these projects and their respective licenses. Please refer to the provided links for full license texts.</p>
            
            <div className="space-y-4">
              {licenses.map((lib, index) => (
                <div key={index} className="p-4 border rounded-md bg-muted/30">
                  <h3 className="text-lg font-semibold text-foreground">{lib.name}</h3>
                  <p className="text-sm text-muted-foreground">Version: {lib.version}</p>
                  <p className="text-sm text-muted-foreground">License: {lib.license}</p>
                  {lib.url && (
                    <a 
                      href={lib.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-primary hover:underline"
                    >
                      View License
                    </a>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              This list is not exhaustive but covers the primary libraries and assets used. For a complete list of dependencies and their licenses, please refer to the individual package repositories. If you believe any license information is incorrect or missing, please contact us at jeffrinjames99@gmail.com.
            </p>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
