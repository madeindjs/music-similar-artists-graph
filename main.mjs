#!/usr/bin/env node
import { SingleBar } from "cli-progress";
import { createOption, program } from "commander";
import { search } from "music-metadata-search";
import { readFile, writeFile } from "node:fs/promises";
import { cwd } from "node:process";
import { getCache } from "./lib/cache.mjs";
import { MusicbrainzService } from "./lib/musicbrainz.mjs";

import graphology from "graphology";
import { random } from "graphology-layout";
import forceLayout from "graphology-layout-force";
import noverlap from "graphology-layout-noverlap";
import { fileURLToPath } from "node:url";
import { serveFrontend } from "./lib/bundle.mjs";

const packageJson = JSON.parse(await readFile(new URL("./package.json", import.meta.url), { encoding: "utf-8" }));

program.name(packageJson.name).description(packageJson.description).version(packageJson.version);

const ttlOption = createOption("--cache-scan-ttl [cacheScanTtl]", "time to live for the cache (in seconds)");
ttlOption.defaultValue = 3_600;
ttlOption.defaultValueDescription = "1 hour";

const extensionsListOption = createOption("--ext [ext...]", "Extensions of Audio files to scan");
extensionsListOption.defaultValue = [".mp3", ".flac", ".m4a", ".ogg", ".aac"];

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

  const nodeOptions = { type: "circle", size: 10 };

  if (true) {
    console.log("Fetching Musicbrainz artists");
    const bar = new SingleBar({});
    bar.start(artistsCount.size, 0);

    for (const [musicbrainzArtistId, count] of artistsCount.entries()) {
      try {
        const artist = await service.findArtist(musicbrainzArtistId, true);
        if (!artist) {
          artistsCount.delete(musicbrainzArtistId);
          continue;
        }
        graph.addNode(musicbrainzArtistId, { ...nodeOptions, label: artist.name, color: "green" });
      } catch (error) {
        console.error(`Could not fetch artist ${musicbrainzArtistId}`, error);
        artistsCount.delete(musicbrainzArtistId);
      } finally {
        bar.increment();
      }
    }

    bar.stop();
  }

  {
    console.log("Fetching Similar artists");
    const bar = new SingleBar({});
    bar.start(graph.nodes().length, 0);

    for (const musicbrainzArtistId of artistsCount.keys()) {
      try {
        const similarArtists = await service.fetchSimilarArtists(musicbrainzArtistId, true);

        for (const artist of similarArtists.filter((s) => s.score > 5_000)) {
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
  //circular.assign(graph, { scale: 1 });
  random.assign(graph, { rng: () => Math.random() * 1000 });
  forceLayout.assign(graph, { maxIterations: 200, settings: { repulsion: 1 } });
  if (false) noverlap.assign(graph, {});

  await writeFile(fileURLToPath(new URL("./frontend/graph.json", import.meta.url)), JSON.stringify(graph.toJSON()));

  await serveFrontend();
});

program.showHelpAfterError(true);

program.parse();
