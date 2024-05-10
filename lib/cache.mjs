import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

import { fileURLToPath } from "node:url";

export function getCache() {
  const path = fileURLToPath(new URL("../.cache", import.meta.url));
  return createStorage({ driver: fsDriver({ base: path }) });
}
