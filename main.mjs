#!/usr/bin/env node
import { SingleBar } from "cli-progress";
import { createOption, program } from "commander";
import { search } from "music-metadata-search";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { getCache } from "./lib/cache.mjs";
import { MusicbrainzService } from "./lib/musicbrainz.mjs";

import graphology from "graphology";
import { circular } from "graphology-layout";
import forceLayout from "graphology-layout-force";
import { renderGraph2 } from "./lib/graph.mjs";

const packageJson = JSON.parse(await readFile(new URL("./package.json", import.meta.url), { encoding: "utf-8" }));

program.name(packageJson.name).description(packageJson.description).version(packageJson.version);

const ttlOption = createOption("--cache-scan-ttl [cacheScanTtl]", "time to live for the cache (in seconds)");
ttlOption.defaultValue = 3_600;
ttlOption.defaultValueDescription = "1 hour";

const extensionsListOption = createOption("--ext [ext...]", "Extensions of Audio files to scan");
extensionsListOption.defaultValue = [".mp3", ".flac", ".m4a", ".ogg", ".aac"];

const formatOption = createOption("-f, --format [format]", "Output format")
  .choices(["txt", "json", "m3u"])
  .default("txt");

const rangeDescription =
  "If a single value is provided, it will filter by `=`, you can also give a range like `1..10 to filter using `BETWEEN` operator";

program.argument("[path]", "The directory of local files", cwd()).action(async (path, opts) => {
  console.log("Parsing tracks");
  const tracks = await search(path, { where: '"musicbrainzArtistId" IS NOT NULL' });

  const cache = getCache();
  const service = new MusicbrainzService(cache);

  const artistsCount = new Map();

  const graph = new graphology({ multi: true, type: "directed" });

  for (const track of tracks) {
    for (const musicbrainzArtistId of track.musicbrainzArtistId?.split(",") ?? []) {
      artistsCount.set(musicbrainzArtistId, (artistsCount.get(musicbrainzArtistId) ?? 0) + 1);
    }
  }

  const nodeOptions = { size: 100, type: "circle", forceLabel: true };

  if (true) {
    console.log("Fetching Musicbrainz artists");
    const bar = new SingleBar({});
    bar.start(artistsCount.size, 0);

    for (const musicbrainzArtistId of artistsCount.keys()) {
      try {
        const artist = await service.findArtist(musicbrainzArtistId, true);
        if (!artist) {
          artistsCount.delete(musicbrainzArtistId);
          continue;
        }
        graph.addNode(musicbrainzArtistId, { ...nodeOptions, label: artist.name });
      } catch (error) {
        console.error(`Could not fetch artist ${musicbrainzArtistId}`, error);
        artistsCount.delete(musicbrainzArtistId);
      } finally {
        bar.increment();
      }
    }

    bar.stop();
  }

  if (false) {
    console.log("Fetching Similar artists");
    const bar = new SingleBar({});
    bar.start(graph.nodes().length, 0);

    for (const musicbrainzArtistId of artistsCount.keys()) {
      try {
        const similarArtists = await service.fetchSimilarArtists(musicbrainzArtistId, true);

        for (const artist of similarArtists.filter((s) => s.score > 98)) {
          if (!graph.hasNode(artist.artist_mbid)) {
            graph.addNode(artist.artist_mbid, { ...nodeOptions, label: artist.name });
          }

          graph.addDirectedEdge(musicbrainzArtistId, artist.artist_mbid);
        }
      } catch (error) {
        console.error(`Could not fetch artist ${musicbrainzArtistId}`, error);
        artistsCount.delete(musicbrainzArtistId);
      } finally {
        bar.increment();
      }
    }

    bar.stop();
  }

  console.log("Computing layout");
  circular.assign(graph, { scale: 1 });
  forceLayout.assign(graph, { maxIterations: 5 });

  graph.forEachNode((n, attr) => console.log(n, attr));

  console.log(graph.export());

  console.log("Rendering graph");
  // const file = await renderGraph(graph);
  const file2 = await renderGraph2(graph);
  console.log(file2);
});

program.showHelpAfterError(true);

program.parse();
