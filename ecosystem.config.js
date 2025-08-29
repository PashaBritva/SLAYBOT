module.exports = {
  apps: [
    {
      name: "SLAYBOT",
      script: "bot.js",
      watch: true,
      ignore_watch: ["node_modules", "logs"],
      max_restarts: 5,
      autorestart: true,
      watch_options: {
        followSymlinks: false,
        usePolling: true
      },
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
