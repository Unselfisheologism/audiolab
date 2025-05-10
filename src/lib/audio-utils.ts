



// In a real app, these would interact with Web Audio API or a backend service

export type AudioProcessingFunction = (
  audioDataUrl: string,
  params: Record<string, any>
) => Promise<{ processedAudioDataUrl: string; analysis?: string }>;

// Helper function to convert AudioBuffer to WAV Data URL
async function audioBufferToWavDataUrl(audioBuffer: AudioBuffer): Promise<string> {
  const wavBlob = audioBufferToWavBlob(audioBuffer); 
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(wavBlob);
  });
}

// Based on https://gist.github.com/also/912053
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob { 
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bitsPerSample = 16;

  const dataSize = numChannels * numSamples * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      let s = Math.max(-1, Math.min(1, sample));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF; // encode to 16-bit signed int
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


const alterResonance: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const filterNode = offlineContext.createBiquadFilter();
  filterNode.type = 'peaking'; 

  const BASE_PEAKING_FILTER_HZ = 1000; 
  const Q_VALUE = 1.5; 
  const GAIN_VALUE_MAX = 12; 

  const frequencyShiftParam = params.frequency || 0; 
  const numericFrequencyShift = typeof frequencyShiftParam === 'number' ? frequencyShiftParam : 0;
  
  const gain = (numericFrequencyShift / 12) * GAIN_VALUE_MAX;
  const centerFrequency = BASE_PEAKING_FILTER_HZ * Math.pow(2, numericFrequencyShift / 12);
  
  filterNode.frequency.setValueAtTime(centerFrequency, offlineContext.currentTime);
  filterNode.Q.setValueAtTime(Q_VALUE, offlineContext.currentTime);
  filterNode.gain.setValueAtTime(gain, offlineContext.currentTime);

  sourceNode.connect(filterNode);
  filterNode.connect(offlineContext.destination);
  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  const analysis = `Applied Resonance Alteration: Peaking filter centered at ${centerFrequency.toFixed(2)} Hz, Q=${Q_VALUE}, Gain=${gain.toFixed(1)}dB. Shift param: ${numericFrequencyShift} semitones.`;
  
  await audioContext.close();

  return { processedAudioDataUrl, analysis };
};

const temporalModification: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const rate = Number(params.rate || 1.0);
  if (rate <= 0) {
    await audioContext.close();
    throw new Error("Playback rate must be greater than 0.");
  }

  const newLengthInSamples = Math.floor(decodedAudioBuffer.length / rate);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    newLengthInSamples, 
    decodedAudioBuffer.sampleRate 
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;
  sourceNode.playbackRate.value = rate; 

  sourceNode.connect(offlineContext.destination);
  sourceNode.start(0); 
  
  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  const analysis = `Applied Temporal Modification: Playback rate set to ${rate.toFixed(2)}x. This affects both speed and pitch. New duration: ${(renderedBuffer.duration).toFixed(2)}s.`;
  
  await audioContext.close();

  return { processedAudioDataUrl, analysis };
};

const automatedSweep: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (decodedAudioBuffer.numberOfChannels < 2) {
     await audioContext.close();
     return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: "Automated Sweep requires stereo audio. Original mono audio returned." 
     };
  }

  const offlineContext = new OfflineAudioContext(
    2, 
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const pannerNode = offlineContext.createStereoPanner();

  const lfo = offlineContext.createOscillator();
  lfo.type = 'sine'; 
  const sweepSpeed = Number(params.speed || 0.5); 
  lfo.frequency.setValueAtTime(sweepSpeed, offlineContext.currentTime);

  const lfoGain = offlineContext.createGain();
  lfoGain.gain.setValueAtTime(1.0, offlineContext.currentTime); 

  lfo.connect(lfoGain);
  lfoGain.connect(pannerNode.pan); 
  
  sourceNode.connect(pannerNode);
  pannerNode.connect(offlineContext.destination);

  lfo.start(0);
  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

  const analysis = `Applied Automated Sweep: Panning sound left-to-right at ${sweepSpeed.toFixed(2)} Hz.`;

  await audioContext.close();

  return { processedAudioDataUrl, analysis };
};

