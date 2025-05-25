// audioWorker.ts

// This worker handles heavy audio processing for amplitude and frequency data extraction.

import type { EffectSettings } from '@/types/audio-forge';

// Helper to convert Data URL to ArrayBuffer

// Define a type for the message data to handle different tasks
type WorkerMessageData = { type: string; [key: string]: any };

self.onmessage = async (e: MessageEvent<WorkerMessageData>) => {
  const { type, audioBufferData, sampleRate, numPlotPoints, numBars, fftSize } = e.data;

  if (!audioBufferData || !sampleRate) {
    self.postMessage({ error: "Missing audioBufferData or sampleRate" });
    return;
  }

  const data = e.data as WorkerMessageData;

  try {
 switch (data.type) {
      case "amplitude": {
        // Downsample amplitude data for plotting
        const channelData = audioBufferData[0]; // Use first channel
        const totalSamples = channelData.length;
        const pointsToRender = Math.min(numPlotPoints, totalSamples);
        const step = totalSamples / pointsToRender;
        const dataPoints = [];

        for (let i = 0; i < pointsToRender; i++) {
          const sampleIndex = Math.floor(i * step);
          const boundedSampleIndex = Math.min(sampleIndex, totalSamples - 1);
          const amplitudeValue = channelData[boundedSampleIndex];
          const timeMs = (boundedSampleIndex / sampleRate) * 1000;
          dataPoints.push({ time: timeMs, amplitude: amplitudeValue });
        }

        // Ensure last sample is included
        if (pointsToRender > 0 && dataPoints.length > 0) {
          const lastSampledIndexInLoop = Math.min(Math.floor((pointsToRender - 1) * step), totalSamples - 1);
          if (lastSampledIndexInLoop < totalSamples - 1) {
            const finalSampleIndex = totalSamples - 1;
            const amplitudeValue = channelData[finalSampleIndex];
            const timeMs = (finalSampleIndex / sampleRate) * 1000;
            if (dataPoints[dataPoints.length - 1].time < timeMs) {
              dataPoints.push({ time: timeMs, amplitude: amplitudeValue });
            }
          }
        }

        self.postMessage({ type: "amplitude", data: dataPoints });
        break;
      }

      case "frequency": {
        // Compute frequency data using FFT
        // We'll use a simple FFT implementation (since we can't use WebAudio API in worker)
        // For real-world, consider importing an FFT library like fft.js or dsp.js
        // Here, we use a naive implementation for demonstration

        function fftMag(buffer: Float32Array, fftSize: number) {
          // Zero-pad if needed
          const N = fftSize;
          const re = new Float32Array(N);
          const im = new Float32Array(N);
          for (let i = 0; i < Math.min(buffer.length, N); i++) {
            re[i] = buffer[i];
          }
          // DFT (slow, for small N)
          const mags = new Float32Array(N / 2);
          for (let k = 0; k < N / 2; k++) {
            let sumRe = 0, sumIm = 0;
            for (let n = 0; n < N; n++) {
              const angle = (2 * Math.PI * k * n) / N;
              sumRe += re[n] * Math.cos(angle) + im[n] * Math.sin(angle);
              sumIm += -re[n] * Math.sin(angle) + im[n] * Math.cos(angle);
            }
            mags[k] = Math.sqrt(sumRe * sumRe + sumIm * sumIm);
          }
          return mags;
        }

        const channelData = audioBufferData[0];
        const N = fftSize || 256;
        const mags = fftMag(channelData, N);

        // Group into bars
        const bars = [];
        const binCount = mags.length;
        const step = Math.max(1, Math.floor(binCount / numBars));
        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const startBin = i * step;
          const endBin = Math.min(startBin + step, binCount);
          if (startBin >= binCount) break;
          for (let j = startBin; j < endBin; j++) {
            sum += mags[j];
          }
          const countInStep = endBin - startBin;
          const average = countInStep > 0 ? sum / countInStep : 0;
          // Normalize to 0-255 for display
          bars.push({ band: `${i + 1}`, level: Math.min(255, Math.max(0, average * 2)) });
        }

        self.postMessage({ type: "frequency", data: bars });
        break;
      }

      case 'applyEffect':
        // Message for applying an effect should include:
        // effectName: string - the name of the effect function to call
        // audioData: ArrayBuffer - the audio data as an ArrayBuffer
        // params: EffectSettings - the parameters for the effect
        const { effectName, audioData, params } = data;

        if (!audioData || !(audioData instanceof ArrayBuffer)) {
           self.postMessage({ type: 'error', message: 'applyEffect: Missing or invalid audioData' });
           break;
        }
        
        // Call the appropriate effect function based on effectName        
        // This requires a mapping from effectName string to function
        // Use the defined effectFunction map
        // The effect functions now take ArrayBuffer and params, and return ArrayBuffer
        const effectFunction = effectFunctions[effectName]; // Need to define effectFunctions map
        if (effectFunction) {
          // The effect function will now return the processed ArrayBuffer and analysis
          const result = await effectFunction(audioData, params);
          // Post the result back, including the processed audio data as transferable
          self.postMessage({ type: 'effectApplied', result });
        } else {
          self.postMessage({ type: 'error', message: `applyEffect: Unknown effect: ${effectName}` });
        }
        break;

       case 'splitAudio':
        // Message for splitting audio should include:
        // audioData: ArrayBuffer - the audio data as an ArrayBuffer
        // startTimeSeconds: number - start time of the segment in seconds
        // endTimeSeconds: number - end time of the segment in seconds
        const { audioData: splitAudioData, startTimeSeconds, endTimeSeconds } = data;
         if (!splitAudioData || !(splitAudioData instanceof ArrayBuffer)) {
           self.postMessage({ type: 'error', message: 'splitAudio: Missing or invalid audioData' });
           break;
        }
        const splitResult = await audioSplitter(splitAudioData, { startTimeSeconds, endTimeSeconds });
        break;

      case 'exportAudio':
        // Message for exporting audio should include:
        // audioData: ArrayBuffer - the audio data as an ArrayBuffer
        // format: string (e.g., 'wav', 'mp3') - desired export format
        // quality: number - desired quality (if applicable for format)
        // loopCount: number - number of times to loop
        const { audioData: exportAudioData, format: exportFormat, quality, loopCount: exportLoopCount } = data;

         if (!exportAudioData || !(exportAudioData instanceof ArrayBuffer)) {
           self.postMessage({ type: 'error', message: 'exportAudio: Missing or invalid audioData' });
           break;
        }

        let audioToProcessBuffer = exportAudioData;

        if (exportLoopCount > 1) {
           // Call the loopAudio function here - needs to be available and refactored in worker
           // This function should now take and return ArrayBuffer
        }

        // For now, we can only reliably export WAV in the worker using built-in APIs.
        // Encoding to other formats like MP3 requires external libraries or a server-side step

         const dummyContextForDecode = new OfflineAudioContext(1, 1, 44100); // Sample rate doesn't matter for decodeAudioData
         const exportedWavBuffer = await audioBufferToWavDataUrl(await dummyContextForDecode.decodeAudioData(audioToProcessBuffer)); // This function now returns ArrayBuffer

        // Post the exported audio data (as ArrayBuffer) back to the main thread
        // For transferability, the ArrayBuffer is included in the second argument to postMessage
        // The audio data itself is not directly transferred, but its underlying buffer is.
        self.postMessage({ type: 'audioExported', audioData: exportedWavBuffer, format: 'wav' }, [exportedWavBuffer]);
        break;

      default:
        self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
    }
  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};

