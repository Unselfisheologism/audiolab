// @ts-nocheck
import type { EffectSettings } from '@/types/audio-forge';

// Helper function to convert ArrayBuffer to Base64 Data URL
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


const getGlobalAudioContext = (() => {
  let audioContextInstance: AudioContext | null = null;
  return () => {
    if (typeof window !== 'undefined') {
      if (!audioContextInstance || audioContextInstance.state === 'closed') {
        audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
       if (audioContextInstance && audioContextInstance.state === 'suspended') {
        audioContextInstance.resume().catch(e => console.error("Error resuming global AudioContext:", e));
      }
    }
    return audioContextInstance;
  };
})();


export const audioUtils = {
};