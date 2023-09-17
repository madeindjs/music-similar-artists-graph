import { readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import sanitize from "sanitize-filename";
import packageJson from "../package.json" assert { type: "json" };

/**
 * @param {Function} func
 */
export function cacheFunction(func) {
  return async (...args) => {
    const cacheFileName = `${packageJson.name}.${func.name}_${args.map((arg) => String(arg)).join("-")}.json`;
    const cacheFilePath = join(tmpdir(), sanitize(cacheFileName));

    //  check cache exists
    const cache = await readFile(cacheFilePath).catch(() => undefined);
    if (cache) return JSON.parse(cache.toString("utf-8"));

    const result = await func(...args);

    if (result) await writeFile(cacheFilePath, JSON.stringify(result));

    return result;
  };
}
