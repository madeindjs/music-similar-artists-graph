import { parseFile } from "music-metadata";
import { extname } from "path";
import { cacheFunction } from "./lib/cache.mjs";
import { walkDir } from "./lib/fs-walk.mjs";
import { findArtist } from "./lib/musicbrainz.mjs";

/**
 * @typedef ArtistInformation
 * @property {?string} [id]
 * @property {string} name
 * @property {string} [artistId]
 */

const MUSIC_EXTENSIONS = new Set([".flac", ".mp3", ".ogg"]);

/**
 * @returns {Promise<Record<string, number>>}
 */
async function getArtistCount() {
  /** @type {Record<string, number>} */
  const artistCount = {};

  for await (const file of walkDir("/home/alexandre/Musique/")) {
    if (!MUSIC_EXTENSIONS.has(extname(file))) continue;

    const metadata = await parseFile(file).catch(() => undefined);
    if (!metadata) continue;

    const artistName = metadata.common.artist ?? metadata.common.artists?.[0];
    if (!artistName) continue;

    const count = artistCount[artistName] ?? 0;
    artistCount[artistName] = count + 1;
  }

  return artistCount;
}

/**
 * @returns {Promise<Record<string, number>>}
 */
const getArtistCountWithCache = cacheFunction(getArtistCount);

const findArtistWithCache = cacheFunction(findArtist);

async function main() {
  const artistCount = await getArtistCountWithCache();

  /** @type {ArtistInformation[]} */
  const records = Object.entries(artistCount).map(([name, trackCount]) => ({
    name,
    trackCount,
  }));

  let i = 0;

  for (const record of records) {
    const artist = await findArtistWithCache(record.name);
    if (!artist) continue;
    record.artistId = artist.id;
  }
}

main().catch(console.error);