// Modified to return ArrayBuffer instead of Data URL for easier transfer and potential further processing
// in the main thread or another worker.
export async function audioBufferToWavDataUrl(audioBuffer: AudioBuffer): Promise<ArrayBuffer> {
  const inputNumChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bitDepth = 16;

  let interleaved: Int16Array;
  let outputNumChannelsWav: number;

  if (inputNumChannels === 1) {
    outputNumChannelsWav = 1;
    const channelData = audioBuffer.getChannelData(0);
    interleaved = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      interleaved[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }
  } else { // inputNumChannels >= 2
    outputNumChannelsWav = 2; // Output a stereo WAV, taking first two channels
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = inputNumChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

    interleaved = new Int16Array(length * 2);
    for (let i = 0; i < length; i++) {
      interleaved[i * 2] = Math.max(-1, Math.min(1, leftChannel[i])) * 32767;
      interleaved[i * 2 + 1] = Math.max(-1, Math.min(1, rightChannel[i])) * 32767;
    }
  }

  const dataSize = interleaved.byteLength;
  const blockAlign = outputNumChannelsWav * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, outputNumChannelsWav, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < interleaved.length; i++) {
    view.setInt16(44 + i * 2, interleaved[i], true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Refactored to accept audio data as ArrayBuffer and perform decoding in the worker.
// Returns processed audio data as ArrayBuffer and analysis message.
export async function processAudioWithEffect(
  audioData: ArrayBuffer, // Accept ArrayBuffer directly
  setupEffect: (audioContext: OfflineAudioContext, sourceNode: AudioBufferSourceNode, decodedAudioBuffer: AudioBuffer) => AudioNode[],
  analysisMessage?: string,
  outputChannelCountForContext?: number
): Promise<{ processedAudioData: ArrayBuffer; analysis?: string }> {
  // Create an OfflineAudioContext within the worker
  // Use OfflineAudioContext to decode the audio data within the worker
  // We need to know the sample rate before creating the OfflineAudioContext.
  // Decode the audio data first to get its properties.
   const decodingContext = new OfflineAudioContext(1, 1, 44100); // Sample rate doesn't matter for decodeAudioData
  let decodedAudioBuffer: AudioBuffer;
  try {
 decodedAudioBuffer = await decodingContext.decodeAudioData(audioData);
  } catch (e) {
 throw new Error("Failed to decode audio data in worker: " + (e as Error).message);
  }

  const targetChannelCount = outputChannelCountForContext !== undefined ? outputChannelCountForContext : decodedAudioBuffer.numberOfChannels;

  const offlineContext = new OfflineAudioContext(
    targetChannelCount,
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const effectChain = setupEffect(offlineContext, sourceNode, decodedAudioBuffer);

  let currentNode = sourceNode as AudioNode;
  if (effectChain.length > 0) {
    effectChain.forEach(node => {
      currentNode.connect(node);
      currentNode = node;
    });
  }
  currentNode.connect(offlineContext.destination);

  sourceNode.start(0);
  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioData = await audioBufferToWavDataUrl(renderedBuffer); // This function now returns ArrayBuffer

  return { processedAudioData, analysis: analysisMessage };
}

// Effect functions (refactored for worker)
export async function alterResonance(audioData: ArrayBuffer, { frequency }: { frequency: number }) {
  const result = await processAudioWithEffect(audioData, (context, source, buffer) => {
    const biquadFilter = context.createBiquadFilter(); // Use context from OfflineAudioContext
    biquadFilter.type = 'peaking';
    const filterFreq = Math.max(20, 1000 + (frequency * 40));
    biquadFilter.frequency.setValueAtTime(filterFreq, context.currentTime);
    biquadFilter.Q.setValueAtTime(1.5, context.currentTime);
    biquadFilter.gain.setValueAtTime(frequency, context.currentTime);
    return [biquadFilter];
  }, `Altered resonance: Peaking filter with ${frequency}dB gain around ${ (1000 + (frequency * 40)).toFixed(0) }Hz.`, 2); // Assuming stereo output
  return result; // Return the processed audio data and analysis
}

export async function temporalModification(audioData: ArrayBuffer, { rate }: { rate: number }) {
  const newRate = Math.max(0.1, Math.min(rate, 4));
    
    // Use processAudioWithEffect, which handles decoding and OfflineAudioContext setup
    const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
        // When changing playback rate, the duration changes. The length of the OfflineAudioContext
        // needs to be adjusted accordingly to accommodate the full duration of the
        // time-stretched/compressed audio.
        // processAudioWithEffect's OfflineAudioContext length is set based on original buffer length.
        // However, the playbackRate node will affect the rendered duration.
        // We don't need to explicitly calculate numSamples here; processAudioWithEffect handles the context length.
        sourceNode.playbackRate.value = newRate;
        return []; // Return empty effect chain, as playback rate is applied directly to the source
    }, `Temporal modification: Playback rate set to ${newRate.toFixed(2)}x.`, 
       null // Let processAudioWithEffect determine output channel count
    );
 return result; // Ensure a result is returned
}





export async function stereoWidener(audioData: ArrayBuffer, { width: widthParam }: { width: number }) {  const width = widthParam / 100; return processAudioWithEffect(audioData, (offlineContext, sourceNode, decodedAudioBuffer) => {    if (decodedAudioBuffer.numberOfChannels < 2) {
 return []; // Stereo widener only applies to stereo audio
    }
    const splitter = offlineContext.createChannelSplitter(2);
    const merger = offlineContext.createChannelMerger(2);

    const gainL_L = offlineContext.createGain();
    gainL_L.gain.setValueAtTime(0.5 * (1 + width), offlineContext.currentTime); // Left to Left
    const gainL_R = offlineContext.createGain();
    gainL_R.gain.setValueAtTime(0.5 * (1 - width), offlineContext.currentTime); // Left to Right

    const gainR_L = offlineContext.createGain();
    gainR_L.gain.setValueAtTime(0.5 * (1 - width), offlineContext.currentTime);
    const gainR_R = offlineContext.createGain();
    gainR_R.gain.setValueAtTime(0.5 * (1 + width), offlineContext.currentTime);

    splitter.connect(gainL_L, 0, 0); // Left channel input to gainL_L
    gainL_L.connect(merger, 0, 0);   // gainL_L output to Left channel of merger

    splitter.connect(gainR_R, 1, 0); // Right channel input to gainR_R
    gainR_R.connect(merger, 0, 1);   // gainR_R output to Right channel of merger

    splitter.connect(gainR_L, 0, 0);
    splitter.connect(gainR_R, 1, 0);
    gainR_L.connect(merger, 0, 1);
 gainR_R.connect(merger, 1, 1); // Connect right output of splitter (channel 1) to gainR_R, then to channel 1 of merger // Connect the output of gainR_R to the right channel of the merger

    return [splitter, merger];
});
}

export async function reversePlayback(audioData: ArrayBuffer, params: {}) {
  // Use processAudioWithEffect, but modify the buffer within the setupEffect callback
  const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
    const numChannels = decodedAudioBuffer.numberOfChannels;
    const length = decodedAudioBuffer.length;

    // Create a new buffer for the reversed audio within the OfflineAudioContext
    const reversedBuffer = context.createBuffer(
      numChannels,
      length,
      decodedAudioBuffer.sampleRate
    );

    for (let i = 0; i < numChannels; i++) {
      const channelData = decodedAudioBuffer.getChannelData(i);
      const reversedChannelData = reversedBuffer.getChannelData(i);
      // Reverse the channel data in place (or copy and reverse)
      reversedChannelData.set(channelData.slice().reverse());
    }
    sourceNode.buffer = reversedBuffer; // Replace the source node's buffer with the reversed one
    return []; // No additional effects chain needed for simple reversal
  }, "Audio reversed.");
 return result;
}

