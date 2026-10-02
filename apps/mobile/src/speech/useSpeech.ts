import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ExpoTtsEngine } from './expoTtsEngine';
import { SpeechController, type SpeechSnapshot } from './speechController';

/** Un `SpeechController` por pantalla de lectura, con su estado reactivo. */
export function useSpeech(): { speech: SpeechController; snap: SpeechSnapshot } {
  const ref = useRef<SpeechController | null>(null);
  if (!ref.current) ref.current = new SpeechController(new ExpoTtsEngine());
  const speech = ref.current;
  const snap = useSyncExternalStore(speech.subscribe, speech.getSnapshot, speech.getSnapshot);
  useEffect(() => () => speech.dispose(), [speech]);
  return { speech, snap };
}
