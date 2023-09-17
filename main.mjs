import { parseFile } from 'music-metadata';
import { extname } from 'path';
import { cacheFunction } from './lib/cache.mjs';
import { walkDir } from './lib/fs-walk.mjs';
import { fetchSimilarArtistsByArtistName } from "./lib/musicbrainz.mjs";

const MUSIC_EXTENSIONS = new Set(['.flac', '.mp3', '.ogg'])


/**
 * @returns {Promise<Record<string, number>>}
 */
async function getArtistCount() {
  /** @type {Record<string, number>} */
  const artistCount = {};

  for await (const file of walkDir('/home/alexandre/Musique/')) {
    if (!MUSIC_EXTENSIONS.has(extname(file))) continue;

    const metadata = await parseFile(file).catch(() => undefined);
    if (!metadata) continue

    const artistName = metadata.common.artist ?? metadata.common.artists?.[0]
    if (!artistName) continue

    const count = artistCount[artistName] ?? 0
    artistCount[artistName] = count + 1
  }

  return artistCount
}

/**
 * @returns {Promise<Record<string, number>>}
 */
const getArtistCountWithCache = cacheFunction(getArtistCount)


async function main() {

  const artistCount = await getArtistCountWithCache()

  console.log(artistCount)
  return

  let i = 0

  for await (const file of walkDir('/home/alexandre/Musique/')) {

    console.log(file, extname(file))

    if (!['.flac', '.mp3'].includes(extname(file))) continue;

    const metadata = await parseFile(file).catch(() => undefined)

    const artistName = metadata.common.artist
    if (!artistName) return []

    const similarArtists = await fetchSimilarArtistsByArtistName(artistName)

    for (const similarArtist of similarArtists) {
      console.log(`${similarArtist.name} ${similarArtist.score}`)
    }

    i++

    if (i === 5) return
  }
}

main().catch(console.error)