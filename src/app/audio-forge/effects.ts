
import type { Effect } from '@/types/audio-forge';
import {
  Waves,
  Clock,
  Download,
  Expand,
  Shuffle,
  SignalLow,
  SlidersHorizontal,
  Music2,
  Repeat,
  Rewind,
  Spline,
  Gauge,
  Scissors,
  Volume2,
  HeartPulse,
  Building,
  Moon,
  Copyleft,
  Headphones,
  TrendingDown,
  HelpingHand,
} from 'lucide-react';

export const effectsList: Effect[] = [
  // Creative Presets
  {
    id: 'dreamscapeMaker',
    name: "Lo-fi", // Changed from "Slow 'n Reverb"
    description: 'Create a slowed and reverb effect for ethereal soundscapes.',
    icon: Moon,
    controlType: 'button',
    actionLabel: "Apply Lo-fi Effect", // Changed from "Apply Slow 'n Reverb"
    handlerKey: 'dreamscapeMaker',
    groupName: 'Creative Presets',
  },
  {
    id: 'audio8DConverter',
    name: '8D Audio Converter',
    description: 'Simulate an 8D audio experience by combining panning and reverb. Best experienced with headphones.',
    icon: Headphones,
    controlType: 'button',
    actionLabel: 'Apply 8D Effect',
    handlerKey: 'apply8DEffect',
    groupName: 'Creative Presets',
  },
  {
    id: 'frequencyTuner432',
    name: 'Tune to 432Hz',
    description: 'Convert a track from standard 440Hz A4 tuning to 432Hz.',
    icon: Copyleft, 
    controlType: 'button',
    actionLabel: 'Tune to 432Hz',
    handlerKey: 'frequencyTuner',
    groupName: 'Creative Presets',
  },
  // Core Effects
  {
    id: 'resonanceAlteration',
    name: 'Resonance Alteration',
    description: 'Modify the perceived frequency of sound.',
    icon: Waves,
    controlType: 'slider',
    parameters: [
      { name: 'frequency', label: 'Frequency Shift', type: 'slider', defaultValue: 0, min: -12, max: 12, step: 1 }
    ],
    handlerKey: 'alterResonance',
    groupName: 'Core Effects',
  },
  {
    id: 'temporalModification',
    name: 'Temporal Modification',
    description: 'Change the rate at which the audio is played.',
    icon: Clock,
    controlType: 'slider',
    parameters: [
      { name: 'rate', label: 'Playback Rate', type: 'slider', defaultValue: 1, min: 0.5, max: 2, step: 0.01 }
    ],
    handlerKey: 'temporalModification',
    groupName: 'Core Effects',
  },
  // Spatial Effects
  {
    id: 'stereoWidener',
    name: 'Stereo Widener',
    description: 'Enhance the spaciousness of stereo sounds.',
    icon: Expand,
    controlType: 'slider',
    parameters: [
      { name: 'width', label: 'Stereo Width', type: 'slider', defaultValue: 100, min: 0, max: 200, step: 1 }
    ],
    handlerKey: 'stereoWidener',
    groupName: 'Spatial Effects',
  },
  {
    id: 'automatedSweep',
    name: 'Automated Sweep',
    description: 'Dynamically shift sound between left and right channels.',
    icon: Shuffle,
    controlType: 'slider',
    parameters: [
      { name: 'speed', label: 'Sweep Speed (Hz)', type: 'slider', defaultValue: 0.5, min: 0.05, max: 5, step: 0.01 }
    ],
    handlerKey: 'automatedSweep',
    groupName: 'Spatial Effects',
  },
  // Frequency Tools
  {
    id: 'subharmonicIntensifier',
    name: 'Subharmonic Intensifier',
    description: 'Strengthen the lower frequencies in an audio track.',
    icon: TrendingDown,
    controlType: 'slider',
    parameters: [
      { name: 'intensity', label: 'Intensity', type: 'slider', defaultValue: 50, min: 0, max: 100, step: 1 }
    ],
    handlerKey: 'subharmonicIntensifier',
    groupName: 'Frequency Tools',
  },
  {
    id: 'frequencySculptor',
    name: 'Frequency Sculptor',
    description: 'Fine-tune audio frequencies with a 3-band EQ.',
    icon: SlidersHorizontal,
    controlType: 'group', // Implies multiple sliders
    parameters: [
      { name: 'low', label: 'Low Gain (dB)', type: 'slider', defaultValue: 0, min: -12, max: 12, step: 0.5 },
      { name: 'mid', label: 'Mid Gain (dB)', type: 'slider', defaultValue: 0, min: -12, max: 12, step: 0.5 },
      { name: 'high', label: 'High Gain (dB)', type: 'slider', defaultValue: 0, min: -12, max: 12, step: 0.5 },
    ],
    handlerKey: 'frequencySculptor',
    groupName: 'Frequency Tools',
  },
  // Pitch & Time
  {
    id: 'keyTransposer',
    name: 'Key Transposer',
    description: 'Transpose the key of an audio piece.',
    icon: Music2, 
    controlType: 'number_input',
    parameters: [
      { name: 'semitones', label: 'Semitones', type: 'number_input', defaultValue: 0, min: -12, max: 12, step: 1 }
    ],
    handlerKey: 'keyTransposer',
    groupName: 'Pitch & Time',
  },
  {
    id: 'paceAdjuster',
    name: 'Pace Adjuster',
    description: 'Alter the playback tempo without affecting pitch.',
    icon: Gauge,
    controlType: 'slider',
    parameters: [
      { name: 'tempo', label: 'Tempo Adjust', type: 'slider', defaultValue: 1, min: 0.5, max: 2, step: 0.01 }
    ],
    handlerKey: 'paceAdjuster',
    groupName: 'Pitch & Time',
  },
  // Creative Effects
  {
    id: 'echoGenerator',
    name: 'Echo Generator',
    description: 'Simulate sound reflections with customizable delay and feedback.',
    icon: Repeat,
    controlType: 'group',
    parameters: [
      { name: 'delay', label: 'Delay (ms)', type: 'slider', defaultValue: 300, min: 10, max: 1000, step: 10 },
      { name: 'feedback', label: 'Feedback', type: 'slider', defaultValue: 0.5, min: 0, max: 0.95, step: 0.01 },
      { name: 'mix', label: 'Mix', type: 'slider', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    ],
    handlerKey: 'echoGenerator',
    groupName: 'Creative Effects',
  },
  {
    id: 'reversePlayback',
    name: 'Reverse Playback',
    description: 'Play audio backward.',
    icon: Rewind,
    controlType: 'button',
    actionLabel: 'Reverse Audio',
    handlerKey: 'reversePlayback',
    groupName: 'Creative Effects',
  },
  // Utility Tools
  {
    id: 'gainController',
    name: 'Gain Controller',
    description: 'Regulate sound intensity (volume).',
    icon: Volume2,
    controlType: 'slider',
    parameters: [
      { name: 'gain', label: 'Gain (dB)', type: 'slider', defaultValue: 0, min: -24, max: 24, step: 0.5 }
    ],
    handlerKey: 'gainController',
    groupName: 'Utility Tools',
  },
   {
    id: 'audioSplitter',
    name: 'Audio Splitter',
    description: 'Extract sections from an audio file by specifying start and end times in minutes.',
    icon: Scissors,
    controlType: 'group',
    parameters: [
      { name: 'startTime', label: 'Start Time (min)', type: 'number_input', defaultValue: 0, min: 0, step: 0.01 },
      { name: 'endTime', label: 'End Time (min)', type: 'number_input', defaultValue: 0.1, min: 0, step: 0.01 } // Default 0.1 min = 6 seconds
    ],
    handlerKey: 'audioSplitter',
    groupName: 'Utility Tools',
  },
  // Analysis Tools
  {
    id: 'rhythmDetector',
    name: 'Rhythm Detector',
    description: 'Analyze BPM (Beats Per Minute).',
    icon: HeartPulse,
    controlType: 'button',
    actionLabel: 'Analyze BPM',
    handlerKey: 'rhythmDetector',
    groupName: 'Analysis Tools',
    outputsAnalysis: true,
  },
  // Bass Boost Presets
  {
    id: 'bassBoosterPresets',
    name: 'Bass Booster',
    description: 'Presets to enhance low frequencies.',
    icon: SignalLow,
    controlType: 'group', 
    groupName: 'Bass Boost Presets',
    parameters: [
      { name: 'subtleSubwoofer', label: 'Subtle Subwoofer', type: 'button', handlerKey: 'subtleSubwoofer', defaultValue: '' },
      { name: 'gentleBassBoost', label: 'Gentle Boost', type: 'button', handlerKey: 'gentleBassBoost', defaultValue: '' },
      { name: 'mediumBassEnhancement', label: 'Medium Enhancement', type: 'button', handlerKey: 'mediumBassEnhancement', defaultValue: '' },
      { name: 'intenseBassAmplifier', label: 'Intense Amplifier', type: 'button', handlerKey: 'intenseBassAmplifier', defaultValue: '' },
      { name: 'maximumBassOverdrive', label: 'Maximum Overdrive', type: 'button', handlerKey: 'maximumBassOverdrive', defaultValue: '' },
    ]
  },
  // Reverb Presets
  {
    id: 'reverbPresets',
    name: 'Reverb Presets',
    description: 'Simulate various acoustic spaces.',
    icon: Building, 
    controlType: 'group', 
    groupName: 'Reverb Presets',
    parameters: [
      { name: 'vocalAmbience', label: 'Vocal Ambience', type: 'button', handlerKey: 'vocalAmbience', defaultValue: '' },
      { name: 'washroomEcho', label: 'Washroom', type: 'button', handlerKey: 'washroomEcho', defaultValue: '' },
      { name: 'compactRoomReflector', label: 'Small Room', type: 'button', handlerKey: 'compactRoomReflector', defaultValue: '' },
      { name: 'averageRoomReverberator', label: 'Medium Room', type: 'button', handlerKey: 'averageRoomReverberator', defaultValue: '' },
      { name: 'grandRoomReverb', label: 'Large Room', type: 'button', handlerKey: 'grandRoomReverb', defaultValue: '' },
      { name: 'chapelEchoes', label: 'Chapel Hall', type: 'button', handlerKey: 'chapelEchoes', defaultValue: '' }, 
      { name: 'cathedralAcoustics', label: 'Cathedral', type: 'button', handlerKey: 'cathedralAcoustics', defaultValue: '' }, 
    ]
  },
];

export const effectGroups = [
    'Creative Presets',
    'Core Effects',
    'Spatial Effects',
    'Frequency Tools',
    'Pitch & Time',
    'Creative Effects',
    'Utility Tools',
    'Analysis Tools',
    'Bass Boost Presets',
    'Reverb Presets'
];


export const fallbackIcon = HelpingHand;

// Features that might be represented differently or are not direct effects
// - Audio Upload & Processing: Handled by FileUploadArea
// - Export Configuration: Handled by ExportPanel
// - Format Shifter: Part of ExportPanel
// - Frequency Visualizer: Component in MainDisplayPanel
// - Amplitude Plotter: Component in MainDisplayPanel
// - AI Tools: Removed
