import packageJson from "../package.json" assert { type: "json" };
import { cacheFunction } from "./cache.mjs";

/**
 * @typedef {{id: string, name: string}} Artist
 * @typedef {{artist_mbid: string, name: string, score: number}} SimilarArtist
 */

export class MusicbrainzService {
  #lastRequestTs = 0;
  /** @type {(name: string) => Promise<Artist>} */
  findArtistWithCache = cacheFunction(this.findArtist.bind(this));

  /**
   * @param {string} artist
   * @returns {Promise<Artist>}
   */
  async findArtist(artist) {
    const params = new URLSearchParams();
    params.set("query", `artist:${artist}`);

    const res = await this.#fetch(`https://musicbrainz.org/ws/2/artist/?${params}`);

    return res.artists[0];
  }

  /**
   * @param {string} artistId
   * @returns {Promise<SimilarArtist[]>}
   */
  async fetchSimilarArtistsByArtistId(artistId) {
    const params = new URLSearchParams();
    params.set("artist_mbid", artistId);
    params.set(
      "algorithm",
      "session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30"
    );
    const res = await this.#fetch(`https://labs.api.listenbrainz.org/similar-artists/json?${params}`);

    return res[3].data;
  }

  /**
   * @param {string} artistName
   * @returns {Promise<SimilarArtist[]>}
   */
  async fetchSimilarArtistsByArtistName(artistName) {
    const { id: artistId } = await this.findArtist(artistName);
    return this.fetchSimilarArtistsByArtistId(artistId);
  }

  async #fetch(url) {
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

    return res.json();
  }

  async #waitRateLimit() {
    const nextTs = this.#lastRequestTs + 1_000 - Date.now();

    if (nextTs > 0) {
      return new Promise((res) => setTimeout(res, nextTs));
    }
    return Promise.resolve();
  }
}