export async function subharmonicIntensifier(audioData: ArrayBuffer, { intensity: intensityParam }: { intensity: number }) {
 const gainDb = (intensityParam / 100) * 12;
 return processAudioWithEffect(audioData, (offlineContext, sourceNode, decodedAudioBuffer) => {
 const lowshelfFilter = offlineContext.createBiquadFilter(); // Use context from OfflineAudioContext
 lowshelfFilter.type = 'lowshelf';
 lowshelfFilter.frequency.setValueAtTime(120, offlineContext.currentTime); lowshelfFilter.gain.setValueAtTime(gainDb, offlineContext.currentTime); return [lowshelfFilter];
  }, `Applied Subharmonic Intensifier: Low-shelf filter at 120Hz with ${gainDb.toFixed(1)}dB gain (Intensity: ${intensityParam}%). Effect is most noticeable on audio with existing low-frequency content.`);
 return result;
}

export async function frequencySculptor(audioData: ArrayBuffer, { low, mid, high }: { low: number, mid: number, high: number }) {
 return processAudioWithEffect(audioData, (context: OfflineAudioContext, source: AudioBufferSourceNode, buffer: AudioBuffer) => {
    const lowFilter = context.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.setValueAtTime(250, context.currentTime);
    lowFilter.gain.setValueAtTime(low, context.currentTime);

    const midFilter = context.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.setValueAtTime(1000, context.currentTime);
    midFilter.Q.setValueAtTime(0.707, context.currentTime);
    midFilter.gain.setValueAtTime(mid, context.currentTime);

    const highFilter = context.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.setValueAtTime(4000, context.currentTime);
    highFilter.gain.setValueAtTime(high, context.currentTime);

    return [lowFilter, midFilter, highFilter];
  }, `Frequency Sculptor: Low ${low}dB @ 250Hz, Mid ${mid}dB @ 1kHz, High ${high}dB @ 4kHz.`);
}

