
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
            <CardDescription>Your privacy is important to us. This policy explains how we handle your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <p>Audio Lab ("us", "we", or "our") operates the Audio Lab web application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data. This Service is for demonstration and educational purposes.</p>

            <h2 className="text-xl font-semibold">1. Information Collection and Use</h2>
            <p><strong>Audio Data:</strong> The core functionality of Audio Lab involves processing audio files that you upload. All audio processing is performed client-side, directly in your web browser. Your audio files are NOT uploaded to or stored on our servers for the primary effects processing. We do not have access to your original or processed audio files through these client-side operations.</p>
            <p><strong>Usage Data:</strong> We may collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address, though this is often anonymized or generalized), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data. This data is used for analytics purposes to improve the Service.</p>
            <p><strong>Cookies:</strong> We may use cookies and similar tracking technologies to track the activity on our Service and hold certain information. See our Cookie Policy for more details.</p>

            <h2 className="text-xl font-semibold">2. Use of Data</h2>
            <p>Audio Lab uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain the Service</li>
              <li>To notify you about changes to our Service (if you opt-in)</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
              <li>To provide customer care and support (limited, as this is a demo)</li>
              <li>To provide analysis or valuable information so that we can improve the Service</li>
              <li>To monitor the usage of the Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>

            <h2 className="text-xl font-semibold">3. Data Storage and Security</h2>
            <p>As mentioned, your audio files are processed client-side. Any Usage Data or data collected via cookies is handled with the aim of protecting your privacy. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect any minimal Personal Data we might incidentally collect (like IP for analytics), we cannot guarantee its absolute security.</p>

            <h2 className="text-xl font-semibold">4. Service Providers</h2>
            <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services (e.g., analytics) or to assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>

            <h2 className="text-xl font-semibold">5. Links to Other Sites</h2>
            <p>Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>

            <h2 className="text-xl font-semibold">6. Children's Privacy</h2>
            <p>Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers (if any was collected).</p>

            <h2 className="text-xl font-semibold">7. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

            <h2 className="text-xl font-semibold">8. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at jeffrinjames99@gmail.com.</p>
            
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
