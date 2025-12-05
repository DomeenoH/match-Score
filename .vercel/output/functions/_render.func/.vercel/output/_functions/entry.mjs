import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_CDdqOtJQ.mjs';
import { manifest } from './manifest_EZPWv6RD.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/analyze.astro.mjs');
const _page2 = () => import('./pages/create.astro.mjs');
const _page3 = () => import('./pages/match.astro.mjs');
const _page4 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/analyze.ts", _page1],
    ["src/pages/create.astro", _page2],
    ["src/pages/match.astro", _page3],
    ["src/pages/index.astro", _page4]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "86633b50-f6e0-468d-ad3a-f2a09acffd4c",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
