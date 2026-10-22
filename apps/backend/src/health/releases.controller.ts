import { Controller, Get } from '@nestjs/common';

export interface LatestReleasePayload {
  version: string;
  build: number;
  tag: string;
  publishedAt: string;
  androidUrl: string;
  iosUrl: string;
  androidSha256?: string;
  iosSha256?: string;
}

const FALLBACK_RELEASE: LatestReleasePayload = {
  version: '0.4.0',
  build: 6,
  tag: 'v0.4.0',
  publishedAt: new Date(0).toISOString(),
  androidUrl: '/descargas/android',
  iosUrl: '/descargas/ios',
};

const CACHE_TTL_MS = 10 * 60 * 1000;

@Controller('releases')
export class ReleasesController {
  private cached: { timestamp: number; data: LatestReleasePayload } | null = null;

  @Get('latest')
  async getLatest(): Promise<LatestReleasePayload> {
    const now = Date.now();
    if (this.cached && now - this.cached.timestamp < CACHE_TTL_MS) {
      return this.cached.data;
    }

    try {
      const res = await fetch(
        'https://api.github.com/repos/yitztech/myschoolmyparents.online/releases/latest',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'MySchoolMyParents-Backend/1.0',
          },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          tag_name?: string;
          published_at?: string;
          assets?: Array<{ name?: string; browser_download_url?: string }>;
        };
        if (data?.tag_name) {
          const tag = data.tag_name;
          const version = tag.replace(/^v/, '');
          const androidAsset = data.assets?.find((a) => a.name?.endsWith('.apk'));
          const iosAsset = data.assets?.find((a) => a.name?.endsWith('.ipa'));
          const manifestAsset = data.assets?.find((a) => a.name === 'release-manifest.json');

          let build = FALLBACK_RELEASE.build;
          let androidSha256: string | undefined;
          let iosSha256: string | undefined;

          if (manifestAsset?.browser_download_url) {
            try {
              const mRes = await fetch(manifestAsset.browser_download_url, {
                signal: AbortSignal.timeout(4000),
              });
              if (mRes.ok) {
                const manifest = (await mRes.json()) as {
                  build?: number;
                  android?: { sha256?: string };
                  ios?: { sha256?: string };
                };
                if (typeof manifest.build === 'number') build = manifest.build;
                androidSha256 = manifest.android?.sha256;
                iosSha256 = manifest.ios?.sha256;
              }
            } catch {
              // ignore manifest fetch error
            }
          }

          const payload: LatestReleasePayload = {
            version,
            build,
            tag,
            publishedAt: data.published_at || new Date().toISOString(),
            androidUrl: androidAsset?.browser_download_url || '/descargas/android',
            iosUrl: iosAsset?.browser_download_url || '/descargas/ios',
            ...(androidSha256 ? { androidSha256 } : {}),
            ...(iosSha256 ? { iosSha256 } : {}),
          };

          this.cached = { timestamp: now, data: payload };
          return payload;
        }
      }
    } catch {
      // Si GitHub no responde, servimos el fallback y lo cacheamos brevemente.
    }

    return this.cached?.data ?? FALLBACK_RELEASE;
  }
}
