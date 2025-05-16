
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicyPage() {
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
            <CardTitle className="text-3xl font-bold text-primary">Cookie Policy</CardTitle>
            <CardDescription>Information about how Audio Lab uses cookies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <p>This Cookie Policy explains what cookies are and how Audio Lab ("us", "we", or "our") uses them on the Audio Lab web application (the "Service"). You should read this policy so you can understand what type of cookies we use, the information we collect using cookies and how that information is used. This Service is for demonstration and educational purposes.</p>

            <h2 className="text-xl font-semibold">1. What Are Cookies?</h2>
            <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to recognize your device and remember some information about your preferences or past actions.</p>
            <p>Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.</p>

            <h2 className="text-xl font-semibold">2. How We Use Cookies</h2>
            <p>Audio Lab uses cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Some cookies are essential for you to be able to experience the full functionality of our site. For example, we use a cookie to manage your theme preference (light/dark mode). These are typically first-party cookies.</li>
              <li><strong>Analytics Cookies:</strong> We may use third-party analytics services (like a placeholder for Google Analytics or similar) to collect information about how users interact with our Service. These cookies help us understand which features are popular, how users navigate the site, and identify areas for improvement. The information collected is usually aggregated and anonymized.</li>
              <li><strong>Preference Cookies:</strong> These cookies are used to remember your preferences and various settings to provide a more personalized experience. For example, remembering the state of resizable panels or effects settings locally if such functionality were implemented.</li>
            </ul>
            <p>Currently, Audio Lab primarily uses essential cookies for theme settings stored in `localStorage` (which is similar to cookies but browser-specific storage). We aim to minimize the use of tracking cookies.</p>

            <h2 className="text-xl font-semibold">3. Your Choices Regarding Cookies</h2>
            <p>Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some parts of our Service may not function properly.</p>
            <p>You can typically find information on how to manage cookies on popular browsers here:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>
            <p>For `localStorage` (used for theme settings), you can clear this through your browser's developer tools or site settings.</p>

            <h2 className="text-xl font-semibold">4. Third-Party Cookies</h2>
            <p>As this is a demonstration application, we strive to limit the use of third-party cookies. If any third-party services are integrated for features like analytics, they will have their own cookie policies which you should review.</p>

            <h2 className="text-xl font-semibold">5. Changes to This Cookie Policy</h2>
            <p>We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page. You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.</p>

            <h2 className="text-xl font-semibold">6. Contact Us</h2>
            <p>If you have any questions about this Cookie Policy, please contact us at jeffrinjames99@gmail.com.</p>
            
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