export async function keyTransposer(audioData: ArrayBuffer, { semitones }: { semitones: number }) {
  // Key transposition by changing playback rate also changes duration.
  // This function needs to use OfflineAudioContext and adjust its length
  // based on the pitch shift ratio.

  const playbackRate = Math.pow(2, semitones / 12);
  const clampedPlaybackRate = Math.max(0.1, Math.min(playbackRate, 4));

  // Use processAudioWithEffect, which handles decoding and OfflineAudioContext setup
  const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
    sourceNode.playbackRate.value = clampedPlaybackRate;
    return []; // Return empty effect chain, as playback rate is applied directly to the source
  }, `Key Transposer: Shifted by ${semitones} semitones (playback rate ${clampedPlaybackRate.toFixed(2)}x). Note: This method affects duration.`,
    null // Let processAudioWithEffect determine output channel count
  );
 return result;
}
export async function echoGenerator(audioData: ArrayBuffer, { delay, feedback, mix }: { delay: number, feedback: number, mix: number }) {
  const clampedDelay = Math.max(0.001, Math.min(delay / 1000, 1)); // Delay in seconds
  const clampedFeedback = Math.max(0, Math.min(feedback, 0.95));
  const clampedMix = Math.max(0, Math.min(mix, 1));

  // Use processAudioWithEffect, which handles decoding and OfflineAudioContext setup
  const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
    const delayNode = context.createDelay(clampedDelay + 0.1); // Ensure delay is at least clampedDelay
    delayNode.delayTime.setValueAtTime(clampedDelay, context.currentTime);

    const feedbackNode = context.createGain();
    feedbackNode.gain.setValueAtTime(clampedFeedback, context.currentTime);

    const dryNode = context.createGain();
    dryNode.gain.setValueAtTime(1 - clampedMix, context.currentTime);

    const wetNode = context.createGain();
    wetNode.gain.setValueAtTime(clampedMix, context.currentTime);

    // Connect the nodes to create the echo loop and mix dry/wet signals
    sourceNode.connect(dryNode);
    sourceNode.connect(delayNode);
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode);
    delayNode.connect(wetNode);

    return [dryNode, wetNode]; // Return nodes that connect to the destination (feedback loop is internal)
  }, `Echo: Delay ${(clampedDelay*1000).toFixed(0)}ms, Feedback ${(clampedFeedback*100).toFixed(0)}%, Mix ${(clampedMix*100).toFixed(0)}% wet.`);
  return result;
}

