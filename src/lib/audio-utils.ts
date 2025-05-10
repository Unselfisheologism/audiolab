
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
      const filterFreq = Math.max(20, 1000 + (frequency * 40)); 
      biquadFilter.frequency.setValueAtTime(filterFreq, context.currentTime); 
      biquadFilter.Q.setValueAtTime(1.5, context.currentTime); 
      biquadFilter.gain.setValueAtTime(frequency, context.currentTime); 
      return [biquadFilter];
    }, `Altered resonance: Peaking filter with ${frequency}dB gain around ${ (1000 + (frequency * 40)).toFixed(0) }Hz.`);
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
        return []; 
      }
  
      const width = widthParam / 100; 
      const splitter = offlineContext.createChannelSplitter(2);
      const merger = offlineContext.createChannelMerger(2);
      const k = (width - 1) / 2;

      const gainL_to_L_out = offlineContext.createGain();
      const gainR_to_L_out_inverted = offlineContext.createGain(); 
      
      const gainR_to_R_out = offlineContext.createGain();
      const gainL_to_R_out_inverted = offlineContext.createGain(); 

      gainL_to_L_out.gain.value = 1 + k;
      gainR_to_L_out_inverted.gain.value = -k;

      gainR_to_R_out.gain.value = 1 + k;
      gainL_to_R_out_inverted.gain.value = -k;
      
      splitter.connect(gainL_to_L_out, 0, 0); 
      gainL_to_L_out.connect(merger, 0, 0);  

      splitter.connect(gainR_to_L_out_inverted, 1, 0); 
      gainR_to_L_out_inverted.connect(merger, 0, 0); 

      splitter.connect(gainR_to_R_out, 1, 0); 
      gainR_to_R_out.connect(merger, 0, 1); 

      splitter.connect(gainL_to_R_out_inverted, 0, 0); 
      gainL_to_R_out_inverted.connect(merger, 0, 1); 
  
      return [splitter, merger]; 
    }, `Stereo Widener: Width set to ${widthParam}%. Applied only if audio is stereo.`, 
       2 
    );
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

    return { processedAudioDataUrl, analysis: `Key Transposer: Shifted by ${semitones} semitones (playback rate ${clampedPlaybackRate.toFixed(2)}x). Note: This method affects duration.` };
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
    
    return { processedAudioDataUrl, analysis: `Echo: Delay ${(clampedDelay*1000).toFixed(0)}ms, Feedback ${(clampedFeedback*100).toFixed(0)}%, Mix ${(clampedMix*100).toFixed(0)}% wet.` };
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

    return { processedAudioDataUrl, analysis: `Pace adjusted to ${newTempo.toFixed(2)}x. (Note: This basic method also affects pitch).` };
  },

  gainController: async (audioDataUrl: string, { gain }: { gain: number }) => {
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
      
      const channelData = audioBuffer.getChannelData(0); 
      const sampleRate = audioBuffer.sampleRate;

      let maxAmplitude = 0;
      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > maxAmplitude) {
          maxAmplitude = Math.abs(channelData[i]);
        }
      }
      
      const dynamicThreshold = maxAmplitude * 0.5; 
      const threshold = dynamicThreshold > 0.05 ? dynamicThreshold : 0.05;

      const peaks = [];
      const minPeakDistanceSamples = Math.floor(sampleRate * 0.20); 

      let lastPeakSampleIndex = -minPeakDistanceSamples; 

      for (let i = 1; i < channelData.length - 1; i++) {
        if (channelData[i] > channelData[i-1] && channelData[i] > channelData[i+1]) {
          if (channelData[i] > threshold && (i - lastPeakSampleIndex) > minPeakDistanceSamples) {
            peaks.push(i); 
            lastPeakSampleIndex = i;
          }
        }
      }

      if (peaks.length < 2) {
        return { processedAudioDataUrl: audioDataUrl, analysis: "Not enough distinct peaks found to determine BPM." };
      }

      const intervalsInSeconds = [];
      for (let i = 1; i < peaks.length; i++) {
        intervalsInSeconds.push((peaks[i] - peaks[i-1]) / sampleRate);
      }

      if (intervalsInSeconds.length === 0) {
        return { processedAudioDataUrl: audioDataUrl, analysis: "Could not calculate intervals between peaks." };
      }

      const intervalCounts: { [key: string]: number } = {};
      const intervalPrecision = 0.01; 

      intervalsInSeconds.forEach(interval => {
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
      
      if (mostCommonIntervalSec <= 0 || mostCommonIntervalSec < 60/240 || mostCommonIntervalSec > 60/40 ) {
        let plausibleInterval = 0;
        let highestPlausibleCount = 0;

        for (const intervalStr in intervalCounts) {
            const currentInterval = parseFloat(intervalStr);
            if (currentInterval >= 60/240 && currentInterval <= 60/40) { 
                if (intervalCounts[intervalStr] > highestPlausibleCount) {
                    highestPlausibleCount = intervalCounts[intervalStr];
                    plausibleInterval = currentInterval;
                }
            }
        }
        if (plausibleInterval > 0) {
            mostCommonIntervalSec = plausibleInterval;
        } else {
            if (mostCommonIntervalSec > 0) {
                if (mostCommonIntervalSec * 2 >= 60/240 && mostCommonIntervalSec * 2 <= 60/40) mostCommonIntervalSec *=2;
                else if (mostCommonIntervalSec / 2 >= 60/240 && mostCommonIntervalSec / 2 <= 60/40) mostCommonIntervalSec /=2;
            }

            if (mostCommonIntervalSec <= 0 || mostCommonIntervalSec < 60/240 || mostCommonIntervalSec > 60/40) {
                 return { processedAudioDataUrl: audioDataUrl, analysis: "Could not determine a consistent beat interval." };
            }
        }
      }

      const bpm = 60 / mostCommonIntervalSec;
      const analysis = `BPM: ${bpm.toFixed(1)}, Interval: ${mostCommonIntervalSec.toFixed(2)}s`;
      
      return { processedAudioDataUrl: audioDataUrl, analysis };

    } catch (error) {
      console.error("Error in rhythmDetector:", error);
      return { processedAudioDataUrl: audioDataUrl, analysis: `Error during BPM processing - ${error.message || 'Unknown error'}` };
    }
  },

  dreamscapeMaker: async (audioDataUrl: string, params: {}) => {
    const slowedResult = await audioUtils.paceAdjuster(audioDataUrl, { tempo: 0.75 }); 
    const dreamResult = await audioUtils.echoGenerator(slowedResult.processedAudioDataUrl, { delay: 200, feedback: 0.4, mix: 0.35 });
    return { ...dreamResult, analysis: "Dreamscape Maker: Applied 0.75x slowdown and echo (200ms delay, 40% feedback, 35% mix)." };
  },

  frequencyTuner: async (audioDataUrl: string, params: {}) => { 
    const pitchShiftRatio = 432 / 440; 
    const semitones = 12 * Math.log2(pitchShiftRatio);
    const result = await audioUtils.keyTransposer(audioDataUrl, { semitones });
    return { ...result, analysis: `Tuned to 432Hz (shifted by approx. ${semitones.toFixed(2)} semitones from 440Hz standard).` };
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
        if (buffer.numberOfChannels < 1) return []; 

        const panner = context.createStereoPanner();
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        const clampedSpeed = Math.max(0.05, Math.min(speed, 10)); 
        lfo.frequency.setValueAtTime(clampedSpeed, context.currentTime); 
        
        const lfoGain = context.createGain(); 
        lfoGain.gain.value = 1; 
        
        lfo.connect(lfoGain);
        lfoGain.connect(panner.pan); 
        
        lfo.start();
        
        return [panner]; 
    }, `Automated Sweep: Speed ${speed}Hz. Output will be stereo.`, 2); 
  },

  audioSplitter: async (audioDataUrl: string, { startTime: startTimeMinutes, endTime: endTimeMinutes }: { startTime: number, endTime: number }) => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) throw new Error("AudioContext not supported");

    const arrayBuffer = await dataUrlToArrayBuffer(audioDataUrl);
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const originalDurationSeconds = decodedAudioBuffer.duration;
    const numChannels = decodedAudioBuffer.numberOfChannels;
    const sampleRate = decodedAudioBuffer.sampleRate;

    let sTimeSeconds = Number(startTimeMinutes) * 60;
    let eTimeSeconds = Number(endTimeMinutes) * 60;
    
    if (isNaN(sTimeSeconds) || isNaN(eTimeSeconds) || sTimeSeconds < 0 || eTimeSeconds < 0) {
      return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: `Audio Splitter: Invalid start (${startTimeMinutes}min) or end time (${endTimeMinutes}min). Times must be non-negative numbers. No changes made.` 
      };
    }

    sTimeSeconds = Math.max(0, Math.min(sTimeSeconds, originalDurationSeconds));
    eTimeSeconds = Math.max(sTimeSeconds, Math.min(eTimeSeconds, originalDurationSeconds)); 
        
    if (eTimeSeconds <= sTimeSeconds) {
         return { 
            processedAudioDataUrl: audioDataUrl, 
            analysis: `Audio Splitter: End time (${endTimeMinutes.toFixed(2)}min / ${eTimeSeconds.toFixed(2)}s) must be after start time (${startTimeMinutes.toFixed(2)}min / ${sTimeSeconds.toFixed(2)}s). No changes made.` 
        };
    }
    
    const splitDurationSeconds = eTimeSeconds - sTimeSeconds; 
    if (splitDurationSeconds <= 0.001) { 
        return {
            processedAudioDataUrl: audioDataUrl, 
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
    
    bufferSource.start(0, sTimeSeconds, splitDurationSeconds); 

    const renderedBuffer = await offlineContext.startRendering();
    
    if (renderedBuffer.duration < 0.001) {
         return {
            processedAudioDataUrl: audioDataUrl, 
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
    return processAudioWithEffect(audioDataUrl, (context, sourceNode, buffer) => {
        const panner = context.createStereoPanner();
        const panValue = (depth - 50) / 50; 
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), context.currentTime);
        return [panner]; 
    }, `Spatial Audio Effect: Pan set to ${((depth - 50) / 50).toFixed(2)}. Output will be stereo.`, 2); 
  },
};

