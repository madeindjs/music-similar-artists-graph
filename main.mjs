import { parseFile } from "music-metadata";
import { extname } from "path";
import { Database } from "./lib/database.mjs";
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
  /** @type {Database} */
  #db;
  /** @type {MusicbrainzService} */
  #musicbrainz;

  constructor(musicbrainz = new MusicbrainzService(), db = new Database()) {
    this.#musicbrainz = musicbrainz;
    this.#db = db;
  }

  /**
   * Walk in the directory and get artist.
   * @param {string} directory
   */
  async getArtistsInDirectory(directory) {
    for await (const file of walkDir(directory)) {
      if (!MusicArtistGraph.#MUSIC_EXTENSIONS.has(extname(file))) continue;
      if (await this.#db.hasTrack(file)) continue;

      try {
        await this.getArtistFromFile(file);
      } catch (error) {
        console.error(error);
        continue;
      }
    }
  }

  async fetchSimilarArtists() {
    for (const artist of await this.#db.getArtists()) {
      await this.#musicbrainz.fetchSimilarArtists(artist.id, true);
    }
  }

  async getArtistFromFile(file) {
    const metadata = await parseFile(file).catch(() => undefined);
    if (!metadata) throw Error("Cannot get metadata");

    const artistName = metadata.common.artist ?? metadata.common.artists?.[0];
    if (!artistName) throw Error("Cannot get artist from metadata");

    if (await this.#db.hasArtist(artistName)) return;

    let artistMbid = metadata.common.musicbrainz_artistid?.[0];

    if (!artistMbid) {
      const artist = await this.#musicbrainz.findArtist(artistName, true);
      if (artist === undefined) throw Error(`Cannot find artists in Musicbrainz: ${artistName}`);
      artistMbid = artist.id ?? "UNKNOWN";
    }

    await this.#db.addArtist(artistName, artistMbid);
  }

  async close() {
    await this.#db.close();
  }
}

// const getArtistCountWithCache = cacheFunction(getArtistCount);

async function main() {
  const db = new Database();
  const musicbrainz = new MusicbrainzService(db);
  const service = new MusicArtistGraph(musicbrainz, db);

  await service.getArtistsInDirectory("/home/alexandre/Musique/");

  await service.fetchSimilarArtists();

  service.close();
}

main().catch(console.error);
