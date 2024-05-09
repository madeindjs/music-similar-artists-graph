#!/usr/bin/env node
import { createOption, program } from "commander";
import { search } from "music-metadata-search";
import { readFile } from "node:fs/promises";
import { cwd } from "node:process";
import { getCache } from "./lib/cache.mjs";
import { MusicbrainzService } from "./lib/musicbrainz.mjs";

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
  const tracks = await search(path, { where: '"musicbrainzArtistId" IS NOT NULL' });

  const cache = getCache();
  const service = new MusicbrainzService(cache);

  const artistsCount = new Map();

  for (const track of tracks) {
    for (const musicbrainzArtistId of track.musicbrainzArtistId?.split(",") ?? []) {
      artistsCount.set(musicbrainzArtistId, (artistsCount.get(musicbrainzArtistId) ?? 0) + 1);
    }
  }

  for (const musicbrainzArtistId of artistsCount.keys()) {
    try {
      const artist = await service.findArtist(musicbrainzArtistId, true);
      if (!artist) artistsCount.delete(musicbrainzArtistId);
    } catch (error) {
      console.error(`Could not fetch artist ${musicbrainzArtistId}`);
      artistsCount.delete(musicbrainzArtistId);
    }
  }

  // TODO: generate graph

  console.log(artistsCount);
});

program.showHelpAfterError(true);

program.parse();
