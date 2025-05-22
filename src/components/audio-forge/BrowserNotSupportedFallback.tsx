import { Button } from "@/components/ui/button";

export function BrowserNotSupportedFallback() {
  // Safari detection (client-side)
  const isSafari = typeof window !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Browser Compatibility Issue</h2>
      <p className="text-muted-foreground mb-4">
        {isSafari
          ? "Safari has limited support for the Web Audio API. Some features may not work as expected. For best results, use Chrome, Firefox, or Edge."
          : "The Web Audio API is not fully supported in your browser."}
      </p>
      <ul className="list-disc list-inside text-left space-y-1 mb-4">
        <li>Try using Chrome, Firefox, or Edge</li>
        <li>Ensure Safari settings allow audio processing (Settings &gt; Websites &gt; Audio Forge)</li>
        <li>Use a desktop device for better compatibility</li>
      </ul>
      <Button onClick={() => window.location.reload()}>
        Try Again in a Supported Browser
      </Button>
    </div>
  );
}