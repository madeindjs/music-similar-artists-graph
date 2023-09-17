import { fetchSimilarArtistsByArtistName } from "./lib/musicbrainz.mjs"


async function main() {
  const artistName = 'Daft Punk'
  const similarArtists = await fetchSimilarArtistsByArtistName(artistName)

  for (const similarArtist of similarArtists) {
    console.log(`${similarArtist.name} ${similarArtist.score}`)
  }

}

main().catch(console.error)