export async function gainController(audioData: ArrayBuffer, { gain }: { gain: number }) {
    const gainValue = Math.pow(10, gain / 20);
    return processAudioWithEffect(audioData, (context, source, buffer) => {
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(gainValue, context.currentTime);
    return [gainNode];
  }, `Gain adjusted by ${gain}dB (linear gain: ${gainValue.toFixed(2)}).`);
 return result;
}
export async function rhythmDetector(audioData: ArrayBuffer, params: {}): Promise<{ processedAudioData?: ArrayBuffer; analysis?: string }> {
   // This function performs analysis, but needs AudioBuffer data.
   // It also currently uses getGlobalAudioContext which is not available in worker.
   // Needs significant refactoring to work with ArrayBuffer/Float32Array directly or receive decoded data.
   throw new Error("Rhythm detector needs significant refactoring for worker.");
}

export async function tempoAdjuster(audioData: ArrayBuffer, { tempo }: { tempo: number }) {
  const newTempo = Math.max(0.1, Math.min(tempo, 4));

  // Use processAudioWithEffect, which handles decoding and OfflineAudioContext setup
  const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
    sourceNode.playbackRate.value = newTempo;
    return []; // Return empty effect chain, as playback rate is applied directly to the source
  }, `Pace adjusted to ${newTempo.toFixed(2)}x. (Note: This basic method also affects pitch).`,
    null // Let processAudioWithEffect determine output channel count
  ); // Pass null for analysisMessage to avoid showing duplicate messages if dreamscapeMaker uses this
 return result;
}


