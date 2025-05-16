
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
            <CardDescription>Please read these terms carefully before using Audio Lab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <p>Welcome to Audio Lab! These Terms of Service ("Terms") govern your access to and use of the Audio Lab web application (the "Service") provided by Audio Lab ("us", "we", or "our").</p>

            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. This Service is provided for demonstration and educational purposes.</p>

            <h2 className="text-xl font-semibold">2. Use of Service</h2>
            <p>Audio Lab grants you a non-exclusive, non-transferable, revocable license to use the Service strictly in accordance with these Terms.</p>
            <p>You agree not to use the Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>For any unlawful purpose or in violation of any local, state, national, or international law.</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others.</li>
              <li>To upload or process any audio material for which you do not have the necessary rights or permissions.</li>
              <li>To attempt to decompile, reverse engineer, or otherwise attempt to obtain the source code of the Service.</li>
            </ul>

            <h2 className="text-xl font-semibold">3. User Content</h2>
            <p>All audio files and data you upload and process using Audio Lab ("User Content") remain your property. We do not claim ownership of your User Content. All processing is performed client-side in your browser; we do not store your audio files on our servers for the core effects functionalities.</p>
            <p>You are solely responsible for your User Content and the consequences of processing and sharing it.</p>
            
            <h2 className="text-xl font-semibold">4. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Audio Lab makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            <p>Further, Audio Lab does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its Service or otherwise relating to such materials or on any sites linked to this Service.</p>

            <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
            <p>In no event shall Audio Lab or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service, even if Audio Lab or an Audio Lab authorized representative has been notified orally or in writing of the possibility of such damage.</p>

            <h2 className="text-xl font-semibold">6. Modifications to Service and Terms</h2>
            <p>We reserve the right to modify or discontinue the Service at any time without notice. We also reserve the right to modify these Terms at any time. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>

            <h2 className="text-xl font-semibold">7. Miscellaneous</h2>
            <h3 className="text-lg font-medium">7.1 Severability</h3>
            <p>If any part of these Terms is determined to be invalid or unenforceable by a court, that specific part will be adjusted to become enforceable, or if that's not possible, it will be removed from these Terms. The rest of the Terms will remain in full effect.</p>
            <h3 className="text-lg font-medium">7.2 No waiver</h3>
            <p>If we do not immediately enforce any right or provision outlined in these Terms, it does not mean we are giving up that right or provision. A single or partial exercise of any right or remedy will not prevent us from further exercising that right or any other right or remedy.</p>

            <h2 className="text-xl font-semibold">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at jeffrinjames99@gmail.com.</p>
            
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
