#!/usr/bin/env node
import Pastel from "pastel";

const app = new Pastel({
  importMeta: import.meta,
  name: "bb",
  version: "2.0.0",
  description: "Bitbucket CLI tool",
});

await app.run();