const stereoWidener: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (decodedAudioBuffer.numberOfChannels < 2) {
     await audioContext.close();
     return { 
        processedAudioDataUrl: audioDataUrl, 
        analysis: "Stereo Widener requires stereo audio. Original mono audio returned." 
     };
  }

  const widthParam = params.width !== undefined ? Number(params.width) : 100; 
  const widthFactor = widthParam / 100.0; 

  const offlineContext = new OfflineAudioContext(
    2, 
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const inputLChannelData = decodedAudioBuffer.getChannelData(0);
  const inputRChannelData = decodedAudioBuffer.getChannelData(1); 

  const length = decodedAudioBuffer.length;
  const processedL = new Float32Array(length);
  const processedR = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const lSample = inputLChannelData[i];
    const rSample = inputRChannelData[i];

    const midSignal = (lSample + rSample) * 0.5;
    const sideSignal = (lSample - rSample) * 0.5;

    const newSideSignal = sideSignal * widthFactor;

    let newLSample = midSignal + newSideSignal;
    let newRSample = midSignal - newSideSignal;

    newLSample = Math.max(-1.0, Math.min(1.0, newLSample));
    newRSample = Math.max(-1.0, Math.min(1.0, newRSample));

    processedL[i] = newLSample;
    processedR[i] = newRSample;
  }

  const outputBuffer = offlineContext.createBuffer(2, length, decodedAudioBuffer.sampleRate);
  outputBuffer.copyToChannel(processedL, 0, 0); 
  outputBuffer.copyToChannel(processedR, 1, 0); 
  
  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = outputBuffer;
  sourceNode.connect(offlineContext.destination);
  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  const analysis = `Applied Stereo Widener: Width set to ${widthParam}%. Factor: ${widthFactor.toFixed(2)}.`;
  
  await audioContext.close();

  return { processedAudioDataUrl, analysis };
};

const subharmonicIntensifier: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const lowshelfFilter = offlineContext.createBiquadFilter();
  lowshelfFilter.type = 'lowshelf';
  
  const intensityParam = Number(params.intensity || 0); 
  const gainDb = (intensityParam / 100) * 18; // Max 18dB boost, adjustable

  lowshelfFilter.frequency.setValueAtTime(120, offlineContext.currentTime); // Boost frequencies below 120Hz
  lowshelfFilter.gain.setValueAtTime(gainDb, offlineContext.currentTime);

  // Connect the nodes
  sourceNode.connect(lowshelfFilter);
  lowshelfFilter.connect(offlineContext.destination);

  // Start the source node
  sourceNode.start(0);

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);
  
  const analysis = `Applied Subharmonic Intensifier: Low-shelf filter at 120Hz with ${gainDb.toFixed(1)}dB gain (Intensity: ${intensityParam}%).`;
  
  await audioContext.close();

  return { processedAudioDataUrl, analysis };
};

const frequencySculptor: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    decodedAudioBuffer.length,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;

  const lowGain = Number(params.low || 0);
  const midGain = Number(params.mid || 0);
  const highGain = Number(params.high || 0);

  const lowFilter = offlineContext.createBiquadFilter();
  lowFilter.type = 'lowshelf';
  lowFilter.frequency.setValueAtTime(250, offlineContext.currentTime);
  lowFilter.gain.setValueAtTime(lowGain, offlineContext.currentTime);

  const midFilter = offlineContext.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.setValueAtTime(1000, offlineContext.currentTime);
  midFilter.Q.setValueAtTime(1, offlineContext.currentTime); 
  midFilter.gain.setValueAtTime(midGain, offlineContext.currentTime);

  const highFilter = offlineContext.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.setValueAtTime(4000, offlineContext.currentTime); 
  highFilter.gain.setValueAtTime(highGain, offlineContext.currentTime);

  sourceNode.connect(lowFilter);
  lowFilter.connect(midFilter);
  midFilter.connect(highFilter);
  highFilter.connect(offlineContext.destination);

  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

  const analysis = `Applied Frequency Sculptor: Low: ${lowGain}dB @ 250Hz (Shelf), Mid: ${midGain}dB @ 1000Hz (Peak), High: ${highGain}dB @ 4000Hz (Shelf).`;

  await audioContext.close();
  return { processedAudioDataUrl, analysis };
};

const keyTransposer: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const semitones = Number(params.semitones || 0);
  const playbackRate = Math.pow(2, semitones / 12);

  if (playbackRate <= 0) {
    await audioContext.close();
    throw new Error("Playback rate (derived from semitones) must be greater than 0.");
  }
  
  const newLengthInSamples = Math.floor(decodedAudioBuffer.length / playbackRate);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    newLengthInSamples,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;
  sourceNode.playbackRate.value = playbackRate;

  sourceNode.connect(offlineContext.destination);
  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

  const analysis = `Applied Key Transposer: Shifted by ${semitones} semitones. Playback rate: ${playbackRate.toFixed(3)}x. This also affects tempo. New duration: ${(renderedBuffer.duration).toFixed(2)}s.`;
  
  await audioContext.close();
  return { processedAudioDataUrl, analysis };
};

