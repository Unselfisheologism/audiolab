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
  
  // For WAV, we'll output based on the audioBuffer's actual channel count
  const wavOutputChannels = audioBuffer.numberOfChannels;


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
  } else if (wavOutputChannels >= 2) { // Handles stereo and multi-channel if buffer has them
    const leftChannel = audioBuffer.getChannelData(0);
    // If buffer is mono but wavOutputChannels is 2 (e.g. dual mono), use left for right.
    // If buffer is stereo or more, use channel 1 for right.
    const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel; 
    
    interleaved = new Int16Array(length * 2); // We are creating a stereo WAV
    for (let i = 0; i < length; i++) {
      interleaved[i * 2] = Math.max(-1, Math.min(1, leftChannel[i])) * 32767;
      interleaved[i * 2 + 1] = Math.max(-1, Math.min(1, rightChannel[i])) * 32767;
    }
  }
  
  const dataSize = interleaved.length * (bitDepth / 8);
  // For stereo WAV, ensure blockAlign and byteRate reflect 2 channels if wavOutputChannels was forced to 2 for dual mono.
  const actualWavBlockAlign = (wavOutputChannels >= 2 ? 2 : 1) * (bitDepth / 8);
  const actualWavByteRate = sampleRate * actualWavBlockAlign;
  const actualWavNumChannels = wavOutputChannels >= 2 ? 2 : 1;


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
  view.setUint16(22, actualWavNumChannels, true); // Use actualWavNumChannels for WAV header
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, actualWavByteRate, true); // Use actualWavByteRate
  view.setUint16(32, actualWavBlockAlign, true); // Use actualWavBlockAlign
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
  outputChannelCountForContext?: number // Optional: specify output channel count for OfflineAudioContext
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
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  return { processedAudioDataUrl, analysis: analysisMessage };
};