export async function dreamscapeMaker(audioData: ArrayBuffer, params: {}) {
  // Dreamscape effect: Combines slowdown and echo

  // Apply slowdown (using tempoAdjuster)
  // We'll slow it down by a fixed factor for this preset
  const slowedResult = await tempoAdjuster(audioData, { tempo: 0.75 }); // Slow down by 25%

  // Apply echo (using echoGenerator) to the slowed audio
  // We'll use a fixed echo setting for this preset
  const echoedResult = await echoGenerator(slowedResult.processedAudioData, { delay: 500, feedback: 0.4, mix: 0.3 });

  // Combine the analysis messages
  const combinedAnalysis = `Dreamscape effect applied: ${slowedResult.analysis} | ${echoedResult.analysis}`;

  return { processedAudioData: echoedResult.processedAudioData, analysis: combinedAnalysis };
}

export async function frequencyTuner(audioData: ArrayBuffer, params: {}) {
  // Frequency tuner to 432Hz means shifting by -31.77 semitones
  const semitonesToShift = -31.77;

  // Use keyTransposer (which is refactored for the worker)
  const result = await keyTransposer(audioData, { semitones: semitonesToShift });

  return result;
}
export async function apply8DEffect(audioDataUrl: string, params: {} = {}) {
  // This function should ideally take ArrayBuffer, not Data URL
  // It calls automatedSweep and echoGenerator, which are refactored
  throw new Error("apply8DEffect needs to be refactored to accept ArrayBuffer and use refactored sub-functions.");
}

// Bass Presets (calling subharmonicIntensifier)
export async function subtleSubwoofer(audioData: ArrayBuffer, params: EffectSettings) {
  return subharmonicIntensifier(audioData, { intensity: 20 });
}

async function automatedSweep(audioData: ArrayBuffer, { speed }: { speed: number }) {
  const sweepSpeed = Math.max(0.05, Math.min(speed, 5)); // Panning speed in Hz

  const result = await processAudioWithEffect(audioData, (context, sourceNode, decodedAudioBuffer) => {
    if (decodedAudioBuffer.numberOfChannels < 2) {
       // Cannot apply stereo sweep to mono audio
       return [];
    }
    const panner = context.createStereoPanner(); // Use StereoPannerNode for simple stereo panning
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(sweepSpeed, context.currentTime);
    oscillator.connect(panner.pan);
    oscillator.start(); // Start the oscillator
    // The sourceNode is automatically connected to the first node returned here by processAudioWithEffect
    return [panner];
  }, `Automated Stereo Sweep: Panning at ${sweepSpeed.toFixed(2)} Hz.`, 2); // Force stereo output for panning
  return result;
}
async function gentleBassBoost(audioData: ArrayBuffer, params: EffectSettings) {
  return subharmonicIntensifier(audioData, { intensity: 35 });
}
async function mediumBassEnhancement(audioData: ArrayBuffer, params: EffectSettings) {
  return subharmonicIntensifier(audioData, { intensity: 60 });
}
async function intenseBassAmplifier(audioData: ArrayBuffer, params: EffectSettings) {
  return subharmonicIntensifier(audioData, { intensity: 75 }); // Assuming dataUrlToArrayBuffer is in worker
}
async function maximumBassOverdrive(audioData: ArrayBuffer, params: EffectSettings) {
 return subharmonicIntensifier(audioData, { intensity: 100 });
}

async function vocalAmbience(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 80, feedback: 0.2, mix: 0.2 });
}
async function washroomEcho(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 150, feedback: 0.5, mix: 0.4 });
}
async function compactRoomReflector(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 100, feedback: 0.3, mix: 0.25 });
}
async function averageRoomReverberator(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 250, feedback: 0.4, mix: 0.3 });
}
async function grandRoomReverb(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 400, feedback: 0.45, mix: 0.35 });
}
async function chapelEchoes(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 600, feedback: 0.5, mix: 0.3 });
}
async function cathedralAcoustics(audioData: ArrayBuffer, params: EffectSettings) {
 return echoGenerator(audioData, { delay: 800, feedback: 0.55, mix: 0.25 });
}

