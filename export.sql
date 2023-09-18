select
	s.toArtistId, a_to.name as toArtistName,
	-- multiply the total score by the number of track of the original artists own
	count(t.artistId) * SUM(score) as totalScore,
	GROUP_CONCAT(DISTINCT a_from.name)
from similar_artists s
inner join artists a_from on s.fromArtistId = a_from.id
inner join artists a_to on s.toArtistId = a_to.id
inner join tracks t on t.artistId = s.fromArtistId
left join tracks has_tracks on has_tracks.artistId = s.toArtistId
where has_tracks.artistId is null
GROUP by s.toArtistId
ORDER by totalScore desc