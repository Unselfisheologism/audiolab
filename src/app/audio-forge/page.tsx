import AudioForgeClientContent from '@/components/audio-forge/AudioForgeClientContent';
import { BrowserNotSupportedFallback } from '@/components/audio-forge/BrowserNotSupportedFallback';
import { useToast } from '@/hooks/use-toast';

function isWebAudioSupported() {
  return (
    typeof AudioContext !== "undefined" ||
    typeof webkitAudioContext !== "undefined"
  );
}

export default function AudioForgePage() {
  const { toast } = useToast?.() || {};

  if (typeof window !== "undefined" && !isWebAudioSupported()) {
    if (typeof toast === "function") {
      toast({
        title: "Browser Not Supported",
        description: "Your browser does not support the Web Audio API. Please try using Chrome, Firefox, or Edge.",
        variant: "destructive",
      });
    }
    return <BrowserNotSupportedFallback />;
  }

  return <AudioForgeClientContent />;
}