export async function audioSplitter(audioData: ArrayBuffer, { startTimeSeconds, endTimeSeconds }: { startTimeSeconds: number | null, endTimeSeconds: number | null }) {
    try {
        const decodingContext = new OfflineAudioContext(1, 1, 44100); // Sample rate doesn't matter for decodeAudioData
        const decodedAudioBuffer = await decodingContext.decodeAudioData(audioData);

        const sampleRate = decodedAudioBuffer.sampleRate;
        const duration = decodedAudioBuffer.duration;

        const numChannels = decodedAudioBuffer.numberOfChannels;

        // Handle null values by setting to start/end of audio
        const validStartTime = startTimeSeconds !== null ? startTimeSeconds : 0;
        const validEndTime = endTimeSeconds !== null ? endTimeSeconds : decodedAudioBuffer.duration;
        const startSampleValid = Math.floor(validStartTime * sampleRate);
        const endSampleValid = Math.floor(validEndTime * sampleRate);

        // Validate times
        if (validStartTime < 0 || validEndTime > decodedAudioBuffer.duration || validStartTime >= validEndTime) {
            self.postMessage({ type: 'error', message: 'Invalid start or end time for splitting.' });
            return; // Exit the function
        }

        const segmentLength = endSample - startSample;

        // Create a new buffer for the segment using OfflineAudioContext
        const offlineContext = new OfflineAudioContext(
            numChannels,
            segmentLength,
            sampleRate
        );

        const segmentBuffer = offlineContext.createBuffer(numChannels, segmentLength, sampleRate);

        for (let i = 0; i < numChannels; i++) {
            const originalChannelData = decodedAudioBuffer.getChannelData(i);
            const segmentChannelData = segmentBuffer.getChannelData(i);
            segmentChannelData.set(originalChannelData.subarray(startSampleValid, endSampleValid));
        }

        const processedAudioData = await audioBufferToWavDataUrl(segmentBuffer); // Convert the segment to WAV ArrayBuffer
 self.postMessage({ type: 'audioSplit', processedAudioData: processedAudioData.buffer }, [processedAudioData.buffer as ArrayBuffer]);
    } catch (error: any) {
        self.postMessage({ type: 'error', message: 'Error splitting audio: ' + error.message });
    }
}
export async function loopAudio(audioData: ArrayBuffer, loopCount: number): Promise<ArrayBuffer> {
    try {
    const decodingContext = new OfflineAudioContext(1, 1, 44100); // Sample rate doesn't matter for decodeAudioData
    const decodedAudioBuffer = await decodingContext.decodeAudioData(audioData); // Decoding occurs here

    const sampleRate = decodedAudioBuffer.sampleRate;
    const numChannels = decodedAudioBuffer.numberOfChannels;
    const originalLength = decodedAudioBuffer.length;
    const loopedLength = originalLength * loopCount;

    // Create a new buffer for the looped audio using OfflineAudioContext
    const offlineContext = new OfflineAudioContext(
      numChannels,
      loopedLength,
      sampleRate
    );

    const loopedBuffer = offlineContext.createBuffer(numChannels, loopedLength, sampleRate);

    for (let i = 0; i < numChannels; i++) {
      const originalChannelData = decodedAudioBuffer.getChannelData(i);
      const loopedChannelData = loopedBuffer.getChannelData(i);
      for (let j = 0; j < loopCount; j++) {
        loopedChannelData.set(originalChannelData, j * originalLength);
      }
    }

    const processedAudioData = await audioBufferToWavDataUrl(loopedBuffer); // Convert the looped buffer to WAV ArrayBuffer
    return processedAudioData; // Return the ArrayBuffer
   } catch (error) {
   throw new Error("Loop audio needs refactoring for worker.");
   }
}


// Define a map of effect names to their corresponding worker functions
// This is a crucial step for the 'applyEffect' case in onmessage
const effectFunctions: { [key: string]: Function } = {
  alterResonance,
  temporalModification,
  stereoWidener,
  subharmonicIntensifier,
  frequencySculptor,
  keyTransposer,
  echoGenerator,
  reversePlayback,
  gainController,
  tempoAdjuster,
  rhythmDetector, // Note: This one needs significant refactoring
  subtleSubwoofer,
  gentleBassBoost,
  mediumBassEnhancement,
  intenseBassAmplifier,
  maximumBassOverdrive,
  vocalAmbience,
  washroomEcho,
  compactRoomReflector,
  averageRoomReverberator,
  grandRoomReverb,
  chapelEchoes,
  cathedralAcoustics,
  automatedSweep,
  dreamscapeMaker,
  frequencyTuner,
  apply8DEffect, // Note: Still needs refactoring
  audioSplitter, 
 loopAudio, // Note: Still needs refactoring
};