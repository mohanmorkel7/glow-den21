// api/index.mjs
import app from '../dist/server/node-build.mjs';

export default function handler(req, res) {
  app(req, res);
}