const paceAdjuster: AudioProcessingFunction = async (audioDataUrl, params) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  await resumeAudioContext(audioContext);
  const response = await fetch(audioDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const tempoAdjust = Number(params.tempo || 1.0);
  if (tempoAdjust <= 0) {
    await audioContext.close();
    throw new Error("Tempo adjustment factor must be greater than 0.");
  }

  // Changing playbackRate affects duration, so the OfflineAudioContext length needs adjustment.
  const newLengthInSamples = Math.floor(decodedAudioBuffer.length / tempoAdjust);

  const offlineContext = new OfflineAudioContext(
    decodedAudioBuffer.numberOfChannels,
    newLengthInSamples,
    decodedAudioBuffer.sampleRate
  );
  await resumeAudioContext(offlineContext);

  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = decodedAudioBuffer;
  sourceNode.playbackRate.value = tempoAdjust;

  sourceNode.connect(offlineContext.destination);
  sourceNode.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  const processedAudioDataUrl = await audioBufferToWavDataUrl(renderedBuffer);

  const analysis = `Applied Pace Adjuster: Tempo adjusted by a factor of ${tempoAdjust.toFixed(2)}. Note: This method also affects pitch. New duration: ${(renderedBuffer.duration).toFixed(2)}s.`;
  
  await audioContext.close();
  return { processedAudioDataUrl, analysis };
};


const simulateProcessing = async (audioDataUrl: string, operationName: string, params: Record<string, any>): Promise<{ processedAudioDataUrl: string; analysis?: string }> => {
  console.log(`Simulating ${operationName} with params:`, params);
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50)); // Simulate async work
  const analysis = `Successfully applied ${operationName}. Parameters: ${JSON.stringify(params)}. This is a placeholder analysis.`;
  return { processedAudioDataUrl: audioDataUrl, analysis };
};

export const audioUtils: Record<string, AudioProcessingFunction> = {
  alterResonance: alterResonance,
  temporalModification: temporalModification,
  automatedSweep: automatedSweep,
  stereoWidener: stereoWidener,
  subharmonicIntensifier: subharmonicIntensifier,
  frequencySculptor: frequencySculptor,
  keyTransposer: keyTransposer,
  paceAdjuster: paceAdjuster,
  echoGenerator: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Echo Generator', params),
  reversePlayback: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Reverse Playback', params),
  channelRouter: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Channel Router', params),
  audioSplitter: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Audio Splitter', params),
  voiceExtractor: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Voice Extractor', params),
  gainController: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Gain Controller', params),
  rhythmDetector: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Rhythm Detector', { ...params, analysis: "Detected BPM: 120 (placeholder)" }),
  channelCompressor: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Channel Compressor', params),
  spatialAudioEffect: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Spatial Audio Effect', params),
  dreamscapeMaker: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Dreamscape Maker', params),
  frequencyTuner: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Frequency Tuner (432Hz)', params),
  // Bass Booster Presets
  subtleSubwoofer: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Subtle Subwoofer', params),
  gentleBassBoost: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Gentle Bass Boost', params),
  mediumBassEnhancement: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Medium Bass Enhancement', params),
  intenseBassAmplifier: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Intense Bass Amplifier', params),
  maximumBassOverdrive: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Maximum Bass Overdrive', params),
  // Reverb Presets
  vocalAmbience: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Vocal Ambience Reverb', params),
  washroomEcho: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Washroom Echo Reverb', params),
  compactRoomReflector: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Compact Room Reverb', params),
  averageRoomReverberator: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Average Room Reverb', params),
  grandRoomReverb: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Grand Room Reverb', params),
  chapelEchoes: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Chapel Echoes Reverb', params),
  cathedralAcoustics: (audioDataUrl, params) => simulateProcessing(audioDataUrl, 'Cathedral Acoustics Reverb', params),
};

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to ensure AudioContext is resumed if it's suspended
export const resumeAudioContext = async (audioContext: AudioContext | OfflineAudioContext | null) => {
  if (audioContext instanceof AudioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log("AudioContext resumed.");
    } catch (e) {
      console.error("Error resuming AudioContext:", e);
    }
  }
};

