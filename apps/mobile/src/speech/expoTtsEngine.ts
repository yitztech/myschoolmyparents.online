import * as Speech from 'expo-speech';
import type { SpeakOptions, TtsEngine } from './speechController';

/** La app usa una escala donde 0.5 es la velocidad normal; expo-speech usa 1.0. */
export const toExpoRate = (rate: number) => Math.min(Math.max(rate * 2, 0.1), 2);

export class ExpoTtsEngine implements TtsEngine {
  async getVoices() {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.map((v) => ({ identifier: v.identifier, name: v.name, language: v.language }));
  }

  speak(text: string, o: SpeakOptions): Promise<'done' | 'stopped'> {
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        voice: o.voice?.identifier,
        language: o.voice?.locale,
        rate: toExpoRate(o.rate),
        onBoundary: (ev: any) => {
          if (typeof ev?.charIndex === 'number') o.onBoundary?.(ev.charIndex, ev.charIndex + (ev.charLength ?? 0));
        },
        onDone: () => resolve('done'),
        onStopped: () => resolve('stopped'),
        onError: (e) => reject(e),
      });
    });
  }

  stop() {
    return Speech.stop();
  }
}
