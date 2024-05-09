import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

import { tmpdir } from "node:os";
import { join } from "node:path";

export function getCache() {
  return createStorage({ driver: fsDriver({ base: join(tmpdir(), "music-similar-graph") }) });
}
