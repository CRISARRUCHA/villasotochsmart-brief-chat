import { useState, useRef, useCallback } from "react";

interface UseDictationOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
  onProcessed?: (cleaned: string) => void;
  onEnd?: () => void;
}

export function useDictation({ lang = "es-MX", onResult, onProcessed, onEnd }: UseDictationOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const rawTranscriptRef = useRef("");

  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const cleanTranscription = async (raw: string) => {
    if (!raw.trim()) return;
    setIsProcessing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/clean-transcription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      const data = await res.json();
      onProcessed?.(data.cleaned || raw);
    } catch {
      onProcessed?.(raw);
    } finally {
      setIsProcessing(false);
    }
  };

  const start = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    rawTranscriptRef.current = "";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      rawTranscriptRef.current = finalTranscript;
      // Show raw text while recording
      onResult?.(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      const raw = rawTranscriptRef.current;
      if (raw.trim()) {
        cleanTranscription(raw);
      }
      onEnd?.();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, lang, onResult, onEnd, onProcessed]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isListening, isProcessing, isSupported, start, stop, toggle };
}
