'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, PauseCircle, Download } from 'lucide-react';

interface AudioPlayerProps {
  title: string;
  audioSrc: string | null;
  fileName?: string; // For download
}

export function AudioPlayer({ title, audioSrc, fileName = "processed_audio.wav" }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      }
      const setAudioTime = () => setCurrentTime(audio.currentTime);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));


      // Reset player if src changes
      if (audioSrc) {
         // if audioSrc changes and is not null, try to play
        if(isPlaying) audio.play().catch(e => console.error("Error auto-playing new src:", e));
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }


      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('play', () => setIsPlaying(true));
        audio.removeEventListener('pause', () => setIsPlaying(false));
        audio.removeEventListener('ended', () => setIsPlaying(false));
      }
    }
  }, [audioSrc, isPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
        audioRef.current.currentTime = Number(event.target.value);
        setCurrentTime(Number(event.target.value));
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {audioSrc ? (
          <>
            <audio ref={audioRef} src={audioSrc} className="w-full hidden" preload="metadata" />
            <div className="flex items-center gap-3">
              <button onClick={togglePlayPause} className="text-primary hover:text-accent transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseCircle size={32} /> : <PlayCircle size={32} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={currentTime} 
                onChange={handleSeek}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Seek"
              />
              <span className="text-sm text-muted-foreground w-20 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
               <a
                href={audioSrc}
                download={fileName}
                className="text-primary hover:text-accent transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Download processed audio"
              >
                <Download size={20} />
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No audio loaded.</p>
        )}
      </CardContent>
    </Card>
  );
}
