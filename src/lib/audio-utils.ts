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
  
  // For WAV, we'll output mono or stereo. If input has more, it should have been downmixed by OfflineAudioContext.
  const wavOutputChannels = Math.min(numChannels, 2);


  const blockAlign = wavOutputChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;

  let interleaved = new Int16Array(0);
  const length = audioBuffer.length;

  if (wavOutputChannels === 1) {
    const channelData = audioBuffer.getChannelData(0);
    interleaved = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      interleaved[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }
  } else if (wavOutputChannels === 2) { 
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = numChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel; // Use left for right if original was mono but target is stereo
    
    interleaved = new Int16Array(length * 2);
    for (let i = 0; i < length; i++) {
      interleaved[i * 2] = Math.max(-1, Math.min(1, leftChannel[i])) * 32767;
      interleaved[i * 2 + 1] = Math.max(-1, Math.min(1, rightChannel[i])) * 32767;
    }
  }
  
  const dataSize = interleaved.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, wavOutputChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); 
  view.setUint16(32, blockAlign, true); 
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
  setupEffect: (audioContext: OfflineAudioContext, sourceNode: AudioBufferSourceNode, decodedAudioBuffer: AudioBuffer) => AudioNode[], 
  analysisMessage?: string,
  outputChannelCount?: number // Optional: specify output channel count for OfflineAudioContext
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

  const targetChannelCount = outputChannelCount !== undefined ? outputChannelCount : decodedAudioBuffer.numberOfChannels;

  const offlineContext = new OfflineAudioContext(
    targetChannelCount,
    decodedAudioBuffer.length, // Length remains based on original buffer's samples for rate changes
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
        // If not stereo, no widening effect can be applied. Return empty chain for passthrough.
        return []; 
      }
  
      const width = widthParam / 100; 
  
      const splitter = offlineContext.createChannelSplitter(2);
      const merger = offlineContext.createChannelMerger(2);
  
      // Gains for M/S processing method: L' = M+S, R' = M-S
      // M = (L+R)/2, S = (L-R)/2
      // For width W: M' = M, S' = S * W
      // L_out = M' + S' = (L+R)/2 + W*(L-R)/2 = L*(1+W)/2 + R*(1-W)/2
      // R_out = M' - S' = (L+R)/2 - W*(L-R)/2 = L*(1-W)/2 + R*(1+W)/2
      
      const gainL_to_L_out = offlineContext.createGain();
      const gainR_to_L_out = offlineContext.createGain();
      const gainL_to_R_out = offlineContext.createGain();
      const gainR_to_R_out = offlineContext.createGain();
  
      gainL_to_L_out.gain.value = (1 + width) / 2;
      gainR_to_L_out.gain.value = (1 - width) / 2;
      gainL_to_R_out.gain.value = (1 - width) / 2;
      gainR_to_R_out.gain.value = (1 + width) / 2;
      
      // Connect left input of source to splitter
      // sourceNode.connect(splitter); // Source connects to splitter in the processAudioWithEffect wrapper logic implicitly
      
      // Left output channel processing
      splitter.connect(gainL_to_L_out, 0, 0); // Original Left to gain for L_out
      splitter.connect(gainR_to_L_out, 1, 0); // Original Right to gain for L_out
      gainL_to_L_out.connect(merger, 0, 0);   // Connect to Left of Merger
      gainR_to_L_out.connect(merger, 0, 0);   // Connect to Left of Merger
  
      // Right output channel processing
      splitter.connect(gainL_to_R_out, 0, 0); // Original Left to gain for R_out
      splitter.connect(gainR_to_R_out, 1, 0); // Original Right to gain for R_out
      gainL_to_R_out.connect(merger, 0, 1);   // Connect to Right of Merger
      gainR_to_R_out.connect(merger, 0, 1);   // Connect to Right of Merger
  
      // The setupEffect should return the first and last nodes of the main chain if source isn't directly connected to destination
      // Here, source -> splitter, and merger -> destination (implicitly)
      return [splitter, gainL_to_L_out, gainR_to_L_out, gainL_to_R_out, gainR_to_R_out, merger];
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
      }, 
      `Applied Subharmonic Intensifier: Low-shelf filter at 120Hz with ${gainDb.toFixed(1)}dB gain (Intensity: ${intensityParam}%).`
    );
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
      
      // Chain the filters: source -> lowFilter -> midFilter -> highFilter -> destination
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
    // Adjust length based on playback rate to maintain pitch shift effect across entire duration
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
        const numSignificantTaps = clampedFeedback > 0.01 ? Math.abs(Math.log(0.001) / Math.log(clampedFeedback)) : 5;
        tailExtensionFactor = numSignificantTaps * clampedDelay;
    } else {
        tailExtensionFactor = clampedDelay * 2; 
    }
    const tailExtensionSeconds = Math.min(tailExtensionFactor, 30); // Cap tail extension
    
    const extendedLength = decodedAudioBuffer.length + Math.floor(audioContext.sampleRate * tailExtensionSeconds);
    
    const offlineContext = new OfflineAudioContext(
      decodedAudioBuffer.numberOfChannels,
      Math.max(1, extendedLength), 
      decodedAudioBuffer.sampleRate
    );
    
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const delayNode = offlineContext.createDelay(clampedDelay + 1); // Max delay time
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
    feedbackNode.connect(delayNode); // Feedback loop
    
    sourceNode.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: `Echo: Delay ${(clampedDelay*1000).toFixed(0)}ms, Feedback ${(clampedFeedback*100).toFixed(0)}%, Mix ${(clampedMix*100).toFixed(0)}% wet.` };
  },

  reversePlayback: async (audioDataUrl: string, params: {}) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = decodedAudioBuffer.numberOfChannels;
    const length = decodedAudioBuffer.length;

    // Create a new buffer to hold the reversed audio data
    const reversedBuffer = audioContext.createBuffer(
      numChannels,
      length,
      decodedAudioBuffer.sampleRate
    );

    for (let i = 0; i < numChannels; i++) {
      const channelData = decodedAudioBuffer.getChannelData(i);
      const reversedChannelData = reversedBuffer.getChannelData(i);
      // Make a copy before reversing to avoid modifying the original buffer's underlying data if it's shared.
      const originalChannelDataCopy = new Float32Array(channelData); 
      for (let j = 0; j < length; j++) {
        reversedChannelData[j] = originalChannelDataCopy[length - 1 - j];
      }
    }
    
    // Use an OfflineAudioContext to "play" the reversed buffer into a new one for export
    const offlineContext = new OfflineAudioContext(numChannels, length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = reversedBuffer; // Assign the already reversed buffer
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
    
    const newTempo = Math.max(0.1, Math.min(tempo, 4)); // Clamp tempo
    // Adjust length based on tempo to process entire duration correctly
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
    const gainValue = Math.pow(10, gain / 20); // Convert dB to linear gain
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);
      return [gainNode];
    }, `Gain adjusted by ${gain}dB (linear gain: ${gainValue.toFixed(2)}).`);
  },

  rhythmDetector: async (audioDataUrl: string, params: {}) => {
    // This is a placeholder. Real BPM detection is complex.
    const analysis = "BPM Analysis: Feature not fully implemented. Placeholder result: Estimated 120 BPM.";
    return { processedAudioDataUrl: audioDataUrl, analysis }; 
  },

  dreamscapeMaker: async (audioDataUrl: string, params: {}) => {
    // Chain effects: slow down, then add reverb
    const slowedResult = await audioUtils.paceAdjuster(audioDataUrl, { tempo: 0.75 });
    // Using echo as a simple reverb substitute
    const dreamResult = await audioUtils.echoGenerator(slowedResult.processedAudioDataUrl, { delay: 200, feedback: 0.4, mix: 0.35 });
    return { ...dreamResult, analysis: "Dreamscape Maker: Applied slow down and echo." };
  },

  frequencyTuner: async (audioDataUrl: string, params: {}) => { // Assuming params has 'targetPitch' like 432
    const pitchShiftRatio = 432 / 440; // Example for A4=432Hz from A4=440Hz
    const semitones = 12 * Math.log2(pitchShiftRatio);
    const result = await audioUtils.keyTransposer(audioDataUrl, { semitones });
    return { ...result, analysis: `Tuned to 432Hz (approx. ${semitones.toFixed(2)} semitones shift).` };
  },

  // Bass Boost Presets using subharmonicIntensifier logic
  subtleSubwoofer: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 20 }),
  gentleBassBoost: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 40 }),
  mediumBassEnhancement: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 60 }),
  intenseBassAmplifier: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 80 }),
  maximumBassOverdrive: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 100 }),

  // Reverb Presets using echoGenerator logic
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
            // Effect only applicable to stereo. Return empty chain for passthrough.
            return []; 
        }
        const panner = context.createStereoPanner();
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        const clampedSpeed = Math.max(0.05, Math.min(speed, 10)); // Clamp speed for sensibility
        lfo.frequency.setValueAtTime(clampedSpeed, context.currentTime); 
        
        const lfoGain = context.createGain(); // LFO output is -1 to 1, panner expects -1 to 1.
        lfoGain.gain.value = 1; // No gain needed if LFO output range matches panner's.
        lfo.connect(lfoGain);
        lfoGain.connect(panner.pan); // Connect LFO (via gain if needed) to pan parameter
        
        lfo.start();
        
        // Source -> Panner -> Destination
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
      // Not stereo, so swapping L/R has no meaning.
      return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Router: Audio is not stereo. No changes made." };
    }

    // Only proceed if stereo or more channels
    const offlineContext = new OfflineAudioContext(numChannels, decodedAudioBuffer.length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const splitter = offlineContext.createChannelSplitter(numChannels);
    const merger = offlineContext.createChannelMerger(numChannels);

    sourceNode.connect(splitter);
    
    // Swap L (channel 0) and R (channel 1)
    splitter.connect(merger, 0, 1); // Route source's channel 0 (Left) to merger's channel 1 (Right)
    splitter.connect(merger, 1, 0); // Route source's channel 1 (Right) to merger's channel 0 (Left)
    
    // Pass through other channels if they exist (e.g., for 5.1 audio, C, LFE, Ls, Rs)
    for (let i = 2; i < numChannels; i++) {
        splitter.connect(merger, i, i); // Route source's channel i to merger's channel i
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

    // Ensure inputs are numbers and convert minutes to seconds
    let sTimeSeconds = Number(startTimeMinutes) * 60;
    let eTimeSeconds = Number(endTimeMinutes) * 60;
    
    if (isNaN(sTimeSeconds) || isNaN(eTimeSeconds) || sTimeSeconds < 0 || eTimeSeconds < 0) {
      return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: "Audio Splitter: Invalid start or end time (must be non-negative numbers). No changes made." 
      };
    }

    // Clamp times to the duration of the audio
    sTimeSeconds = Math.min(sTimeSeconds, originalDurationSeconds);
    eTimeSeconds = Math.min(eTimeSeconds, originalDurationSeconds);
    
    if (eTimeSeconds <= sTimeSeconds) {
         return { 
            processedAudioDataUrl: audioDataUrl, 
            analysis: `Audio Splitter: End time (${endTimeMinutes.toFixed(2)}min / ${eTimeSeconds.toFixed(2)}s) must be after start time (${startTimeMinutes.toFixed(2)}min / ${sTimeSeconds.toFixed(2)}s). No changes made.` 
        };
    }
    
    const splitDurationSeconds = eTimeSeconds - sTimeSeconds; 
    // Calculate the length of the output buffer in samples for the OfflineAudioContext
    const contextLengthInSamples = Math.max(1, Math.floor(splitDurationSeconds * sampleRate));

    const offlineContext = new OfflineAudioContext(
      numChannels,
      contextLengthInSamples,
      sampleRate
    );

    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = decodedAudioBuffer;
    bufferSource.connect(offlineContext.destination);
    
    // Start playing from sTimeSeconds for a duration of splitDurationSeconds
    bufferSource.start(0, sTimeSeconds, splitDurationSeconds); 

    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    let analysisMessage: string;
    if (renderedBuffer.duration > 0.001) { // Check if the rendered buffer has a meaningful duration
      analysisMessage = `Audio Splitter: Extracted segment from ${sTimeSeconds.toFixed(2)}s (${startTimeMinutes.toFixed(2)}min) to ${eTimeSeconds.toFixed(2)}s (${endTimeMinutes.toFixed(2)}min). New duration: ${renderedBuffer.duration.toFixed(2)}s.`;
    } else {
      // If the segment is too small or results in no audio, report it and potentially return original.
      analysisMessage = `Audio Splitter: Extracted segment from ${sTimeSeconds.toFixed(2)}s (${startTimeMinutes.toFixed(2)}min) to ${eTimeSeconds.toFixed(2)}s (${endTimeMinutes.toFixed(2)}min) resulted in a very short or empty audio clip (duration: ${renderedBuffer.duration.toFixed(4)}s). Original audio unchanged if displayed.`;
      // Consider returning the original audioDataUrl if the split is effectively empty
      return { processedAudioDataUrl: audioDataUrl, analysis: analysisMessage };
    }
    
    return {
      processedAudioDataUrl,
      analysis: analysisMessage
    };
  },
  channelCompressor: async (audioDataUrl: string, { channels: targetChannels }: { channels: 'mono' | 'stereo' }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");
  
    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const sourceChannels = decodedAudioBuffer.numberOfChannels;
  
    let analysis = "";
    let outputChannelCount = sourceChannels; // Default to source channels
  
    if (targetChannels === 'mono') {
      if (sourceChannels === 1) {
        analysis = "Channel Compressor: Audio is already mono. No changes made.";
        return { processedAudioDataUrl: audioDataUrl, analysis };
      }
      outputChannelCount = 1;
      analysis = `Channel Compressor: Audio converted to mono from ${sourceChannels} channels.`;
    } else if (targetChannels === 'stereo') {
      if (sourceChannels === 1) {
        // Mono input, "stereo" output selected. Keep it mono.
        // If upmixing to dual-mono (same signal on L and R of a stereo file) was desired,
        // outputChannelCount would be 2, and WAV encoding would handle duplication.
        // For "passthrough" style, keeping it mono is more aligned.
        analysis = "Channel Compressor: Input is mono, selected stereo output. Audio remains mono.";
        return { processedAudioDataUrl: audioDataUrl, analysis }; 
      } else if (sourceChannels === 2) {
        analysis = "Channel Compressor: Audio is already stereo. No changes made.";
        return { processedAudioDataUrl: audioDataUrl, analysis };
      } else { // sourceChannels > 2
        outputChannelCount = 2; // Downmix to stereo
        analysis = `Channel Compressor: Audio downmixed from ${sourceChannels} channels to stereo.`;
      }
    } else {
      // Should not happen with current UI, but as a fallback
      analysis = "Channel Compressor: Invalid target channel configuration.";
      return { processedAudioDataUrl: audioDataUrl, analysis };
    }
  
    // If we need to process (i.e., change channel count)
    const offlineContext = new OfflineAudioContext(
      outputChannelCount, 
      decodedAudioBuffer.length, 
      decodedAudioBuffer.sampleRate
    );
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    return { processedAudioDataUrl, analysis };
  },
  spatialAudioEffect: async (audioDataUrl: string, { depth }: { depth: number }) => {
    // This is a very basic "spatial" effect using StereoPanner. True spatial audio is far more complex.
    return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        if (buffer.numberOfChannels < 2) return []; // Panner only works on stereo
        
        const panner = context.createStereoPanner();
        // Convert depth (0-100) to pan value (-1 to 1). 50 depth = 0 pan (center).
        const panValue = (depth - 50) / 50; 
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), context.currentTime);

        return [panner]; // source -> panner -> destination
    }, `Spatial Audio Effect: Pan set to ${((depth - 50) / 50).toFixed(2)}. (Applied only if audio is stereo)`);
  },
};
