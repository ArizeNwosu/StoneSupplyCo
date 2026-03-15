import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, MicOff, PhoneOff, Volume2, X } from 'lucide-react';
import { Button, Card, cn } from './ui';
import type { PracticeFeedback, PracticeScenario, PracticeSessionSummary, PracticeTurn } from '../types';
import { generateTTS } from '../services/gemini';
import { endPracticeSession, processPracticeResponse } from '../services/practiceConversationApi';
import { buildPracticeFeedback } from '../services/practiceSimulator';
import {
  addVoiceSimulatorListeners,
  deactivateVoiceSimulatorAudioSession,
  isNativePlatform,
  isVoiceSimulatorNativeAvailable,
  prepareVoiceSimulatorAudioSession,
  speakNativeText,
  startNativeSpeechRecognition,
  stopNativeSpeech,
  stopNativeSpeechRecognition,
} from '../services/native';
import ringAudio from '../../ring.mp3';

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

type CallSimulatorProps = {
  isOpen: boolean;
  isDark: boolean;
  scenario: PracticeScenario | null;
  onSessionComplete: (session: PracticeSessionSummary) => void;
  onClose: () => void;
};

type SimulatorStage = 'prep' | 'connecting' | 'call' | 'feedback';

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function useBrowserSpeechRecognition(options: {
  onPartial: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onListeningChange: (listening: boolean) => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const finalizeTimerRef = useRef<number | null>(null);
  const handledFinalRef = useRef(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const stop = () => {
    if (finalizeTimerRef.current) {
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    options.onListeningChange(false);
  };

  const listen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    transcriptRef.current = '';
    handledFinalRef.current = false;

    const finalizeTranscript = () => {
      if (handledFinalRef.current) return;
      const finalTranscript = transcriptRef.current.trim();
      if (!finalTranscript) return;
      handledFinalRef.current = true;
      options.onFinal(finalTranscript);
      recognition.stop();
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        transcriptRef.current = transcript;
        options.onPartial(transcript);
      }

      const last = event.results[event.results.length - 1];
      if (finalizeTimerRef.current) {
        window.clearTimeout(finalizeTimerRef.current);
      }

      if (last?.isFinal && transcript) {
        finalizeTranscript();
        return;
      }

      finalizeTimerRef.current = window.setTimeout(() => {
        finalizeTranscript();
      }, 1200);
    };

    recognition.onend = () => {
      if (finalizeTimerRef.current) {
        window.clearTimeout(finalizeTimerRef.current);
        finalizeTimerRef.current = null;
      }
      options.onListeningChange(false);
    };

    recognition.onerror = () => {
      if (finalizeTimerRef.current) {
        window.clearTimeout(finalizeTimerRef.current);
        finalizeTimerRef.current = null;
      }
      options.onListeningChange(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    options.onListeningChange(true);
    return true;
  };

  useEffect(() => stop, []);

  return { supported, listen, stop };
}

function formatMicStatus(message?: string) {
  const raw = String(message || '').trim().toLowerCase();
  if (!raw) {
    return 'Mic permission is required. Enable Microphone and Speech Recognition for Callmate in iPhone Settings.';
  }

  if (
    raw.includes('permission') ||
    raw.includes('denied') ||
    raw.includes('not allowed') ||
    raw.includes('restricted') ||
    raw.includes('authorized')
  ) {
    return 'Mic permission is required. Enable Microphone and Speech Recognition for Callmate in iPhone Settings.';
  }

  if (raw.includes('unavailable') || raw.includes('not available')) {
    return 'Mic is unavailable right now. Check Microphone and Speech Recognition access, then try again.';
  }

  return message;
}

function speak(text: string, muted: boolean) {
  if (muted || typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve();
  window.speechSynthesis.cancel();
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 0.92;
    utterance.lang = 'en-US';
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

function cleanupRemoteAudio(
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  urlRef: React.MutableRefObject<string | null>,
) {
  audioRef.current?.pause();
  audioRef.current = null;
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 600): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export function CallSimulator({ isOpen, isDark, scenario, onSessionComplete, onClose }: CallSimulatorProps) {
  const [stage, setStage] = useState<SimulatorStage>('prep');
  const [callStatus, setCallStatus] = useState('Ready to practice');
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepAttempt, setStepAttempt] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [turns, setTurns] = useState<PracticeTurn[]>([]);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [activePromptAt, setActivePromptAt] = useState<number | null>(null);
  const [elapsedTick, setElapsedTick] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [autoListenFailed, setAutoListenFailed] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const timerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const connectTimersRef = useRef<number[]>([]);
  const submitResponseRef = useRef<(text: string, usedSuggestion: boolean) => void>(() => {});
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioUrlRef = useRef<string | null>(null);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsDoneResolverRef = useRef<(() => void) | null>(null);
  const aiTurnTimerRef = useRef<number | null>(null);
  const aiPlaybackTokenRef = useRef(0);
  const { supported, listen, stop } = useBrowserSpeechRecognition({
    onPartial: (transcript) => setInputValue(transcript),
    onFinal: (transcript) => submitResponseRef.current(transcript, false),
    onListeningChange: setIsListening,
  });

  const elapsed = useMemo(() => {
    if (!callStartedAt) return 0;
    return Date.now() - callStartedAt;
  }, [callStartedAt, elapsedTick]);

  useEffect(() => {
    if (!isOpen || !scenario) return;
    setStage('prep');
    setCallStatus('Ready to practice');
    setCallStartedAt(null);
    setStepIndex(0);
    setStepAttempt(0);
    setInputValue('');
    setActiveSuggestions([]);
    setTurns([]);
    setFeedback(null);
    setActivePromptAt(null);
    setIsMuted(false);
    setElapsedTick(0);
    setIsListening(false);
    setAutoListenFailed(false);
    setIsAiSpeaking(false);
    connectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    connectTimersRef.current = [];
    if (aiTurnTimerRef.current) {
      window.clearTimeout(aiTurnTimerRef.current);
      aiTurnTimerRef.current = null;
    }
    stop();
    cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
    ringAudioRef.current?.pause();
    ringAudioRef.current = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (isVoiceSimulatorNativeAvailable) {
      void prepareVoiceSimulatorAudioSession();
    }
  }, [isOpen, scenario]);

  useEffect(() => {
    if (!isOpen || stage !== 'call') return;
    timerRef.current = window.setInterval(() => {
      setElapsedTick(Date.now());
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isOpen, stage]);

  useEffect(() => {
    if (!isOpen) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    window.requestAnimationFrame(() => {
      container.scrollTo({ top: 0, behavior: 'auto' });
      window.requestAnimationFrame(() => {
        container.scrollTo({ top: 0, behavior: 'auto' });
      });
    });
  }, [isOpen, stage]);

  useEffect(() => {
    return () => {
      stop();
      connectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      connectTimersRef.current = [];
      if (aiTurnTimerRef.current) {
        window.clearTimeout(aiTurnTimerRef.current);
        aiTurnTimerRef.current = null;
      }
      cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
      ringAudioRef.current?.pause();
      ringAudioRef.current = null;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (isVoiceSimulatorNativeAvailable) {
        void deactivateVoiceSimulatorAudioSession();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isVoiceSimulatorNativeAvailable) return;
    let cleanup = () => {};

    void (async () => {
      cleanup = await addVoiceSimulatorListeners({
        onSpeechPartial: ({ transcript }) => {
          setInputValue(transcript);
        },
        onSpeechFinal: ({ transcript }) => {
          setInputValue(transcript);
          setIsListening(false);
          submitResponseRef.current(transcript, false);
        },
        onSpeechState: ({ state, message }) => {
          if (state === 'listening') {
            setIsListening(true);
            setAutoListenFailed(false);
            setCallStatus('Listening...');
            return;
          }

          if (state === 'stopped') {
            setIsListening(false);
            return;
          }

          setIsListening(false);
          if (message) {
            setAutoListenFailed(true);
            setCallStatus(formatMicStatus(message));
          }
        },
        onTtsState: ({ state }) => {
          if (state === 'started') {
            setIsAiSpeaking(true);
          }
          if (state === 'finished' || state === 'cancelled') {
            setIsAiSpeaking(false);
            ttsDoneResolverRef.current?.();
            ttsDoneResolverRef.current = null;
          }
        },
      });
    })();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  if (!isOpen || !scenario) return null;

  const currentSuggestions = activeSuggestions;

  const cancelQueuedAiTurn = () => {
    aiPlaybackTokenRef.current += 1;
    if (aiTurnTimerRef.current) {
      window.clearTimeout(aiTurnTimerRef.current);
      aiTurnTimerRef.current = null;
    }
    setIsAiSpeaking(false);
  };

  const stopRingAudio = () => {
    ringAudioRef.current?.pause();
    if (ringAudioRef.current) {
      ringAudioRef.current.currentTime = 0;
    }
    ringAudioRef.current = null;
  };

  const playRingAudio = () => {
    stopRingAudio();
    const audio = new Audio(ringAudio);
    audio.preload = 'auto';
    audio.loop = true;
    audio.setAttribute('playsinline', 'true');
    ringAudioRef.current = audio;
    void audio.play().catch((error) => {
      console.error('Failed to play ringing audio', error);
      stopRingAudio();
    });
  };

  const startListening = async () => {
    setInputValue('');
    setCallStatus('Listening...');
    setAutoListenFailed(false);

    if (isVoiceSimulatorNativeAvailable) {
      try {
        await startNativeSpeechRecognition();
      } catch (error) {
        console.error('Failed to start native speech recognition', error);
        setAutoListenFailed(true);
        setCallStatus(formatMicStatus(error instanceof Error ? error.message : undefined));
      }
      return;
    }

    const started = listen();
    if (!started) {
      setAutoListenFailed(true);
      setCallStatus(formatMicStatus('Mic unavailable'));
    }
  };

  const stopActiveAudioAndRecognition = async () => {
    cancelQueuedAiTurn();
    stop();
    setIsListening(false);
    cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
    stopRingAudio();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (!isVoiceSimulatorNativeAvailable) return;

    await Promise.allSettled([
      withTimeout(stopNativeSpeechRecognition()),
      withTimeout(stopNativeSpeech()),
    ]);
  };

  const speakAi = async (text: string) => {
    if (isMuted) return;

    cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
    setIsAiSpeaking(true);
    setCallStatus('Speaking...');

    try {
      const audioUrl = await generateTTS(text, {
        voice: 'nova',
        instructions: 'Speak like a real person on a phone call. Keep it warm, concise, and natural.',
      });
      remoteAudioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      remoteAudioRef.current = audio;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          setIsAiSpeaking(false);
          cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
          resolve();
        };
        audio.onerror = () => {
          setIsAiSpeaking(false);
          cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
          resolve();
        };
        void audio.play().catch(() => {
          setIsAiSpeaking(false);
          resolve();
        });
      });
      return;
    } catch (error) {
      setIsAiSpeaking(false);
      console.error('OpenAI TTS failed, falling back to device voice', error);
    }

    if (isVoiceSimulatorNativeAvailable) {
      await new Promise<void>(async (resolve) => {
        ttsDoneResolverRef.current = resolve;
        try {
          await speakNativeText(text, { rate: 0.45, pitch: 0.96 });
        } catch {
          setIsAiSpeaking(false);
          ttsDoneResolverRef.current = null;
          resolve();
        }
      });
      return;
    }
    await speak(text, isMuted);
    setIsAiSpeaking(false);
  };

  const queueAiTurn = (
    text: string,
    nextStepIndex: number,
    nextSuggestions: string[],
    callComplete: boolean,
    baseTurns: PracticeTurn[],
    responseDelayMs: number
  ) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setCallStatus('Connection issue. Try again.');
      return;
    }
    const delay = responseDelayMs;
    setCallStatus('Thinking...');

    const playbackToken = aiPlaybackTokenRef.current;
    aiTurnTimerRef.current = window.setTimeout(async () => {
      aiTurnTimerRef.current = null;
      if (playbackToken !== aiPlaybackTokenRef.current) return;

      const aiTurn: PracticeTurn = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: normalizedText,
        stepId: 'live_call',
        timestamp: Date.now(),
      };
      setTurns(prev => [
        ...prev,
        aiTurn,
      ]);
      setCallStatus('Speaking...');
      await speakAi(normalizedText);
      if (playbackToken !== aiPlaybackTokenRef.current) return;
      setCallStatus(callComplete ? 'Call complete' : 'Ready for your response');
      setActivePromptAt(callComplete ? null : Date.now());
      setActiveSuggestions(callComplete ? [] : nextSuggestions);
      if (callComplete) {
        const completedTurns = [...baseTurns, aiTurn];
        let nextFeedback: PracticeFeedback;
        try {
          nextFeedback = await endPracticeSession({ turns: completedTurns, completed: true });
        } catch (error) {
          console.error('Failed to load remote feedback, using local feedback', error);
          nextFeedback = buildPracticeFeedback(completedTurns, true);
        }
        setFeedback(nextFeedback);
        onSessionComplete({
          id: crypto.randomUUID(),
          scenarioId: scenario.scenarioId,
          confidenceScore: nextFeedback.confidenceScore,
          completed: true,
          timestamp: Date.now(),
        });
        window.setTimeout(() => setStage('feedback'), 900);
      } else {
        await startListening();
      }
    }, delay);
  };

  const startCall = async () => {
    connectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    connectTimersRef.current = [];
    setStage('connecting');
    setCallStatus('Dialing...');

    if (isVoiceSimulatorNativeAvailable) {
      void prepareVoiceSimulatorAudioSession().catch((error) => {
        console.error('Failed to prepare native audio session', error);
      });
    }

    const ringTimer = window.setTimeout(() => {
      setCallStatus('Ringing...');
      playRingAudio();
    }, 900);
    const answerTimer = window.setTimeout(async () => {
      stopRingAudio();
      setStage('call');
      setCallStartedAt(Date.now());

      if (scenario.perspective === 'incoming') {
        setCallStatus('Listening...');
        setActiveSuggestions(['Hello?', 'Hi, this is me.', 'Hello, who is this?']);
        setTurns([]);
        setActivePromptAt(Date.now());
        await startListening();
        return;
      }

      setCallStatus('Speaking...');
      setActiveSuggestions(scenario.steps[0]?.suggestions ?? []);
      setTurns([
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: scenario.introLine,
          stepId: 'intro',
          timestamp: Date.now(),
        },
      ]);
      await speakAi(scenario.introLine);
      setActivePromptAt(Date.now());
      await startListening();
    }, 6900);

    connectTimersRef.current = [ringTimer, answerTimer];
  };

  const endCall = async (completed: boolean) => {
    connectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    connectTimersRef.current = [];

    void stopActiveAudioAndRecognition();
    stopRingAudio();
    setCallStatus(completed ? 'Call complete' : 'Call ended');
    const localFeedback = buildPracticeFeedback(turns, completed);
    setFeedback(localFeedback);
    setStage('feedback');

    try {
      const nextFeedback = await endPracticeSession({ turns, completed });
      setFeedback(nextFeedback);
      onSessionComplete({
        id: crypto.randomUUID(),
        scenarioId: scenario.scenarioId,
        confidenceScore: nextFeedback.confidenceScore,
        completed,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to load remote feedback, using local feedback', error);
      onSessionComplete({
        id: crypto.randomUUID(),
        scenarioId: scenario.scenarioId,
        confidenceScore: localFeedback.confidenceScore,
        completed,
        timestamp: Date.now(),
      });
    }
  };

  const submitResponse = async (text: string, usedSuggestion: boolean) => {
    const transcript = text.trim();
    if (!transcript) return;

    const responseMs = activePromptAt ? Date.now() - activePromptAt : undefined;
    const userTurn: PracticeTurn = {
      id: crypto.randomUUID(),
      role: 'user',
      text: transcript,
      stepId: 'live_call',
      timestamp: Date.now(),
      responseMs,
      usedSuggestion,
    };

    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setInputValue('');
    setCallStatus('Thinking...');

    void stopActiveAudioAndRecognition();

    try {
      const result = await processPracticeResponse({
        scenario,
        currentStepIndex: stepIndex,
        attemptCount: stepAttempt,
        userTranscript: transcript,
        conversationHistory: nextTurns,
      });
      if (result.progressed) {
        setStepIndex(result.nextStepIndex);
        setStepAttempt(0);
      } else {
        setStepAttempt(stepAttempt + 1);
      }
      setActiveSuggestions(result.suggestions);
      if (!result.aiText.trim()) {
        setCallStatus('Connection issue. Try again.');
        return;
      }

      queueAiTurn(
        result.aiText,
        result.nextStepIndex,
        result.suggestions,
        result.callComplete,
        nextTurns,
        result.responseDelayMs
      );
    } catch (error) {
      console.error('Failed to process simulator response', error);
      setCallStatus('Connection issue. Try again.');
    }
  };

  submitResponseRef.current = submitResponse;

  const voiceSupported = isVoiceSimulatorNativeAvailable || supported;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-xl"
      >
        <div
          ref={scrollContainerRef}
          className={cn(
          'fixed inset-0 overflow-y-auto',
          isDark ? 'bg-[#161d1b] text-[#f6f2ea]' : 'bg-[rgba(255,251,245,0.99)] text-[#22312b]'
        )}>
          <header className={cn(
            'sticky top-0 z-10 border-b px-6 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] flex items-center justify-between transition-colors',
            isDark ? 'bg-[#161d1b]/95 border-[#33403b]' : 'bg-[rgba(243,238,228,0.92)] border-[#d8cdc0]'
          )}>
            <div>
              <p className={cn('text-2xl font-semibold tracking-tight', isDark ? 'text-[#f2ede3]' : 'text-[#22312b]')}>
                Simulate Call
              </p>
              <p className={cn('text-xs mt-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                {scenario.contactName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                stop();
                setIsListening(false);
                connectTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
                connectTimersRef.current = [];
                cleanupRemoteAudio(remoteAudioRef, remoteAudioUrlRef);
                stopRingAudio();
                if (isVoiceSimulatorNativeAvailable) {
                  void stopActiveAudioAndRecognition();
                  void deactivateVoiceSimulatorAudioSession();
                }
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className={cn(
                'p-2 rounded-xl transition-all',
                isDark ? 'bg-[#202926] text-[#97a59f] hover:bg-[#293330]' : 'bg-[#ece5da] text-[#66756f] hover:bg-[#e3dacd]'
              )}
              aria-label="Close simulator"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="max-w-2xl mx-auto min-h-[calc(100dvh-5.5rem)] px-6 py-6 pb-10 flex flex-col">
            {stage === 'prep' && (
              <div className="space-y-5">
                <Card isDark={isDark} className="p-6 space-y-4">
                  <div>
                    <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                      Scenario
                    </p>
                    <h3 className="text-2xl font-semibold tracking-tight">{scenario.title}</h3>
                  </div>
                  <div className={cn('grid grid-cols-2 gap-3 text-sm', isDark ? 'text-[#c5d0ca]' : 'text-[#51615b]')}>
                    <div className={cn('rounded-2xl border p-4', isDark ? 'border-[#415049] bg-[#1d2623]' : 'border-[#d8cdc0] bg-[#f5efe6]')}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1">Estimated</p>
                      <p>{scenario.estimatedDuration}</p>
                    </div>
                    <div className={cn('rounded-2xl border p-4', isDark ? 'border-[#415049] bg-[#1d2623]' : 'border-[#d8cdc0] bg-[#f5efe6]')}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1">Contact</p>
                      <p>{scenario.contactName}</p>
                    </div>
                  </div>
                </Card>

                <Card isDark={isDark} className="p-6">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-2', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                    Call Reason
                  </p>
                  <p className="text-xl leading-relaxed font-medium">{scenario.reasonSummary}</p>
                </Card>

                <Card isDark={isDark} className="p-6">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                    Call Flow
                  </p>
                  <div className="space-y-2">
                    {scenario.possibleQuestions.map(question => (
                      <div key={question} className="flex items-start gap-2">
                        <span className="mt-1 text-sm">•</span>
                        <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#d8e0db]' : 'text-[#51615b]')}>{question}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Button size="xl" variant="primary" isDark={isDark} className="w-full" onClick={startCall}>
                  Start Practice Call
                </Button>
              </div>
            )}

            {stage === 'connecting' && (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="flex flex-col items-center justify-center -translate-y-6">
                  <div className={cn('w-32 h-32 rounded-full border flex items-center justify-center mb-6', isDark ? 'border-[#415049] bg-[#202926]' : 'border-[#d8cdc0] bg-[#f5efe6]')}>
                    <Volume2 className={cn('w-10 h-10', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')} />
                  </div>
                  <p className="text-3xl font-semibold tracking-tight mb-2">{scenario.contactName}</p>
                  <p className={cn('text-sm', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>{callStatus}</p>
                </div>
              </div>
            )}

            {stage === 'call' && (
              <div className="flex-1 flex flex-col min-h-0">
                <Card isDark={isDark} className="p-5 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{scenario.contactName}</p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>{callStatus}</p>
                    </div>
                    <div className={cn('text-xl font-semibold tabular-nums', isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]')}>
                      {formatTime(elapsed)}
                    </div>
                  </div>
                </Card>

                <div className="flex-1 overflow-y-auto pb-4 space-y-3">
                  {turns.map(turn => (
                    <div key={turn.id} className={cn('flex', turn.role === 'ai' ? 'justify-start' : 'justify-end')}>
                      <div className={cn(
                        'max-w-[85%] rounded-[1.6rem] px-4 py-3 border',
                        turn.role === 'ai'
                          ? isDark
                            ? 'bg-[#202926] border-[#415049]'
                            : 'bg-[#f5efe6] border-[#d8cdc0]'
                          : isDark
                          ? 'bg-[#274136] border-[#527a6c]'
                          : 'bg-[#eef5f1] border-[#bfd2c8]'
                      )}>
                        <p className={cn('text-[10px] font-black uppercase tracking-[0.18em] mb-1', turn.role === 'ai' ? (isDark ? 'text-[#97a59f]' : 'text-[#66756f]') : (isDark ? 'text-[#b9d5c8]' : 'text-[#5d8a7a]'))}>
                          {turn.role === 'ai' ? 'AI' : 'You'}
                        </p>
                        <p className="text-sm leading-relaxed">{turn.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Card isDark={isDark} className="p-5 mb-4">
                    <div className="mb-3">
                      <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-1', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                        Suggested Replies
                      </p>
                      <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#d8e0db]' : 'text-[#51615b]')}>
                        Suggestions update from the latest thing the other person said.
                      </p>
                    </div>
                    {currentSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {currentSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => submitResponse(suggestion, true)}
                          className={cn(
                            'w-full min-h-[64px] rounded-2xl px-4 py-3 text-sm font-medium border transition-all text-left leading-snug break-words whitespace-normal shadow-sm',
                            isDark
                              ? 'border-[#527a6c] bg-[#23372f] text-[#e2efe8] hover:bg-[#274136]'
                              : 'border-[#bfd2c8] bg-[#eef5f1] text-[#365347] hover:bg-[#e6f0eb]'
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                      </div>
                    ) : (
                      <div className={cn(
                        'mb-4 rounded-2xl border px-4 py-3 text-sm',
                        isDark ? 'border-[#415049] bg-[#1d2623] text-[#97a59f]' : 'border-[#d8cdc0] bg-[#f5efe6] text-[#66756f]'
                      )}>
                        Suggestions will update from the other person&apos;s latest response.
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Type a response if you do not want to speak"
                        className={cn(
                          'flex-1 rounded-2xl border px-4 py-3 text-sm bg-transparent focus:outline-none',
                          isDark ? 'border-[#415049] text-[#f6f2ea] placeholder:text-[#798780]' : 'border-[#d8cdc0] text-[#22312b] placeholder:text-[#95a19c]'
                        )}
                      />
                      <Button variant="outline" size="sm" isDark={isDark} onClick={() => submitResponse(inputValue, false)}>
                        Send
                      </Button>
                    </div>
                    {!voiceSupported && (
                      <p className={cn('text-xs mt-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                        Voice input is not available in this browser, so suggestion chips and typed replies stay enabled.
                      </p>
                    )}
                    {voiceSupported && (
                      <p className={cn('text-xs mt-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                        {isListening
                          ? 'Listening now. Just answer naturally.'
                          : autoListenFailed
                          ? 'Auto-listen failed. Check mic permissions, retry the mic, or use a suggested reply.'
                          : 'The app starts listening automatically after the AI finishes speaking.'}
                      </p>
                    )}
                  </Card>

                <div className={cn('mt-auto grid gap-3', autoListenFailed ? 'grid-cols-3' : 'grid-cols-2')}>
                  <Button variant="outline" size="lg" isDark={isDark} onClick={() => setIsMuted(value => !value)}>
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? 'Muted' : 'Voice On'}
                  </Button>
                  {autoListenFailed && (
                    <Button
                      variant="outline"
                      size="lg"
                      isDark={isDark}
                      onClick={async () => {
                        if (isListening) {
                          stop();
                          if (isVoiceSimulatorNativeAvailable) {
                            await stopNativeSpeechRecognition();
                          }
                          setIsListening(false);
                          return;
                        }
                        await stopNativeSpeech();
                        await startListening();
                      }}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isListening ? 'Stop Mic' : 'Retry Mic'}
                    </Button>
                  )}
                  <Button variant="accent" size="lg" onClick={() => { void endCall(false); }}>
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </Button>
                </div>
              </div>
            )}

            {stage === 'feedback' && feedback && (
              <div className="space-y-5 pt-2">
                <Card isDark={isDark} className="p-6 text-center">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-2', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                    Practice Call Complete
                  </p>
                  <p className="text-5xl font-semibold tracking-tight mb-2">{feedback.confidenceScore}</p>
                  <p className={cn('text-sm', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>Confidence Score</p>
                </Card>

                <Card isDark={isDark} className="p-6">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                    You Did Well
                  </p>
                  <div className="space-y-2">
                    {feedback.strengths.map(item => (
                      <p key={item} className="text-sm leading-relaxed">• {item}</p>
                    ))}
                  </div>
                </Card>

                <Card isDark={isDark} className="p-6">
                  <p className={cn('text-[10px] font-black uppercase tracking-[0.22em] mb-3', isDark ? 'text-[#97a59f]' : 'text-[#66756f]')}>
                    Next Time Try
                  </p>
                  <div className="space-y-2">
                    {feedback.suggestions.map(item => (
                      <p key={item} className="text-sm leading-relaxed">• {item}</p>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button size="lg" variant="outline" isDark={isDark} onClick={() => {
                    setStage('prep');
                    setTurns([]);
                    setFeedback(null);
                    setStepIndex(0);
                    setStepAttempt(0);
                    setInputValue('');
                    setActiveSuggestions([]);
                  }}>
                    Practice Again
                  </Button>
                  <Button size="lg" variant="primary" isDark={isDark} onClick={onClose}>
                    Back to Script
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
