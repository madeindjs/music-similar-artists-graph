import sanitize from "sanitize-filename";
import packageJson from "../package.json" assert { type: "json" };
import { getCache } from "./cache.mjs";

/**
 * @typedef {{id: string, name: string}} Artist
 * @typedef {{artist_mbid: string, name: string, score: number}} SimilarArtist
 */

export class MusicbrainzService {
  #lastRequestTs = 0;
  /** @type {ReturnType<typeof getCache>} */
  #cache;

  constructor(cache = getCache()) {
    this.#cache = cache;
  }

  /**
   * @param {string} artist
   * @param {boolean} cache
   * @returns {Promise<Artist>}
   */
  async findArtist(artist, cache = false) {
    const params = new URLSearchParams();
    params.set("query", `artist:${artist}`);

    const res = await this.#fetch(`https://musicbrainz.org/ws/2/artist/?${params}`, cache);

    return res.artists?.[0];
  }

  /**
   * @param {string} artistMbid
   * @param {boolean} cache
   * @returns {Promise<SimilarArtist[]>}
   */
  async fetchSimilarArtists(artistMbid, cache = false) {
    const params = new URLSearchParams();
    params.set("artist_mbid", artistMbid);
    params.set(
      "algorithm",
      "session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30"
    );
    const res = await this.#fetch(`https://labs.api.listenbrainz.org/similar-artists/json?${params}`, cache);

    return res[3]?.data;
  }

  /**
   * @param {string} url
   * @param {boolean} cache
   * @returns
   */
  async #fetch(url, cache = false) {
    const cacheKey = `${MusicbrainzService.name}:${sanitize(url)}`;

    if (cache) {
      const cached = await this.#cache.hasItem(cacheKey);
      if (cached) return cached;
    }

    await this.#waitRateLimit();

    console.debug(`GET ${url}`);

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Application: `${packageJson.name}/${packageJson.version} (${packageJson.author})`,
      },
    });

    this.#lastRequestTs = Date.now();

    if (!res.ok) throw Error(await res.text());

    const resJson = await res.json();

    if (cache) await this.#cache.setItem(cacheKey, resJson);

    return resJson;
  }

  async #waitRateLimit() {
    const nextTs = this.#lastRequestTs + 1_000 - Date.now();

    if (nextTs > 0) {
      return new Promise((res) => setTimeout(res, nextTs));
    }
    return Promise.resolve();
  }
}
