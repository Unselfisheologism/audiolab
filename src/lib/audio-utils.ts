// @ts-nocheck
// Helper function to convert ArrayBuffer to Base64 Data URL
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to decode Base64 Data URL to ArrayBuffer
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

// Helper function to convert AudioBuffer to WAV Data URL
async function audioBufferToWavDataUrl(audioBuffer: AudioBuffer): Promise<string> {
  // Simple WAV encoder
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const blockAlign = numChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;

  let interleaved = new Int16Array(0);
  if (numChannels === 1) {
    const channelData = audioBuffer.getChannelData(0);
    interleaved = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      interleaved[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }
  } else if (numChannels >= 2) { // Handle stereo and multi-channel (downmixing to stereo for WAV if > 2)
    const actualNumChannelsForWav = Math.min(numChannels, 2); // WAV supports mono or stereo well here
    const samples = [];
    for (let ch = 0; ch < actualNumChannelsForWav; ch++) {
      samples.push(audioBuffer.getChannelData(ch));
    }
    const length = samples[0].length;
    interleaved = new Int16Array(length * actualNumChannelsForWav);

    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < actualNumChannelsForWav; ch++) {
        interleaved[i * actualNumChannelsForWav + ch] = Math.max(-1, Math.min(1, samples[ch][i])) * 32767;
      }
    }
  }
  
  const dataSize = interleaved.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const wavChannels = Math.min(numChannels, 2); // Standard WAV usually mono/stereo

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, wavChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * wavChannels * (bitDepth / 8), true); // Corrected byteRate for wav
  view.setUint16(32, wavChannels * (bitDepth / 8), true); // Corrected blockAlign for wav
  view.setUint16(34, bitDepth, true);
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < interleaved.length; i++) {
    view.setInt16(44 + i * 2, interleaved[i], true);
  }

  const blob = new Blob([view], { type: 'audio/wav' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


const getGlobalAudioContext = (() => {
  let audioContextInstance: AudioContext | null = null;
  return () => {
    if (typeof window !== 'undefined') {
      if (!audioContextInstance || audioContextInstance.state === 'closed') {
        audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    }
    return audioContextInstance;
  };
})();


const processAudioWithEffect = async (
  audioDataUrl: string,
  setupEffect: (audioContext: OfflineAudioContext, sourceNode: AudioBufferSourceNode, decodedAudioBuffer: AudioBuffer) => AudioNode[], // Returns array of connected nodes
  analysisMessage?: string
): Promise<{ processedAudioDataUrl: string; analysis?: string }> => {
  const audioContext = getGlobalAudioContext();
  if (!audioContext) {
    throw new Error("AudioContext not supported or initialized.");
  }
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const effectChain = setupEffect(offlineContext, sourceNode, decodedAudioBuffer);

  if (effectChain.length > 0) {
    let currentNode = sourceNode as AudioNode;
    effectChain.forEach(node => {
      currentNode.connect(node);
      currentNode = node;
    });
    currentNode.connect(offlineContext.destination);
  } else { 
    sourceNode.connect(offlineContext.destination);
  }
  
  sourceNode.start(0);
  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  return { processedAudioDataUrl, analysis: analysisMessage };
};


export const audioUtils = {
  alterResonance: async (audioDataUrl: string, { frequency }: { frequency: number }) => {
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const biquadFilter = context.createBiquadFilter();
      biquadFilter.type = 'peaking';
      const filterFreq = Math.max(20, 1000 + (frequency * 100)); 
      biquadFilter.frequency.setValueAtTime(filterFreq, context.currentTime); 
      biquadFilter.Q.setValueAtTime(1.5, context.currentTime); 
      biquadFilter.gain.setValueAtTime(frequency, context.currentTime); 
      return [biquadFilter];
    }, `Altered resonance: Peaking filter at ${frequency}dB gain around ${ (1000 + (frequency * 100)).toFixed(0) }Hz.`);
  },

  temporalModification: async (audioDataUrl: string, { rate }: { rate: number }) => {
    const audioContext = getGlobalAudioContext();
     if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const newRate = Math.max(0.1, Math.min(rate, 4)); 
    const numSamples = Math.max(1, Math.ceil(decodedAudioBuffer.length / newRate));

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        numSamples,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(newRate, 0);
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: `Temporal modification: Playback rate set to ${newRate.toFixed(2)}x.` };
  },

  stereoWidener: async (audioDataUrl: string, { width: widthParam }: { width: number }) => {
    return processAudioWithEffect(audioDataUrl, (offlineContext, sourceNode, decodedAudioBuffer) => {
      if (decodedAudioBuffer.numberOfChannels < 2) {
        // Return empty array, processAudioWithEffect will handle pass-through
        return []; 
      }
  
      const width = widthParam / 100; // Convert percentage to 0-2 range
  
      const splitter = offlineContext.createChannelSplitter(2);
      const merger = offlineContext.createChannelMerger(2);
  
      const gainL_to_L = offlineContext.createGain();
      const gainR_to_L = offlineContext.createGain();
      const gainL_to_R = offlineContext.createGain();
      const gainR_to_R = offlineContext.createGain();
  
      gainL_to_L.gain.value = (1 + width) / 2;
      gainR_to_L.gain.value = (1 - width) / 2;
      gainL_to_R.gain.value = (1 - width) / 2;
      gainR_to_R.gain.value = (1 + width) / 2;
      
      sourceNode.connect(splitter);
  
      splitter.connect(gainL_to_L, 0); 
      splitter.connect(gainR_to_L, 1); 
      gainL_to_L.connect(merger, 0, 0); 
      gainR_to_L.connect(merger, 0, 0); 
  
      splitter.connect(gainL_to_R, 0); 
      splitter.connect(gainR_to_R, 1); 
      gainL_to_R.connect(merger, 0, 1); 
      gainR_to_R.connect(merger, 0, 1);
  
      return [splitter, gainL_to_L, gainR_to_L, gainL_to_R, gainR_to_R, merger];
    }, `Stereo Widener: Width set to ${widthParam}%. Applied only if audio is stereo.`);
  },
  
  subharmonicIntensifier: async (audioDataUrl: string, { intensity: intensityParam }: { intensity: number }) => {
    const gainDb = (intensityParam / 100) * 12; // Max 12dB boost for intensity 100

    return processAudioWithEffect(audioDataUrl, (offlineContext, sourceNode, decodedAudioBuffer) => {
      const lowshelfFilter = offlineContext.createBiquadFilter();
      lowshelfFilter.type = 'lowshelf';
      lowshelfFilter.frequency.setValueAtTime(120, offlineContext.currentTime); 
      lowshelfFilter.gain.setValueAtTime(gainDb, offlineContext.currentTime);
      return [lowshelfFilter];
    }, `Applied Subharmonic Intensifier: Low-shelf filter at 120Hz with ${gainDb.toFixed(1)}dB gain (Intensity: ${intensityParam}%).`);
  },

  frequencySculptor: async (audioDataUrl: string, { low, mid, high }: { low: number, mid: number, high: number }) => {
     return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const lowFilter = context.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.setValueAtTime(250, context.currentTime); 
      lowFilter.gain.setValueAtTime(low, context.currentTime);

      const midFilter = context.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.setValueAtTime(1000, context.currentTime); 
      midFilter.Q.setValueAtTime(1, context.currentTime); 
      midFilter.gain.setValueAtTime(mid, context.currentTime);

      const highFilter = context.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.setValueAtTime(4000, context.currentTime); 
      highFilter.gain.setValueAtTime(high, context.currentTime);
      
      return [lowFilter, midFilter, highFilter];
    }, `Frequency Sculptor: Low ${low}dB @ 250Hz, Mid ${mid}dB @ 1kHz, High ${high}dB @ 4kHz.`);
  },

  keyTransposer: async (audioDataUrl: string, { semitones }: { semitones: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const playbackRate = Math.pow(2, semitones / 12);
    const clampedPlaybackRate = Math.max(0.1, Math.min(playbackRate, 4)); 
    const newLength = Math.max(1, Math.round(decodedAudioBuffer.length / clampedPlaybackRate));

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(clampedPlaybackRate, 0);
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Key Transposer: Shifted by ${semitones} semitones (rate ${clampedPlaybackRate.toFixed(2)}x).` };
  },

  echoGenerator: async (audioDataUrl: string, { delay, feedback, mix }: { delay: number, feedback: number, mix: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const clampedDelay = Math.max(0.001, Math.min(delay / 1000, audioContext.sampleRate)); 
    const clampedFeedback = Math.max(0, Math.min(feedback, 0.95));
    const clampedMix = Math.max(0, Math.min(mix, 1));

    let tailExtensionFactor = 0;
    if (clampedFeedback > 0) {
        const numSignificantTaps = clampedFeedback > 0.1 ? Math.abs(Math.log(0.001) / Math.log(clampedFeedback)) : 5;
        tailExtensionFactor = numSignificantTaps * clampedDelay;
    } else {
        tailExtensionFactor = clampedDelay * 2; 
    }
    const tailExtensionSeconds = Math.min(tailExtensionFactor, 30); 
    
    const extendedLength = decodedAudioBuffer.length + Math.floor(audioContext.sampleRate * tailExtensionSeconds);
    
    const offlineContext = new OfflineAudioContext(
      decodedAudioBuffer.numberOfChannels,
      Math.max(1, extendedLength), 
      decodedAudioBuffer.sampleRate
    );
    
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const delayNode = offlineContext.createDelay(clampedDelay + 1); 
    delayNode.delayTime.setValueAtTime(clampedDelay, 0);

    const feedbackNode = offlineContext.createGain();
    feedbackNode.gain.setValueAtTime(clampedFeedback, 0);

    const dryNode = offlineContext.createGain();
    dryNode.gain.setValueAtTime(1 - clampedMix, 0);
    
    const wetNode = offlineContext.createGain();
    wetNode.gain.setValueAtTime(clampedMix, 0);

    sourceNode.connect(dryNode);
    dryNode.connect(offlineContext.destination);

    sourceNode.connect(delayNode);
    delayNode.connect(wetNode);
    wetNode.connect(offlineContext.destination);

    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode); 
    
    sourceNode.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: `Echo: Delay ${clampedDelay*1000}ms, Feedback ${(clampedFeedback*100).toFixed(0)}%, Mix ${(clampedMix*100).toFixed(0)}% wet.` };
  },

  reversePlayback: async (audioDataUrl: string, params: {}) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = decodedAudioBuffer.numberOfChannels;
    const length = decodedAudioBuffer.length;

    const reversedBuffer = audioContext.createBuffer(
      numChannels,
      length,
      decodedAudioBuffer.sampleRate
    );

    for (let i = 0; i < numChannels; i++) {
      const channelData = decodedAudioBuffer.getChannelData(i);
      const reversedChannelData = reversedBuffer.getChannelData(i);
      const originalChannelDataCopy = new Float32Array(channelData); 
      for (let j = 0; j < length; j++) {
        reversedChannelData[j] = originalChannelDataCopy[length - 1 - j];
      }
    }
    
    const offlineContext = new OfflineAudioContext(numChannels, length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = reversedBuffer;
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);

    const renderedOutputBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedOutputBuffer);
    return { processedAudioDataUrl, analysis: "Audio reversed." };
  },

  paceAdjuster: async (audioDataUrl: string, { tempo }: { tempo: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const newTempo = Math.max(0.1, Math.min(tempo, 4)); 
    const newLength = Math.max(1, Math.round(decodedAudioBuffer.length / newTempo));
    
    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(newTempo, 0); 
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Pace adjusted to ${newTempo.toFixed(2)}x. (Note: This method also affects pitch).` };
  },

  gainController: async (audioDataUrl: string, { gain }: { gain: number }) => {
    const gainValue = Math.pow(10, gain / 20); 
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);
      return [gainNode];
    }, `Gain adjusted by ${gain}dB (linear gain: ${gainValue.toFixed(2)}).`);
  },

  rhythmDetector: async (audioDataUrl: string, params: {}) => {
    const analysis = "BPM Analysis: Feature not fully implemented. Placeholder result: Estimated 120 BPM.";
    return { processedAudioDataUrl: audioDataUrl, analysis }; 
  },

  dreamscapeMaker: async (audioDataUrl: string, params: {}) => {
    const slowedResult = await audioUtils.paceAdjuster(audioDataUrl, { tempo: 0.75 });
    const dreamResult = await audioUtils.echoGenerator(slowedResult.processedAudioDataUrl, { delay: 200, feedback: 0.4, mix: 0.35 });
    return { ...dreamResult, analysis: "Dreamscape Maker: Applied slow down and echo." };
  },

  frequencyTuner: async (audioDataUrl: string, params: {}) => { 
    const pitchShiftRatio = 432 / 440; 
    const semitones = 12 * Math.log2(pitchShiftRatio);
    const result = await audioUtils.keyTransposer(audioDataUrl, { semitones });
    return { ...result, analysis: `Tuned to 432Hz (approx. ${semitones.toFixed(2)} semitones shift).` };
  },

  subtleSubwoofer: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 20 }),
  gentleBassBoost: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 40 }),
  mediumBassEnhancement: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 60 }),
  intenseBassAmplifier: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 80 }),
  maximumBassOverdrive: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 100 }),

  vocalAmbience: (d, p) => audioUtils.echoGenerator(d, { delay: 80, feedback: 0.2, mix: 0.2 }),
  washroomEcho: (d, p) => audioUtils.echoGenerator(d, { delay: 150, feedback: 0.5, mix: 0.4 }),
  compactRoomReflector: (d, p) => audioUtils.echoGenerator(d, { delay: 100, feedback: 0.3, mix: 0.25 }),
  averageRoomReverberator: (d, p) => audioUtils.echoGenerator(d, { delay: 250, feedback: 0.4, mix: 0.3 }),
  grandRoomReverb: (d, p) => audioUtils.echoGenerator(d, { delay: 400, feedback: 0.45, mix: 0.35 }),
  chapelEchoes: (d, p) => audioUtils.echoGenerator(d, { delay: 600, feedback: 0.5, mix: 0.3 }),
  cathedralAcoustics: (d, p) => audioUtils.echoGenerator(d, { delay: 800, feedback: 0.55, mix: 0.25 }),

  automatedSweep: async (audioDataUrl: string, { speed }: { speed: number }) => {
     return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        if (buffer.numberOfChannels < 2) {
            return []; 
        }
        const panner = context.createStereoPanner();
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        const clampedSpeed = Math.max(0.05, Math.min(speed, 10)); 
        lfo.frequency.setValueAtTime(clampedSpeed, context.currentTime); 
        lfo.connect(panner.pan); 
        lfo.start();
        
        return [panner];
    }, `Automated Sweep: Speed ${speed}Hz. (Applied only if audio is stereo)`);
  },

  channelRouter: async (audioDataUrl: string, params: {}) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const numChannels = decodedAudioBuffer.numberOfChannels;

    if (numChannels < 2) {
      return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Router: Audio is not stereo. No changes made." };
    }

    const offlineContext = new OfflineAudioContext(numChannels, decodedAudioBuffer.length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const splitter = offlineContext.createChannelSplitter(numChannels);
    const merger = offlineContext.createChannelMerger(numChannels);

    sourceNode.connect(splitter);
    
    splitter.connect(merger, 0, 1); 
    splitter.connect(merger, 1, 0); 
    
    for (let i = 2; i < numChannels; i++) {
        splitter.connect(merger, i, i);
    }
    
    merger.connect(offlineContext.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: "Channel Router: Left and Right channels swapped. Other channels (if any) passed through." };
  },

  audioSplitter: async (audioDataUrl: string, { startTime: startTimeMinutes, endTime: endTimeMinutes }: { startTime: number, endTime: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const originalDurationSeconds = decodedAudioBuffer.duration;
    const numChannels = decodedAudioBuffer.numberOfChannels;
    const sampleRate = decodedAudioBuffer.sampleRate;

    // Convert input minutes to seconds
    let sTimeSeconds = parseFloat(String(startTimeMinutes)) * 60;
    let eTimeSeconds = parseFloat(String(endTimeMinutes)) * 60;
    
    if (isNaN(sTimeSeconds) || isNaN(eTimeSeconds)) {
      return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: "Audio Splitter: Invalid start or end time. Must be numbers. No changes made." 
      };
    }

    sTimeSeconds = Math.max(0, Math.min(sTimeSeconds, originalDurationSeconds));
    eTimeSeconds = Math.max(sTimeSeconds, Math.min(eTimeSeconds, originalDurationSeconds));
    
    const splitDurationSeconds = eTimeSeconds - sTimeSeconds; 
    const contextLengthInSamples = Math.max(1, Math.floor(splitDurationSeconds * sampleRate));

    const offlineContext = new OfflineAudioContext(
      numChannels,
      contextLengthInSamples,
      sampleRate
    );

    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = decodedAudioBuffer;
    bufferSource.connect(offlineContext.destination);
    
    bufferSource.start(0, sTimeSeconds, splitDurationSeconds); 

    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    let analysisMessage: string;
    if (splitDurationSeconds > 0) {
      analysisMessage = `Audio Splitter: Extracted segment from ${sTimeSeconds.toFixed(2)}s (${startTimeMinutes.toFixed(2)}min) to ${eTimeSeconds.toFixed(2)}s (${endTimeMinutes.toFixed(2)}min). New duration: ${renderedBuffer.duration.toFixed(2)}s.`;
    } else {
      analysisMessage = `Audio Splitter: Extracted zero-duration segment from ${sTimeSeconds.toFixed(2)}s (${startTimeMinutes.toFixed(2)}min) to ${eTimeSeconds.toFixed(2)}s (${endTimeMinutes.toFixed(2)}min). Result is effectively empty (duration: ${renderedBuffer.duration.toFixed(4)}s).`;
    }
    
    return {
      processedAudioDataUrl,
      analysis: analysisMessage
    };
  },
  voiceExtractor: async (audioDataUrl: string, params: {}) => {
    return { processedAudioDataUrl: audioDataUrl, analysis: "Voice Extractor: Placeholder - no change." };
  },
  channelCompressor: async (audioDataUrl: string, { channels }: { channels: 'mono' | 'stereo' }) => {
    if (channels === 'stereo') { 
      return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Compressor: Stereo passthrough requested." };
    }
    
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");
    
    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (decodedAudioBuffer.numberOfChannels === 1) { 
        return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Compressor: Audio is already mono." };
    }

    const offlineContext = new OfflineAudioContext(1, decodedAudioBuffer.length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    return { processedAudioDataUrl, analysis: "Channel Compressor: Audio converted to mono." };
  },
  spatialAudioEffect: async (audioDataUrl: string, { depth }: { depth: number }) => {
    return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        if (buffer.numberOfChannels < 2) return []; 
        
        const panner = context.createStereoPanner();
        const panValue = (depth - 50) / 50; 
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), context.currentTime);

        return [panner];
    }, `Spatial Audio Effect: Pan set to ${((depth - 50) / 50).toFixed(2)}. (Applied only if audio is stereo)`);
  },
};