export const audioUtils = {
  alterResonance: async (audioDataUrl: string, { frequency }: { frequency: number }) => {
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const biquadFilter = context.createBiquadFilter();
      biquadFilter.type = 'peaking';
      // Map frequency parameter (-12 to 12) to a reasonable filter frequency range.
      // Example: center around 1000Hz, shift by up to 500Hz.
      const filterFreq = Math.max(20, 1000 + (frequency * 40)); 
      biquadFilter.frequency.setValueAtTime(filterFreq, context.currentTime); 
      biquadFilter.Q.setValueAtTime(1.5, context.currentTime); // Moderate Q for noticeable but not overly sharp peak/dip
      biquadFilter.gain.setValueAtTime(frequency, context.currentTime); // Direct use of 'frequency' as gain (semitones -> dB)
      return [biquadFilter];
    }, `Altered resonance: Peaking filter with ${frequency}dB gain around ${ (1000 + (frequency * 40)).toFixed(0) }Hz.`);
  },

  temporalModification: async (audioDataUrl: string, { rate }: { rate: number }) => {
    const audioContext = getGlobalAudioContext();
     if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const newRate = Math.max(0.1, Math.min(rate, 4)); 
    // Adjust length based on the new rate
    const numSamples = Math.max(1, Math.ceil(decodedAudioBuffer.length / newRate));

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        numSamples, // Use adjusted number of samples
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
        // If mono, return an empty effect chain (no change)
        return []; 
      }
  
      const width = widthParam / 100; // Convert percentage to 0-2 range
  
      // Create a splitter to separate left and right channels
      const splitter = offlineContext.createChannelSplitter(2);
      // Create a merger to combine them back
      const merger = offlineContext.createChannelMerger(2);
  
      // Gains for Mid/Side processing style widening
      // M = (L+R)/2, S = (L-R)/2
      // L' = M + S * width_factor
      // R' = M - S * width_factor
      // For simplicity, we can use a Hafler circuit style for basic width adjustment:
      // L_out = L + (L-R) * k  OR   L_out = L * (1+k) - R * k
      // R_out = R + (R-L) * k  OR   R_out = R * (1+k) - L * k
      // where k = (width - 1) / 2 (width from 0 to 2, k from -0.5 to 0.5)
      // if width = 0 (mono), k = -0.5: L_out = 0.5L + 0.5R, R_out = 0.5L + 0.5R
      // if width = 1 (original), k = 0: L_out = L, R_out = R
      // if width = 2 (wide), k = 0.5: L_out = 1.5L - 0.5R, R_out = 1.5R - 0.5L

      const k = (width - 1) / 2;

      const gainL_to_L_out = offlineContext.createGain();
      const gainR_to_L_out_inverted = offlineContext.createGain(); // Will be -R * k
      
      const gainR_to_R_out = offlineContext.createGain();
      const gainL_to_R_out_inverted = offlineContext.createGain(); // Will be -L * k

      gainL_to_L_out.gain.value = 1 + k;
      gainR_to_L_out_inverted.gain.value = -k;

      gainR_to_R_out.gain.value = 1 + k;
      gainL_to_R_out_inverted.gain.value = -k;
      
      // Connect L path for L_out
      splitter.connect(gainL_to_L_out, 0, 0); // L_in -> gainL_to_L_out
      gainL_to_L_out.connect(merger, 0, 0);  // gainL_to_L_out -> L_out

      // Connect R path for L_out (inverted)
      splitter.connect(gainR_to_L_out_inverted, 1, 0); // R_in -> gainR_to_L_out_inverted
      gainR_to_L_out_inverted.connect(merger, 0, 0); // gainR_to_L_out_inverted -> L_out (sums with above)

      // Connect R path for R_out
      splitter.connect(gainR_to_R_out, 1, 0); // R_in -> gainR_to_R_out
      gainR_to_R_out.connect(merger, 0, 1); // gainR_to_R_out -> R_out

      // Connect L path for R_out (inverted)
      splitter.connect(gainL_to_R_out_inverted, 0, 0); // L_in -> gainL_to_R_out_inverted
      gainL_to_R_out_inverted.connect(merger, 0, 1); // gainL_to_R_out_inverted -> R_out (sums with above)
  
      return [splitter, merger]; // Source -> Splitter ... connections ... Merger -> Destination
    }, `Stereo Widener: Width set to ${widthParam}%. Applied only if audio is stereo.`, 
       2 // Force OfflineAudioContext to stereo
    );
  },
  
  subharmonicIntensifier: async (audioDataUrl: string, { intensity: intensityParam }: { intensity: number }) => {
    const gainDb = (intensityParam / 100) * 12; // Max 12dB boost for intensity 100
    return processAudioWithEffect(audioDataUrl, (offlineContext, sourceNode, decodedAudioBuffer) => {
        const lowshelfFilter = offlineContext.createBiquadFilter();
        lowshelfFilter.type = 'lowshelf';
        lowshelfFilter.frequency.setValueAtTime(120, offlineContext.currentTime); // Boost frequencies below 120Hz
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
      lowFilter.frequency.setValueAtTime(250, context.currentTime); // Low-shelf below 250Hz
      lowFilter.gain.setValueAtTime(low, context.currentTime);

      const midFilter = context.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.setValueAtTime(1000, context.currentTime); // Peaking filter centered at 1kHz
      midFilter.Q.setValueAtTime(1, context.currentTime); // Moderate Q for a broader mid-range effect
      midFilter.gain.setValueAtTime(mid, context.currentTime);

      const highFilter = context.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.setValueAtTime(4000, context.currentTime); // High-shelf above 4kHz
      highFilter.gain.setValueAtTime(high, context.currentTime);
      
      // Chain them: source -> lowFilter -> midFilter -> highFilter -> destination
      return [lowFilter, midFilter, highFilter];
    }, `Frequency Sculptor: Low ${low}dB @ 250Hz, Mid ${mid}dB @ 1kHz, High ${high}dB @ 4kHz.`);
  },

  keyTransposer: async (audioDataUrl: string, { semitones }: { semitones: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Calculate playback rate from semitones: rate = 2^(semitones/12)
    const playbackRate = Math.pow(2, semitones / 12);
    // Clamp playback rate to avoid extreme values that might cause issues or sound bad
    const clampedPlaybackRate = Math.max(0.1, Math.min(playbackRate, 4)); // e.g., 0.1x to 4x speed
    
    // Calculate the new length of the buffer based on the playback rate
    const newLength = Math.max(1, Math.round(decodedAudioBuffer.length / clampedPlaybackRate));

    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength, // Use the calculated new length
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    sourceNode.playbackRate.setValueAtTime(clampedPlaybackRate, 0); // Apply the calculated rate
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Key Transposer: Shifted by ${semitones} semitones (playback rate ${clampedPlaybackRate.toFixed(2)}x). Note: This method affects duration.` };
  },

  echoGenerator: async (audioDataUrl: string, { delay, feedback, mix }: { delay: number, feedback: number, mix: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Clamp parameters to valid ranges
    const clampedDelay = Math.max(0.001, Math.min(delay / 1000, audioContext.sampleRate)); // Convert ms to s, ensure positive and within reasonable limits
    const clampedFeedback = Math.max(0, Math.min(feedback, 0.95)); // Feedback shouldn't be 1 or more to avoid infinite loops
    const clampedMix = Math.max(0, Math.min(mix, 1)); // Mix between 0 (dry) and 1 (wet)

    // Estimate tail length for the offline context. This is tricky.
    // A simple approach: if feedback is high, allow more tail.
    let tailExtensionFactor = 0;
    if (clampedFeedback > 0) {
        // Roughly, number of taps until signal is -60dB (inaudible)
        const numSignificantTaps = clampedFeedback > 0.01 ? Math.abs(Math.log(0.001) / Math.log(clampedFeedback)) : 5; // if feedback is too low, assume 5 taps for some tail
        tailExtensionFactor = numSignificantTaps * clampedDelay;
    } else {
        tailExtensionFactor = clampedDelay * 2; // If no feedback, just allow for the first delay tap and a bit more
    }
    const tailExtensionSeconds = Math.min(tailExtensionFactor, 30); // Cap tail extension to e.g. 30 seconds
    
    const extendedLength = decodedAudioBuffer.length + Math.floor(audioContext.sampleRate * tailExtensionSeconds);
    
    const offlineContext = new OfflineAudioContext(
      decodedAudioBuffer.numberOfChannels,
      Math.max(1, extendedLength), // Ensure length is at least 1
      decodedAudioBuffer.sampleRate
    );
    
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;

    const delayNode = offlineContext.createDelay(clampedDelay + 1); // Max delay, +1 for safety withsetValueAtTime
    delayNode.delayTime.setValueAtTime(clampedDelay, 0);

    const feedbackNode = offlineContext.createGain();
    feedbackNode.gain.setValueAtTime(clampedFeedback, 0);

    const dryNode = offlineContext.createGain();
    dryNode.gain.setValueAtTime(1 - clampedMix, 0);
    
    const wetNode = offlineContext.createGain();
    wetNode.gain.setValueAtTime(clampedMix, 0);
    
    // Routing:
    // Dry path
    sourceNode.connect(dryNode);
    dryNode.connect(offlineContext.destination);

    // Wet path (with feedback loop)
    sourceNode.connect(delayNode);
    delayNode.connect(wetNode);
    wetNode.connect(offlineContext.destination);

    // Feedback loop
    delayNode.connect(feedbackNode);
    feedbackNode.connect(delayNode); // Output of feedback gain goes back into the delay input
    
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

    // Create a new AudioBuffer to hold the reversed audio
    const reversedBuffer = audioContext.createBuffer(
      numChannels,
      length,
      decodedAudioBuffer.sampleRate
    );

    // Reverse each channel's data
    for (let i = 0; i < numChannels; i++) {
      const channelData = decodedAudioBuffer.getChannelData(i);
      const reversedChannelData = reversedBuffer.getChannelData(i);
      // Make a copy to avoid modifying the original buffer if it's needed elsewhere (though getChannelData returns a copy)
      const originalChannelDataCopy = new Float32Array(channelData); 
      for (let j = 0; j < length; j++) {
        reversedChannelData[j] = originalChannelDataCopy[length - 1 - j];
      }
    }
    
    // Use an OfflineAudioContext to "play" the reversed buffer and get a new data URL
    const offlineContext = new OfflineAudioContext(numChannels, length, decodedAudioBuffer.sampleRate);
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = reversedBuffer; // Use the reversed buffer
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
    
    const newTempo = Math.max(0.1, Math.min(tempo, 4)); // Clamp tempo between 0.1x and 4x
    // Adjust the length of the offline context based on the new tempo
    const newLength = Math.max(1, Math.round(decodedAudioBuffer.length / newTempo));
    
    const offlineContext = new OfflineAudioContext(
        decodedAudioBuffer.numberOfChannels,
        newLength, // Use the calculated new length
        decodedAudioBuffer.sampleRate
    );

    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = decodedAudioBuffer;
    // The playbackRate property of AudioBufferSourceNode changes both tempo and pitch
    sourceNode.playbackRate.setValueAtTime(newTempo, 0); 
    
    sourceNode.connect(offlineContext.destination);
    sourceNode.start(0);
    
    const renderedBuffer = await offlineContext.startRendering();
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

    return { processedAudioDataUrl, analysis: `Pace adjusted to ${newTempo.toFixed(2)}x. (Note: This basic method also affects pitch).` };
  },

  gainController: async (audioDataUrl: string, { gain }: { gain: number }) => {
    // Convert dB to linear gain value: gain = 10^(dB/20)
    const gainValue = Math.pow(10, gain / 20); 
    return processAudioWithEffect(audioDataUrl, (context, source, buffer) => {
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);
      return [gainNode];
    }, `Gain adjusted by ${gain}dB (linear gain: ${gainValue.toFixed(2)}).`);
  },

  rhythmDetector: async (audioDataUrl: string, params: {}): Promise<{ processedAudioDataUrl: string; analysis?: string }> => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) {
      return { processedAudioDataUrl: audioDataUrl, analysis: "BPM Analysis: AudioContext not available." };
    }

    try {
      const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      if (audioBuffer.length === 0) {
        return { processedAudioDataUrl: audioDataUrl, analysis: "BPM Analysis: Audio buffer is empty." };
      }
      
      const channelData = audioBuffer.getChannelData(0); // Analyze first channel
      const sampleRate = audioBuffer.sampleRate;

      // --- Peak Detection ---
      // Calculate dynamic threshold
      let maxAmplitude = 0;
      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > maxAmplitude) {
          maxAmplitude = Math.abs(channelData[i]);
        }
      }
      
      // Set threshold to 50% of max amplitude, with a minimum floor to handle quiet audio
      const dynamicThreshold = maxAmplitude * 0.5; 
      const threshold = dynamicThreshold > 0.05 ? dynamicThreshold : 0.05;

      const peaks = [];
      // Minimum distance between peaks (e.g., 200ms, corresponds to max ~300 BPM)
      const minPeakDistanceSamples = Math.floor(sampleRate * 0.20); 

      let lastPeakSampleIndex = -minPeakDistanceSamples; // Initialize to allow first peak

      for (let i = 1; i < channelData.length - 1; i++) {
        // Check for local maximum: current sample is greater than its neighbors
        if (channelData[i] > channelData[i-1] && channelData[i] > channelData[i+1]) {
          // Check if it's above threshold and far enough from the last peak
          if (channelData[i] > threshold && (i - lastPeakSampleIndex) > minPeakDistanceSamples) {
            peaks.push(i); // Store sample index of the peak
            lastPeakSampleIndex = i;
          }
        }
      }

      if (peaks.length < 2) {
        return { processedAudioDataUrl: audioDataUrl, analysis: "BPM Analysis: Not enough distinct peaks found to determine BPM. Try with audio that has clearer rhythmic elements." };
      }

      // --- Interval Calculation ---
      const intervalsInSeconds = [];
      for (let i = 1; i < peaks.length; i++) {
        intervalsInSeconds.push((peaks[i] - peaks[i-1]) / sampleRate);
      }

      if (intervalsInSeconds.length === 0) {
        return { processedAudioDataUrl: audioDataUrl, analysis: "BPM Analysis: Could not calculate intervals between peaks." };
      }

      // --- Most Common Interval (Histogram-based) ---
      const intervalCounts: { [key: string]: number } = {};
      const intervalPrecision = 0.01; // Group intervals by 0.01s precision

      intervalsInSeconds.forEach(interval => {
        // Quantize interval to create bins
        const bin = (Math.round(interval / intervalPrecision) * intervalPrecision).toFixed(2);
        intervalCounts[bin] = (intervalCounts[bin] || 0) + 1;
      });

      let mostCommonIntervalSec = 0;
      let maxCount = 0;
      for (const intervalStr in intervalCounts) {
        if (intervalCounts[intervalStr] > maxCount) {
          maxCount = intervalCounts[intervalStr];
          mostCommonIntervalSec = parseFloat(intervalStr);
        }
      }
      
      // Filter out very short or very long common intervals that are unlikely BPMs
      // e.g., interval for 40 BPM is 1.5s, for 240 BPM is 0.25s
      if (mostCommonIntervalSec <= 0 || mostCommonIntervalSec < 60/240 || mostCommonIntervalSec > 60/40 ) {
        // Try to find multiples or sub-multiples if the primary detected interval is out of typical BPM range
        // This part can be more complex; for now, we'll stick to the primary detection
        let plausibleInterval = 0;
        let highestPlausibleCount = 0;

        for (const intervalStr in intervalCounts) {
            const currentInterval = parseFloat(intervalStr);
            if (currentInterval >= 60/240 && currentInterval <= 60/40) { // Typical BPM range
                if (intervalCounts[intervalStr] > highestPlausibleCount) {
                    highestPlausibleCount = intervalCounts[intervalStr];
                    plausibleInterval = currentInterval;
                }
            }
        }
        if (plausibleInterval > 0) {
            mostCommonIntervalSec = plausibleInterval;
        } else {
             // If still no plausible interval, check if doubling or halving the original makes sense
            if (mostCommonIntervalSec > 0) {
                if (mostCommonIntervalSec * 2 >= 60/240 && mostCommonIntervalSec * 2 <= 60/40) mostCommonIntervalSec *=2;
                else if (mostCommonIntervalSec / 2 >= 60/240 && mostCommonIntervalSec / 2 <= 60/40) mostCommonIntervalSec /=2;
            }

            if (mostCommonIntervalSec <= 0 || mostCommonIntervalSec < 60/240 || mostCommonIntervalSec > 60/40) {
                 return { processedAudioDataUrl: audioDataUrl, analysis: "BPM Analysis: Could not determine a consistent beat interval in a typical musical range." };
            }
        }
      }


      const bpm = 60 / mostCommonIntervalSec;
      const analysis = `BPM Analysis: Estimated ${bpm.toFixed(1)} BPM. (Interval: ${mostCommonIntervalSec.toFixed(2)}s). Note: This is a basic estimation and may not be accurate for all audio types.`;
      
      return { processedAudioDataUrl: audioDataUrl, analysis };

    } catch (error) {
      console.error("Error in rhythmDetector:", error);
      return { processedAudioDataUrl: audioDataUrl, analysis: `BPM Analysis: Error during processing - ${error.message || 'Unknown error'}` };
    }
  },

  dreamscapeMaker: async (audioDataUrl: string, params: {}) => {
    // Apply pace adjuster first
    const slowedResult = await audioUtils.paceAdjuster(audioDataUrl, { tempo: 0.75 }); // Slow down to 75%
    // Then apply echo generator to the slowed audio
    const dreamResult = await audioUtils.echoGenerator(slowedResult.processedAudioDataUrl, { delay: 200, feedback: 0.4, mix: 0.35 });
    return { ...dreamResult, analysis: "Dreamscape Maker: Applied 0.75x slowdown and echo (200ms delay, 40% feedback, 35% mix)." };
  },

  frequencyTuner: async (audioDataUrl: string, params: {}) => { 
    // Target A4=432Hz from A4=440Hz means a ratio of 432/440
    const pitchShiftRatio = 432 / 440; 
    // Convert ratio to semitones: semitones = 12 * log2(ratio)
    const semitones = 12 * Math.log2(pitchShiftRatio);
    const result = await audioUtils.keyTransposer(audioDataUrl, { semitones });
    return { ...result, analysis: `Tuned to 432Hz (shifted by approx. ${semitones.toFixed(2)} semitones from 440Hz standard).` };
  },

  // Bass Booster Presets using Subharmonic Intensifier
  subtleSubwoofer: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 20 }),
  gentleBassBoost: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 40 }),
  mediumBassEnhancement: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 60 }),
  intenseBassAmplifier: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 80 }),
  maximumBassOverdrive: (d, p) => audioUtils.subharmonicIntensifier(d, { intensity: 100 }),

  // Reverb Presets using Echo Generator
  vocalAmbience: (d, p) => audioUtils.echoGenerator(d, { delay: 80, feedback: 0.2, mix: 0.2 }),
  washroomEcho: (d, p) => audioUtils.echoGenerator(d, { delay: 150, feedback: 0.5, mix: 0.4 }),
  compactRoomReflector: (d, p) => audioUtils.echoGenerator(d, { delay: 100, feedback: 0.3, mix: 0.25 }),
  averageRoomReverberator: (d, p) => audioUtils.echoGenerator(d, { delay: 250, feedback: 0.4, mix: 0.3 }),
  grandRoomReverb: (d, p) => audioUtils.echoGenerator(d, { delay: 400, feedback: 0.45, mix: 0.35 }),
  chapelEchoes: (d, p) => audioUtils.echoGenerator(d, { delay: 600, feedback: 0.5, mix: 0.3 }),
  cathedralAcoustics: (d, p) => audioUtils.echoGenerator(d, { delay: 800, feedback: 0.55, mix: 0.25 }),

  automatedSweep: async (audioDataUrl: string, { speed }: { speed: number }) => {
     // Ensure output is stereo for panner to work
     return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        // Panner only makes sense for stereo or if we force mono to stereo first.
        // The processAudioWithEffect with outputChannelCountForContext=2 handles mono->stereo conversion if needed.
        if (buffer.numberOfChannels < 1) return []; // Should not happen with proper audio loading

        const panner = context.createStereoPanner();
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        const clampedSpeed = Math.max(0.05, Math.min(speed, 10)); // Clamp speed: 0.05Hz to 10Hz
        lfo.frequency.setValueAtTime(clampedSpeed, context.currentTime); 
        
        const lfoGain = context.createGain(); // LFO output is -1 to 1, panner.pan expects this range.
        lfoGain.gain.value = 1; // Full LFO range
        
        lfo.connect(lfoGain);
        lfoGain.connect(panner.pan); // Connect LFO (via gain) to control the pan property
        
        lfo.start();
        
        return [panner]; 
    }, `Automated Sweep: Speed ${speed}Hz. Output will be stereo.`, 2); // Force output to stereo
  },

  audioSplitter: async (audioDataUrl: string, { startTime: startTimeMinutes, endTime: endTimeMinutes }: { startTime: number, endTime: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const originalDurationSeconds = decodedAudioBuffer.duration;
    const numChannels = decodedAudioBuffer.numberOfChannels;
    const sampleRate = decodedAudioBuffer.sampleRate;

    // Convert minutes to seconds
    let sTimeSeconds = Number(startTimeMinutes) * 60;
    let eTimeSeconds = Number(endTimeMinutes) * 60;
    
    // Validate inputs
    if (isNaN(sTimeSeconds) || isNaN(eTimeSeconds) || sTimeSeconds < 0 || eTimeSeconds < 0) {
      return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: `Audio Splitter: Invalid start (${startTimeMinutes}min) or end time (${endTimeMinutes}min). Times must be non-negative numbers. No changes made.` 
      };
    }

    // Clamp times to audio duration
    sTimeSeconds = Math.max(0, Math.min(sTimeSeconds, originalDurationSeconds));
    eTimeSeconds = Math.max(sTimeSeconds, Math.min(eTimeSeconds, originalDurationSeconds)); // Ensure end time is not before start time after clamping
        
    if (eTimeSeconds <= sTimeSeconds) {
         return { 
            processedAudioDataUrl: audioDataUrl, 
            analysis: `Audio Splitter: End time (${endTimeMinutes.toFixed(2)}min / ${eTimeSeconds.toFixed(2)}s) must be after start time (${startTimeMinutes.toFixed(2)}min / ${sTimeSeconds.toFixed(2)}s). No changes made.` 
        };
    }
    
    const splitDurationSeconds = eTimeSeconds - sTimeSeconds; 
    if (splitDurationSeconds <= 0.001) { // Check for zero or very near-zero duration
        return {
            processedAudioDataUrl: audioDataUrl, // Return original if segment is too short
            analysis: `Audio Splitter: Selected segment from ${sTimeSeconds.toFixed(2)}s (${startTimeMinutes.toFixed(2)}min) to ${eTimeSeconds.toFixed(2)}s (${endTimeMinutes.toFixed(2)}min) has negligible or zero duration. No changes made.`
        };
    }
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
    
    // It's possible for renderedBuffer.duration to be slightly off due to sample rounding.
    // Or if the source itself had issues.
    if (renderedBuffer.duration < 0.001) {
         return {
            processedAudioDataUrl: audioDataUrl, // Return original as splitting failed to produce audio
            analysis: `Audio Splitter: Extracted segment from ${sTimeSeconds.toFixed(2)}s to ${eTimeSeconds.toFixed(2)}s resulted in an empty audio clip. Original audio duration: ${originalDurationSeconds.toFixed(2)}s. No changes made.`
        };
    }
    
    const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
    const analysisMessage = `Audio Splitter: Extracted segment from ${startTimeMinutes.toFixed(2)}min (${sTimeSeconds.toFixed(2)}s) to ${endTimeMinutes.toFixed(2)}min (${eTimeSeconds.toFixed(2)}s). New duration: ${renderedBuffer.duration.toFixed(2)}s.`;
    
    return {
      processedAudioDataUrl,
      analysis: analysisMessage
    };
  },
  spatialAudioEffect: async (audioDataUrl: string, { depth }: { depth: number }) => {
    // Ensure output is stereo
    return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        // If buffer is mono, it will be upmixed to stereo by OfflineAudioContext if outputChannelCountForContext=2.
        // Then the panner can work on this stereo signal.
        
        const panner = context.createStereoPanner();
        // Convert depth (0-100) to pan value (-1 to 1). 50 is center.
        const panValue = (depth - 50) / 50; 
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), context.currentTime);

        return [panner]; 
    }, `Spatial Audio Effect: Pan set to ${((depth - 50) / 50).toFixed(2)}. Output will be stereo.`, 2); // Force output to stereo
  },
};
