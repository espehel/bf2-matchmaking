/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: 'netlify',
  server: process.env.NETLIFY || process.env.NETLIFY_LOCAL ? './server.js' : undefined,
  ignoredRouteFiles: ['**/.*'],
  serverDependenciesToBundle: [
    '@bf2-matchmaking/supabase',
    '@bf2-matchmaking/types',
    '@bf2-matchmaking/utils',
  ],
  watchPaths: ['../../packages/**/*'],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: ".netlify/functions-internal/server.js",
  // publicPath: "/build/",
};
