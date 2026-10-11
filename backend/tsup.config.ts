import { defineConfig } from "tsup";

// The shared package ships TypeScript source, so it is bundled into the server;
// native and driver packages stay external and are installed on the host.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  noExternal: ["@bloom/shared"],
  external: ["sharp", "pg"],
});
