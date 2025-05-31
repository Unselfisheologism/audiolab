
export type VideoTemplateValue = "phone_call" | "song" | "audiobook";

export interface VideoTemplateOption {
  value: VideoTemplateValue;
  label: string;
  iconUrl: string;
  defaultBackgroundUrl: string;
}

export const videoTemplates: VideoTemplateOption[] = [
  {
    value: "phone_call",
    label: "Phone Call",
    iconUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748521350/2e3991e7-8642-4532-9d71-eebb4809d3ae_wefrmk.png",
    defaultBackgroundUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748522257/Image_fx_4_e7fpqk.png",
  },
  {
    value: "song",
    label: "Song Lyrics",
    iconUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748521248/225225da-abc3-447e-9ab9-35834c9c1fb0_ajpqdw.png",
    defaultBackgroundUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748522028/Image_fx_msn28n.png",
  },
  {
    value: "audiobook",
    label: "Audiobook Narration",
    iconUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748522012/a-audiobook-icon-for-a-mobile-app-thumb-removebg-preview_opcnkr.png",
    defaultBackgroundUrl: "https://res.cloudinary.com/ddz3nsnq1/image/upload/v1748522052/Image_fx_2_q6pp5y.png",
  },
];

export type VideoResolution = "1080p" | "720p" | "480p";
export const videoResolutions: { value: VideoResolution; label: string }[] = [
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "720p", label: "720p (HD)" },
  { value: "480p", label: "480p (SD)" },
];

export type VideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
export const videoAspectRatios: { value: VideoAspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 (Widescreen)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
];

export type VideoOutputFormat = "mp4" | "mov" | "webm";
export const videoOutputFormats: { value: VideoOutputFormat; label: string }[] = [
  { value: "mp4", label: "MP4" },
  { value: "mov", label: "MOV" },
  { value: "webm", label: "WEBM" },
];

export type TranscriptLine = {
  id: string;
  text: string;
  // Future: startTime?: number; endTime?: number;
};

export type BackgroundConfig = 
  | { type: 'url'; value: string }
  | { type: 'file'; value: File };

export type IconPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export const iconPositionOptions: Array<{ value: IconPosition; label: string }> = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'middle-left', label: 'Middle Left' },
  { value: 'center', label: 'Center' },
  { value: 'middle-right', label: 'Middle Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export interface TranscriptStyleConfig {
  textColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontSizeRatio: number; // Represents a relative factor used for dynamic calculation
  hasBackground: boolean;
  backgroundColor: string;
  hasTextOutline: boolean;
  textOutlineColor: string;
  textOutlineWidth: number; // in pixels
  hasTextShadow: boolean;
  textShadowColor: string;
  textShadowOffsetX: number; // in pixels
  textShadowOffsetY: number; // in pixels
  textShadowBlur: number; // in pixels
}

export const defaultTranscriptStyleConfig: TranscriptStyleConfig = {
  textColor: '#FFFFFF',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSizeRatio: 15, // Example: 15 could mean 1.5% of container height, adjust as needed
  hasBackground: false,
  backgroundColor: 'rgba(0,0,0,0.5)',
  hasTextOutline: true,
  textOutlineColor: '#000000',
  textOutlineWidth: 1,
  hasTextShadow: false,
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffsetX: 2,
  textShadowOffsetY: 2,
  textShadowBlur: 3,
};

export const fontFamilies: string[] = [
  'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 
  'Times New Roman', 'Georgia', 'Garamond', 
  'Courier New', 'Brush Script MT', 'Impact', 'Comic Sans MS'
];
