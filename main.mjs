import { parseFile } from 'music-metadata';
import { extname } from 'path';
import { walkDir } from './lib/fs-walk.mjs';
import { fetchSimilarArtistsByArtistName } from "./lib/musicbrainz.mjs";

const MUSIC_EXTENSIONS = new Set(['.flac', '.mp3', '.ogg'])


async function getArtistCount() {
  /** @type {Map<string, number>} */
  const artistCount = new Map();

  for await (const file of walkDir('/home/alexandre/Musique/')) {
    if (!MUSIC_EXTENSIONS.has(extname(file))) continue;

    const metadata = await parseFile(file).catch(() => undefined);
    if (!metadata) continue

    const artistName = metadata.common.artist ?? metadata.common.artists?.[0]
    if (!artistName) continue

    const count = artistCount.get(artistName) ?? 0
    artistCount.set(artistName, count + 1)
  }

  return artistCount
}


async function main() {

  const artistCount = await getArtistCount()

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