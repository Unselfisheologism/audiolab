// ... existing code ...
const spectrogramWorker = new Worker(new URL('../../workers/spectrogram-worker.ts', import.meta.url));

function getVisualizerData(audioBuffer: AudioBuffer, config: any) {
  return new Promise((resolve) => {
    spectrogramWorker.postMessage({ audioBuffer, config });
    spectrogramWorker.onmessage = (e) => {
      resolve(e.data.spectrogramData);
    };
  });
}
// ... existing code ...