// Vercel entry point: runs the Express API (server/) as a Vercel Function.
// vercel.json rewrites every /api/* request here; Express still sees the
// original path (/api/groups, /api/me, …) and routes it as usual.
import { createApp } from '../server/src/app.js';

export default createApp();
