import { createCanvas } from "canvas";
import Graph from "graphology";
import { renderAsync } from "graphology-canvas";
import { circular } from "graphology-layout";
import graphologySvg from "graphology-svg";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function renderGraph(graph) {
  circular.assign(graph);

  const path = join(tmpdir(), "music-similar-graph-export.svg");

  return new Promise((res, rej) => {
    graphologySvg(graph, path, {}, (error) => {
      if (error) return rej(error);
      res(path);
    });
  });
}

/**
 *
 * @param {string} path
 * @param {import('canvas').Canvas} canvas
 */
function writeCanvas(path, canvas) {
  const stream = createWriteStream(path);
  canvas.createPNGStream().pipe(stream);

  return new Promise((res) => {
    stream.on("finish", () => res(true));
  });
}

/**
 *
 * @param {Graph} graph
 * @returns
 */
export async function renderGraph2(graph) {
  const dimensions = [1000, 1000];

  const canvas = createCanvas(dimensions[0], dimensions[1]);
  const context = canvas.getContext("2d");

  const path = join(tmpdir(), "music-similar-graph-export3.png");

  await new Promise((res, rej) => {
    // @ts-ignore
    renderAsync(graph, context, {}, (error) => {
      if (error) return rej(error);
      res(path);
    });
  });

  await writeCanvas(path, canvas);

  return path;
}
