import "server-only"
import { unstable_cache } from "next/cache"

class UnavailableStats<T> extends Error {
  constructor(readonly stats: T) {
    super("Provider stats unavailable; retain the last successful cache entry")
  }
}

/** Cache compact successful aggregates, not raw network responses. Next strips
 * AbortSignal on stale fetch-cache revalidation; the loaders therefore use
 * no-store transport inside this tagged cache and own a whole-read deadline.
 * A failed refresh never overwrites the last successful, timestamped result. */
export function cacheProviderStats<T extends { degraded: boolean }>(
  tag: string,
  revalidate: number,
  load: (signal?: AbortSignal) => Promise<T>,
): () => Promise<T> {
  const cached = unstable_cache(async () => {
    const stats = await load()
    if (stats.degraded) throw new UnavailableStats(stats)
    return stats
  }, [tag, "bounded-stats-v1"], { revalidate, tags: [tag] })

  return async () => {
    try {
      return await cached()
    } catch (error) {
      if (error instanceof UnavailableStats) return error.stats as T
      // Cache infrastructure failure: obtain the existing provider fallback
      // without starting a second network budget or caching it as fresh data.
      return load(AbortSignal.abort())
    }
  }
}
