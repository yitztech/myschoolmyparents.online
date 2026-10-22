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
        // Consultamos el manifest del último release si está disponible
        const res = await fetch(
          'https://api.github.com/repos/yitztech/myschoolmyparents.online/releases/latest',
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data || !data.tag_name) return;

        const tag = data.tag_name as string;
        const version = tag.replace(/^v/, '');
        const androidAsset = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
        const iosAsset = data.assets?.find((a: any) => a.name?.endsWith('.ipa'));

        const latestInfo: ReleaseInfo = {
          version,
          build: FALLBACK_RELEASE.build,
          tag,
          publishedAt: data.published_at || new Date().toISOString(),
          androidUrl: androidAsset?.browser_download_url || '/descargas/android',
          iosUrl: iosAsset?.browser_download_url || '/descargas/ios',
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

    fetchRelease();
    return () => {
      cancelled = true;
    };
  }, []);

  return release;
}
