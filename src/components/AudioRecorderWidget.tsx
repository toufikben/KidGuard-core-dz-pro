import React, { useEffect, useRef, useState } from 'react';
import { Mic, Play, Square, ShieldAlert } from 'lucide-react';
import { AppLanguageCode } from '../types';

interface AudioRecordingSnippet {
  id: string;
  timestampMs: number;
  timeLabel: string;
  durationSeconds: number;
  triggerReason: string;
  /** Object URL for the captured audio blob - only present when the browser granted mic access. */
  audioUrl?: string;
}

interface AudioRecorderWidgetProps {
  isAutoTriggered: boolean;
  currentLang: AppLanguageCode;
  onAudioClipRecorded?: (clip: AudioRecordingSnippet) => void;
}

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioRecorderWidget: React.FC<AudioRecorderWidgetProps> = ({
  isAutoTriggered,
  currentLang,
  onAudioClipRecorded,
}) => {
  const isAr = currentLang === 'ar';
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingsList, setRecordingsList] = useState<AudioRecordingSnippet[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Tracks whether the *current* recording was started automatically by the
  // risk engine (vs a parent manually pressing "Start Mic"), so auto-stop
  // only ever stops a recording it auto-started - a parent's manual
  // recording is never cut short by the risk score changing.
  const wasAutoStartedRef = useRef(false);

  const stopAndReleaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async (triggerReason: string, isAuto: boolean) => {
    setMicError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError(
        isAr ? 'الميكروفون غير مدعوم في هذا المتصفح/الجهاز.' : 'Microphone capture is not supported on this browser/device.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const newSnippet: AudioRecordingSnippet = {
          id: `rec_${Date.now()}`,
          timestampMs: Date.now(),
          timeLabel: timeStr,
          durationSeconds: elapsedSeconds,
          triggerReason,
          audioUrl,
        };

        setRecordingsList((prev) => [newSnippet, ...prev]);
        if (onAudioClipRecorded) onAudioClipRecorded(newSnippet);

        stopAndReleaseStream();
      };

      mediaRecorderRef.current = recorder;
      wasAutoStartedRef.current = isAuto;
      startedAtRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      setMicError(
        isAr
          ? 'تم رفض إذن الميكروفون. لا يمكن بدء التسجيل الصوتي.'
          : 'Microphone permission was denied or unavailable - could not start recording.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Sync with the risk engine: start recording the moment high risk is
  // triggered, and - only for a recording that *this* effect started - stop
  // it again once risk drops back down. A manually-started recording (parent
  // pressed "Start Mic") is never auto-stopped by this effect.
  const prevAutoTriggeredRef = useRef(false);
  useEffect(() => {
    const wasTriggered = prevAutoTriggeredRef.current;
    prevAutoTriggeredRef.current = isAutoTriggered;

    if (isAutoTriggered && !isRecording) {
      void startRecording(
        isAr ? 'طوارئ الخطر العالي (تلقائي)' : 'High Risk Level Emergency (Auto Triggered)',
        true
      );
    } else if (wasTriggered && !isAutoTriggered && isRecording && wasAutoStartedRef.current) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoTriggered]);

  // Release the mic stream if the widget unmounts mid-recording.
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
      stopAndReleaseStream();
    };
  }, []);

  // Recording timer tick (display only - real duration is computed from wall-clock time on stop)
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    stopRecording();
  };

  const handleStartManualRecording = () => {
    void startRecording(isAr ? 'تسجيل يدوي من الوالد' : 'Manual Parent Monitor Command', false);
  };

  const handleTogglePlay = (snippet: AudioRecordingSnippet) => {
    if (!snippet.audioUrl) return;

    if (playingClipId === snippet.id) {
      audioElRef.current?.pause();
      setPlayingClipId(null);
      return;
    }

    audioElRef.current?.pause();
    const audio = new Audio(snippet.audioUrl);
    audioElRef.current = audio;
    audio.onended = () => setPlayingClipId(null);
    audio.play().catch(() => setPlayingClipId(null));
    setPlayingClipId(snippet.id);
  };

  return (
    <div className={`rounded-3xl p-4 border shadow-xl transition-all ${
      isRecording
        ? 'bg-purple-950/40 border-purple-600/80 text-purple-100 shadow-purple-900/30'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-2xl border ${
            isRecording
              ? 'bg-purple-600/30 border-purple-500 text-purple-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isAr ? 'تسجيل الصوت البيئي المحيط' : 'Ambient Audio Recording Monitor'}</span>
              {isRecording && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white animate-pulse">
                  REC
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'يسجل الميكروفون الحقيقي للجهاز تلقائياً عند حالات الخطر المرتفع المكتشفة، ويتوقف تلقائياً عند انخفاض الخطر'
                : "Uses this device's real microphone, auto-started at high risk levels and auto-stopped once risk clears."}
            </p>
          </div>
        </div>

        <div>
          {isRecording ? (
            <button
              onClick={handleStopRecording}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{isAr ? 'إيقاف التسجيل' : 'Stop Rec'}</span>
            </button>
          ) : (
            <button
              onClick={handleStartManualRecording}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الآن' : 'Start Mic'}</span>
            </button>
          )}
        </div>
      </div>

      {micError && (
        <div className="mt-3 p-2.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Active Recording Monitor Display */}
      {isRecording && (
        <div className="mt-3 p-3 bg-purple-950/60 border border-purple-800/60 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div className="text-xs font-mono font-bold text-purple-200">
              {isAr ? 'جاري تسجيل الصوت البيئي...' : 'Recording Live Ambient Audio...'}
            </div>
          </div>

          <div className="text-base font-mono font-black text-white bg-purple-900/80 px-3 py-1 rounded-xl border border-purple-700">
            {formatDuration(recordingSeconds)}
          </div>
        </div>
      )}

      {/* Recorded Audio Clips List */}
      <div className="mt-3 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isAr ? 'المقاطع الصوتية المسجلة للتأكد:' : 'Recorded Emergency Audio Snippets:'}
        </div>

        {recordingsList.length === 0 ? (
          <div className="p-3 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-900">
            {isAr ? 'لا توجد تسجيلات صوتية محفوظة بعد' : 'No ambient audio recordings saved yet.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recordingsList.map((snippet) => {
              const isPlaying = playingClipId === snippet.id;
              return (
                <div
                  key={snippet.id}
                  className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleTogglePlay(snippet)}
                      disabled={!snippet.audioUrl}
                      className={`p-2 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        isPlaying
                          ? 'bg-purple-600 text-white border-purple-500 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>

                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{snippet.timeLabel}</span>
                        <span className="text-[10px] text-purple-400 font-mono font-normal">
                          ({formatDuration(snippet.durationSeconds)})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{snippet.triggerReason}</div>
                    </div>
                  </div>

                  {/* Waveform graphic bar */}
                  <div className="flex items-center gap-0.5 text-purple-400/80 px-2">
                    <span className={`w-0.5 h-3 bg-purple-500 ${isPlaying ? 'animate-bounce' : ''}`} />
                    <span className={`w-0.5 h-5 bg-purple-400 ${isPlaying ? 'animate-bounce delay-75' : ''}`} />
                    <span className={`w-0.5 h-2 bg-purple-500 ${isPlaying ? 'animate-bounce delay-150' : ''}`} />
                    <span className={`w-0.5 h-6 bg-purple-300 ${isPlaying ? 'animate-bounce delay-100' : ''}`} />
                    <span className={`w-0.5 h-3 bg-purple-500 ${isPlaying ? 'animate-bounce delay-200' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
