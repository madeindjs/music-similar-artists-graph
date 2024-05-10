import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";

export async function buildFrontend() {
  const __dirname = fileURLToPath(new URL("..", import.meta.url));

  await build({
    root: path.resolve(__dirname, "./frontend"),
    base: "/foo/",
    build: {
      rollupOptions: {
        // ...
      },
    },
  });
}

export async function serveFrontend() {
  const __dirname = fileURLToPath(new URL("..", import.meta.url));

  const server = await createServer({
    root: path.resolve(__dirname, "./frontend"),
    build: {
      rollupOptions: {
        // ...
      },
    },
  });

  await server.listen();

  server.printUrls();
}
