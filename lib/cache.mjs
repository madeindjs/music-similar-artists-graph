import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

import { tmpdir } from "node:os";
import { join } from "node:path";

export function getCache() {
  const path = join(tmpdir(), "music-similar-graph");
  return createStorage({ driver: fsDriver({ base: path }) });
}
