import { parseFile } from "music-metadata";
import { extname } from "path";
import { walkDir } from "./lib/fs-walk.mjs";
import { MusicbrainzService } from "./lib/musicbrainz.mjs";

/**
 * @typedef ArtistInformation
 * @property {?string} [id]
 * @property {string} name
 * @property {string} [artistId]
 */

class MusicArtistGraph {
  static #MUSIC_EXTENSIONS = new Set([".flac", ".mp3", ".ogg"]);

  /** @type {MusicbrainzService} */
  #musicbrainz;
  /** @type {Map<string, string>} */
  #artistsMbidByName = new Map();
  /** @type {Map<string, number>} */
  #artistsCount = new Map();

  constructor(musicbrainz = new MusicbrainzService()) {
    this.#musicbrainz = musicbrainz;
  }

  /**
   * @param {string} name
   * @param {string | undefined} [mbid] Make a Musicbrainz lookup to fetch id if not provided
   */
  async addArtist(name, mbid = undefined) {
    const count = this.#artistsCount.get(name) ?? 0;
    this.#artistsCount.set(name, count + 1);

    if (!mbid) {
      const artist = await this.#musicbrainz.findArtistWithCache(name);
      mbid = artist.id;
    }

    if (!this.#artistsMbidByName.has(name)) this.#artistsMbidByName.set(name, mbid);
  }

  /**
   * Walk in the directory and get artist.
   * @param {string} directory
   */
  async getArtistsInDirectory(directory) {
    for await (const file of walkDir(directory)) {
      try {
        await this.getArtistFromFile(file);
      } catch {
        continue;
      }
    }
  }

  async getArtistFromFile(file) {
    if (!MusicArtistGraph.#MUSIC_EXTENSIONS.has(extname(file))) throw Error("Not a music file");

    const metadata = await parseFile(file).catch(() => undefined);
    if (!metadata) throw Error("Cannot get metadata");

    const artistName = metadata.common.artist ?? metadata.common.artists?.[0];
    if (!artistName) throw Error("Cannot get artist from metadata");

    const artistMbid = metadata.common.musicbrainz_artistid?.[0];

    // if (!artistMbid) {
    //   console.log("cannot get mbid");
    // }
    await this.addArtist(artistName, artistMbid);
  }
}

// const getArtistCountWithCache = cacheFunction(getArtistCount);

async function main() {
  const service = new MusicArtistGraph();
  await service.getArtistsInDirectory("/home/alexandre/Musique/");
}

main().catch(console.error);
