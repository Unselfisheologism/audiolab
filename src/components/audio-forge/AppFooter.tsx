
import { LegalLinks } from './LegalLinks';
import { Separator } from '@/components/ui/separator';

export function AppFooter() {
  return (
    <footer className="bg-muted text-muted-foreground p-6 md:p-8 mt-auto w-full border-t">
      <div className="container mx-auto text-center">
        {/* About and Philosophy Sections - keeping these as they were */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h5 className="font-semibold text-foreground mb-2">About Audio Lab</h5>
            <p className="text-sm">
              Audio Lab is a cutting-edge, browser-based audio processing suite designed for musicians,
              sound designers, and audio enthusiasts. Our platform offers a wide array of tools
              to sculpt, transform, and perfect your sound, all within an intuitive and accessible interface.
              Whether you're looking to apply subtle enhancements or create entirely new sonic landscapes,
              Audio Lab provides the power and flexibility you need.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-2">Our Philosophy</h5>
            <p className="text-sm">
              We believe that powerful audio tools should be available to everyone, regardless of their
              technical expertise or budget. Audio Lab is built on the principles of accessibility,
              innovation, and user-centric design. We continuously strive to incorporate the latest
              advancements in audio technology while keeping the user experience straightforward and enjoyable.
              Our commitment is to empower creators by removing barriers to high-quality audio production.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-2">Important Considerations</h5>
            <p className="text-sm">
              Audio processing is performed client-side, meaning all computations happen directly in your browser.
              This ensures privacy and speed for most operations. However, performance can vary based on your
              computer's capabilities and the complexity of the audio file and applied effects. For very large files or
              intensive processing chains, please be patient. Always ensure you have the rights to any audio material
              you upload and process using Audio Lab.
            </p>
          </div>
        </div>

        {/* Legal Links Section */}
        <LegalLinks />

        <Separator className="my-6 bg-border/50" />

        {/* Copyright and Disclaimers */}
        <div className="text-xs">
          <p>
            Audio Lab utilizes various open-source libraries and technologies. All processing is done locally in your browser,
            ensuring your audio files are not uploaded to any server for the effects application.
            This application is for demonstration and educational purposes.
            While we strive for accuracy and stability, use these tools responsibly and always back up your original work.
            The effects are based on standard digital signal processing techniques and Web Audio API functionalities.
            The quality of the output may vary depending on the source material and the parameters chosen.
            Experimentation is encouraged to achieve desired results. Please note that "8D Audio" is a perceptual effect
            best experienced with headphones and its effectiveness can be subjective.
            The "Tune to 432Hz" feature alters the pitch based on a mathematical ratio; its perceived benefits are a subject of ongoing discussion.
          </p>
          <p className="mt-4">
            &copy; {new Date().getFullYear()} Audio Lab. All rights reserved. (Placeholder copyright for demo purposes).
            This is a fictional entity for this application. No real-world services are implied or offered.
            Further development might include more advanced features, AI-powered enhancements, and collaborative tools.
            Feedback and suggestions are always welcome as we aim to improve and expand Audio Lab's capabilities.
            Remember to save your work frequently by exporting the processed audio.
          </p>
        </div>
      </div>
    </footer>
  );
}
