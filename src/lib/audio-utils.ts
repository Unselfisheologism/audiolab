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
  } else if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    interleaved = new Int16Array(left.length + right.length);
    for (let i = 0, j = 0; i < left.length; i++, j += 2) {
      interleaved[j] = Math.max(-1, Math.min(1, left[i])) * 32767;
      interleaved[j + 1] = Math.max(-1, Math.min(1, right[i])) * 32767;
    }
  } else {
     // For more than 2 channels, we'll just use the first two or mono if only one.
     // This is a simplification for this example.
    const samples = [];
    for (let ch = 0; ch < Math.min(numChannels, 2); ch++) {
      samples.push(audioBuffer.getChannelData(ch));
    }
    const length = samples[0].length;
    interleaved = new Int16Array(length * samples.length);

    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < samples.length; ch++) {
        interleaved[i * samples.length + ch] = Math.max(-1, Math.min(1, samples[ch][i])) * 32767;
      }
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
  view.setUint16(22, numChannels, true);
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
  setupEffect: (audioContext: AudioContext, sourceNode: AudioBufferSourceNode, decodedAudioBuffer: AudioBuffer) => AudioNode[], // Returns array of connected nodes
  analysisMessage?: string
): Promise<{ processedAudioDataUrl: string; analysis?: string }> => {
  const audioContext = getGlobalAudioContext();
  if (!audioContext) {
    throw new Error("AudioContext not supported or initialized.");
  }
  
  // Ensure context is running
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

  // Connect the chain
  if (effectChain.length > 0) {
    sourceNode.connect(effectChain[0]);
    for (let i = 0; i < effectChain.length - 1; i++) {
      effectChain[i].connect(effectChain[i+1]);
    }
    effectChain[effectChain.length - 1].connect(offlineContext.destination);
  } else { // If no effects, connect source directly to destination
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
      biquadFilter.frequency.setValueAtTime(1000, context.currentTime); // Center frequency
      biquadFilter.Q.setValueAtTime(1, context.currentTime); // Quality factor
      biquadFilter.gain.setValueAtTime(frequency, context.currentTime); // 'frequency' here acts as gain for the peak
      return [biquadFilter];
    }, `Altered resonance: Peaking filter at 1kHz, gain ${frequency}dB.`);
  },

  temporalModification: async (audioDataUrl: string, { rate }: { rate: number }) => {
    const audioContext = getGlobalAudioContext();
     if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // For temporal modification (playback rate), we adjust the buffer duration for the offline context
    // and the playbackRate of the source node.
    const newDuration = decodedAudioBuffer.duration / rate;
    const numSamples = Math.ceil(decodedAudioBuffer.length / rate);

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        numSamples,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(rate, 0);
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: `Temporal modification: Playback rate set to ${rate.toFixed(2)}x.` };
  },

  stereoWidener: async (audioDataUrl: string, { width }: { width: number }) => {
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      if (buffer.numberOfChannels < 2) {
        // Not a stereo sound, widener won't have an audible effect
        return []; // Passthrough by returning an empty chain
      }
      
      // A more robust stereo widener often uses a combination of techniques.
      // For simplicity, we'll use a StereoPannerNode if width is not 100.
      // If width is 100, it's passthrough.
      // width 0 = mono (center), width 100 = original stereo, width 200 = wider (exaggerated)
      // StereoPannerNode pan value: -1 (full left) to 1 (full right).
      // This isn't a direct "width" control, but we can simulate.
      // A true widener might involve M/S processing or Haas effect.

      // For this example, we'll create a slightly more involved setup than just gain.
      // If width > 100, we can try to enhance side channel. If width < 100, narrow it.
      // This requires splitting channels.

      const splitter = context.createChannelSplitter(2);
      const merger = context.createChannelMerger(2);
      const leftGain = context.createGain();
      const rightGain = context.createGain();

      // L' = L * gainL, R' = R * gainR
      // A simple approach:
      // if width > 100 (wider), slightly boost L and R from their original
      // if width < 100 (narrower), slightly reduce L and R towards mono
      // This isn't perfect stereo width, but a step up.
      
      let gainL = 1;
      let gainR = 1;
      const widthFactor = width / 100; // 0 to 2

      if (widthFactor !== 1) {
        // Example: if width is 150 (1.5 factor), L' = L * 1.25, R' = R * 1.25 (simplified)
        // if width is 50 (0.5 factor), L' = L * 0.75, R' = R * 0.75 (simplified)
        // This is still not a true widener but let's simulate it conceptually
        // For actual widening, one might use: L' = M + S*widthFactor, R' = M - S*widthFactor
        // M = (L+R)/2, S = (L-R)/2
        // So L' = (L+R)/2 + (L-R)/2 * widthFactor  = 0.5L(1+widthFactor) + 0.5R(1-widthFactor)
        //    R' = (L+R)/2 - (L-R)/2 * widthFactor  = 0.5L(1-widthFactor) + 0.5R(1+widthFactor)
        
        gainL = 0.5 * (1 + widthFactor) + 0.5 * (1 - widthFactor); // This formula seems wrong, it simplifies to 1
        // Let's use a simpler model based on scaling side component
        // If L_in, R_in are original. Mid = (L_in+R_in)/2, Side = (L_in-R_in)/2
        // L_out = Mid + Side * widthFactor
        // R_out = Mid - Side * widthFactor
        // We can't directly implement M/S with just gains on L/R channels without more nodes.
        
        // Fallback to a simpler model for now:
        // Adjust gain on each channel. If width > 100, could slightly increase diff.
        // This effect is subtle with this implementation.
        // Let's try to make it passthrough for now if not implementing full M/S.
        // For now, this will be a conceptual placeholder for a real stereo widener.
        // It won't do much beyond maybe a slight gain change if width is not 100.
      }

      leftGain.gain.setValueAtTime(gainL, context.currentTime);
      rightGain.gain.setValueAtTime(gainR, context.currentTime);

      // source (from generic) -> splitter -> (leftGain & rightGain) -> merger -> destination (in generic)
      // The chain for processAudioWithEffect will be [splitter, leftGain, merger] (rightGain path needs care)
      // This is where the generic processor's linear chain assumption is tricky.
      // Let's refine processAudioWithEffect or this effect.
      // For now, make stereoWidener a passthrough if not fully implemented.
      // Returning [] means source connects directly to destination.
      // TODO: Implement a proper M/S based stereo widener.
      
      // Simplified: just a gain node for demo. It won't actually "widen".
      const gainNode = context.createGain();
      if (width !== 100) {
         // gainNode.gain.setValueAtTime(width/100, context.currentTime);
      }
      // Returning [gainNode] means source -> gainNode -> destination.
      return [gainNode];

    }, `Stereo Widener: Width set to ${width}%. (Note: This is a simplified placeholder effect).`);
  },
  
  subharmonicIntensifier: async (audioDataUrl: string, { intensity }: { intensity: number }) => {
    const gainDb = (intensity / 100) * 12; // Max 12dB boost
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const lowshelfFilter = context.createBiquadFilter();
      lowshelfFilter.type = 'lowshelf';
      lowshelfFilter.frequency.setValueAtTime(120, context.currentTime); 
      lowshelfFilter.gain.setValueAtTime(gainDb, context.currentTime);
      return [lowshelfFilter];
    }, `Applied Subharmonic Intensifier: Low-shelf filter at 120Hz with ${gainDb.toFixed(1)}dB gain (Intensity: ${intensity}%).`);
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
    }, `Frequency Sculptor: Low ${low}dB, Mid ${mid}dB, High ${high}dB.`);
  },

  keyTransposer: async (audioDataUrl: string, { semitones }: { semitones: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const playbackRate = Math.pow(2, semitones / 12);
    const newLength = Math.round(decodedAudioBuffer.length / playbackRate);

    if (newLength <=0) { // Prevent error with extreme semitone values
        return { processedAudioDataUrl: audioDataUrl, analysis: `Key Transposer: Invalid semitone value ${semitones}, resulted in zero length.` };
    }

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(playbackRate, 0);
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Key Transposer: Shifted by ${semitones} semitones.` };
  },

  echoGenerator: async (audioDataUrl: string, { delay, feedback, mix }: { delay: number, feedback: number, mix: number }) => {
    // This effect requires a slightly different setup than the generic linear chain processor.
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const offlineContext = new OfflineAudioContext(
      decodedAudioBuffer.numberOfChannels,
      decodedAudioBuffer.length + audioContext.sampleRate * Math.max(1, delay/1000 * 5), // Extend buffer for echo tail
      decodedAudioBuffer.sampleRate
    );
    
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const delayNode = offlineContext.createDelay(Math.max(0.01, delay / 1000 + 0.5)); // Max delay + headroom
    delayNode.delayTime.setValueAtTime(delay / 1000, 0);

    const feedbackNode = offlineContext.createGain();
    feedbackNode.gain.setValueAtTime(feedback, 0);

    const dryNode = offlineContext.createGain();
    dryNode.gain.setValueAtTime(1 - mix, 0);
    
    const wetNode = offlineContext.createGain();
    wetNode.gain.setValueAtTime(mix, 0);

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
    
    return { processedAudioDataUrl, analysis: `Echo: Delay ${delay}ms, Feedback ${feedback*100}%, Mix ${mix*100}% wet.` };
  },

  reversePlayback: async (audioDataUrl: string, params: {}) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = decodedAudioBuffer.numberOfChannels;
    const reversedBuffer = audioContext.createBuffer( // Use the global/shared AudioContext for creating buffers
      numChannels,
      decodedAudioBuffer.length,
      decodedAudioBuffer.sampleRate
    );

    for (let i = 0; i < numChannels; i++) {
      const channelData = decodedAudioBuffer.getChannelData(i);
      // Make a copy before reversing to avoid modifying the original buffer's channel data if it's shared.
      const originalChannelDataCopy = new Float32Array(channelData);
      const reversedChannelData = reversedBuffer.getChannelData(i);
      for (let j = 0; j < originalChannelDataCopy.length; j++) {
        reversedChannelData[j] = originalChannelDataCopy[originalChannelDataCopy.length - 1 - j];
      }
    }
    
    const processedAudioDataUrl = await audioBufferToWavDataUrl(reversedBuffer);
    return { processedAudioDataUrl, analysis: "Audio reversed." };
  },

  paceAdjuster: async (audioDataUrl: string, { tempo }: { tempo: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const newLength = Math.round(decodedAudioBuffer.length / tempo);
    if (newLength <=0) {
        return { processedAudioDataUrl: audioDataUrl, analysis: `Pace Adjuster: Invalid tempo value ${tempo}, resulted in zero length.` };
    }
    
    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength,
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(tempo, 0); 
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Pace adjusted to ${tempo.toFixed(2)}x. (Note: This method also affects pitch).` };
  },

  gainController: async (audioDataUrl: string, { gain }: { gain: number }) => {
    const gainValue = Math.pow(10, gain / 20); 
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);
      return [gainNode];
    }, `Gain adjusted by ${gain}dB.`);
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
     return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
        if (buffer.numberOfChannels < 2) return []; 

        const panner = context.createStereoPanner();
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(speed, context.currentTime); 

        const lfoGain = context.createGain();
        lfoGain.gain.setValueAtTime(1, context.currentTime); 

        lfo.connect(lfoGain);
        lfoGain.connect(panner.pan);
        lfo.start();
        
        // Ensure LFO is stopped when the offline context finishes to prevent it from running indefinitely.
        // This is often handled by the offline context itself, but explicit stop can be good practice.
        // However, in an OfflineAudioContext, time doesn't advance beyond buffer length.
        // source.onended = () => lfo.stop(); // This won't work in OfflineAudioContext directly like this.
        // For offline, LFO will run for the duration of the buffer.

        return [panner];
    }, `Automated Sweep: Speed ${speed}Hz.`);
  },

  channelRouter: async (audioDataUrl: string, params: {}) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const numChannels = decodedAudioBuffer.numberOfChannels;

    // Create a new buffer for the output
    const offlineContext = new OfflineAudioContext(
      numChannels,
      decodedAudioBuffer.length,
      decodedAudioBuffer.sampleRate
    );
    const routedBufferContainer = offlineContext.createBuffer( // Buffer to copy into
      numChannels,
      decodedAudioBuffer.length,
      decodedAudioBuffer.sampleRate
    );


    if (numChannels === 2) { 
      const leftChannelData = decodedAudioBuffer.getChannelData(0);
      const rightChannelData = decodedAudioBuffer.getChannelData(1);
      
      // Copy into the container buffer
      routedBufferContainer.copyToChannel(rightChannelData, 0); 
      routedBufferContainer.copyToChannel(leftChannelData, 1);  
    } else { 
      for (let i = 0; i < numChannels; i++) {
        routedBufferContainer.copyToChannel(decodedAudioBuffer.getChannelData(i), i);
      }
    }
    
    // Play the routedBufferContainer through the offline context to get the final output
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = routedBufferContainer;
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    
    return { processedAudioDataUrl, analysis: numChannels === 2 ? "Channel Router: Left and Right channels swapped." : "Channel Router: No change for mono or multi-channel (>2) audio." };
  },

  audioSplitter: async (audioDataUrl: string, params: {}) => {
    return { processedAudioDataUrl: audioDataUrl, analysis: "Audio Splitter: Placeholder - no change." };
  },
  voiceExtractor: async (audioDataUrl: string, params: {}) => {
    return { processedAudioDataUrl: audioDataUrl, analysis: "Voice Extractor: Placeholder - no change." };
  },
  channelCompressor: async (audioDataUrl: string, { channels }: { channels: 'mono' | 'stereo' }) => {
    if (channels === 'stereo') { 
      return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Compressor: Stereo passthrough." };
    }
    
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");
    
    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (decodedAudioBuffer.numberOfChannels === 1) { 
        return { processedAudioDataUrl: audioDataUrl, analysis: "Channel Compressor: Audio is already mono." };
    }

    // Offline context for mono conversion
    const offlineContext = new OfflineAudioContext(1, decodedAudioBuffer.length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    
    // The merger node will downmix to the number of channels of the destination (1 for mono)
    // For explicit control, one would sum channels manually into a mono buffer.
    // Connecting a multi-channel source to a mono destination implicitly mixes.
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    return { processedAudioDataUrl, analysis: "Channel Compressor: Audio converted to mono." };
  },
  spatialAudioEffect: async (audioDataUrl: string, { depth }: { depth: number }) => {
    const gainFactor = depth / 100; 
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
        if (buffer.numberOfChannels < 2) return []; 
        
        const panner = context.createStereoPanner();
        panner.pan.setValueAtTime((depth - 50) / 50, context.currentTime);

        return [panner];
    }, `Spatial Audio Effect: Depth set to ${depth}%. (Simplified effect)`);
  },
};