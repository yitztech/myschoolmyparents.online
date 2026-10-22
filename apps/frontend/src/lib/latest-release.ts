import { useEffect, useState } from 'react';
import { MOBILE_VERSION } from '../legal/site';

export interface ReleaseAssetInfo {
  file: string;
  url: string;
  size: number;
  sha256: string;
}

export interface ReleaseInfo {
  version: string;
  build: number;
  tag: string;
  publishedAt: string;
  androidUrl: string;
  iosUrl: string;
  androidSha256?: string;
  iosSha256?: string;
}

const CACHE_KEY = 'msm_latest_release';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

const FALLBACK_RELEASE: ReleaseInfo = {
  version: MOBILE_VERSION?.version ?? '0.4.0',
  build: Number(MOBILE_VERSION?.build ?? 6),
  tag: `v${MOBILE_VERSION?.version ?? '0.4.0'}`,
  publishedAt: new Date().toISOString(),
  androidUrl: '/descargas/android',
  iosUrl: '/descargas/ios',
};

export function useLatestRelease(): ReleaseInfo {
  const [release, setRelease] = useState<ReleaseInfo>(() => {
    if (typeof window === 'undefined') return FALLBACK_RELEASE;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          return parsed.data;
        }
      }
    } catch {}
    return FALLBACK_RELEASE;
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchRelease() {
      try {
        // Consulta el endpoint del mismo origen (/api/releases/latest) para mantener connect-src 'self' intacto
        const res = await fetch('/api/releases/latest', {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<ReleaseInfo>;
        if (cancelled || !data || !data.version) return;

        const latestInfo: ReleaseInfo = {
          version: data.version,
          build: typeof data.build === 'number' ? data.build : FALLBACK_RELEASE.build,
          tag: data.tag || `v${data.version}`,
          publishedAt: data.publishedAt || new Date().toISOString(),
          androidUrl: data.androidUrl || '/descargas/android',
          iosUrl: data.iosUrl || '/descargas/ios',
          ...(data.androidSha256 ? { androidSha256: data.androidSha256 } : {}),
          ...(data.iosSha256 ? { iosSha256: data.iosSha256 } : {}),
        };

        if (!cancelled) {
          setRelease(latestInfo);
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: latestInfo })
            );
          } catch {}
        }
      } catch {
        // Conserva el fallback seguro
      }
    }

    void fetchRelease();
    return () => {
      cancelled = true;
    };
  }, []);

  return release;
}
