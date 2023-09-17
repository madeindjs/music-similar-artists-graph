import { readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import packageJson from '../package.json' assert { type: "json" };

/**
 * @param {Function} func
 */
export function cacheFunction(func) {

  return async (...args) => {
    const cacheFile = join(tmpdir(), `${packageJson.name}.${func.name}_${args.map(arg => String(arg)).join('-')}.json`)

    //  check cache exists
    const cache = await readFile(cacheFile).catch(() => undefined)
    if (cache) return JSON.parse(cache.toString('utf-8'))

    const result = await func(...args);

    await writeFile(cacheFile, JSON.stringify(result))

    return result
  }
}