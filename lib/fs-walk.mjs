import fs from "fs/promises";
import path from "path";

/**
 * @param {string} dir
 * @returns {AsyncGenerator<>}
 */
export async function* walkDir(dir) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const dirPath = path.join(dir, file);
    const isDirectory = await fs
      .stat(dirPath)
      .then((stat) => stat.isDirectory());

    if (isDirectory) {
      yield* await walkDir(dirPath);
    } else {
      yield path.join(dir, file);
    }
  }
}