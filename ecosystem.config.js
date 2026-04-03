module.exports = {
  apps: [
    {
      name: "SLAYBOT",
      script: "bot.js",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      max_restarts: 5,
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "SLAYBOT-DEBUG",
      script: "bot.js",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      max_restarts: 5,
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
