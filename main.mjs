import { parseFile } from 'music-metadata';
import { fetchSimilarArtistsByArtistName } from "./lib/musicbrainz.mjs";


async function main() {
  const metadata = await parseFile('/home/alexandre/Musique/Daft\ Punk/1997\ -\ \ Homework/01\ Daftendirekt.flac')

  const artistName = metadata.common.artist
  if (!artistName) return []

  const similarArtists = await fetchSimilarArtistsByArtistName(artistName)

  for (const similarArtist of similarArtists) {
    console.log(`${similarArtist.name} ${similarArtist.score}`)
  }

}

main().catch(console.error)