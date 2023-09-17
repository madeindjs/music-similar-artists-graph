/**
 * @typedef {{id: string, name: string}} Artist
 * @typedef {{artist_mbid: string, name: string, score: number}} SimilarArtist
 */

/**
 * @param {string} artist
 * @returns {Promise<Artist>}
 */
async function findArtist(artist) {
  const params = new URLSearchParams()
  params.set('query', `artist:${artist}`)

  const res = await fetch(`https://musicbrainz.org/ws/2/artist/?${params}`, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw Error(await res.text())

  const resJson = await res.json()
  return resJson.artists[0]
}

/**
 * @param {string} artistId
 * @returns {Promise<SimilarArtist[]>}
 */
async function fetchSimilarArtistsByArtistId(artistId) {
  const params = new URLSearchParams()
  params.set('artist_mbid', artistId)
  params.set('algorithm', 'session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30')

  const res = await fetch(`https://labs.api.listenbrainz.org/similar-artists/json?${params}`, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw Error(await res.text())

  const resJson = await res.json()
  return resJson[3].data
}

/**
 * @param {string} artistName
 * @returns {Promise<SimilarArtist[]>}
 */
async function fetchSimilarArtistsByArtistName(artistName) {
  const { id: artistId } = await findArtist(artistName)
  return fetchSimilarArtistsByArtistId(artistId)
}

async function main() {
  const artistName = 'Daft Punk'
  const similarArtists = await fetchSimilarArtistsByArtistName(artistName)

  for (const similarArtist of similarArtists) {
    console.log(`${similarArtist.name} ${similarArtist.score}`)
  }

}

main().catch(console.error)