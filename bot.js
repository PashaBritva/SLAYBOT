require("dotenv").config();
require("module-alias/register");

const path = require("path");
const { startupCheck } = require("@utils/botUtils");
const { BotClient } = require("@src/structures");
const BlockedServer = require("@schemas/BlockedServer");
const tempRolesHandler = require("@utils/tempRolesUtils");
const { error } = require("@src/helpers/logger");

global.__appRoot = path.resolve(__dirname);

const client = new BotClient();
client.blockedServers = [];

client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

process.on("unhandledRejection", (reason, promise) => {
  error("Unhandled Rejection at:", promise, "reason:", reason?.stack || reason);
  client.logger?.error?.(
    `Unhandled exception: ${reason?.message || reason}`,
    reason?.stack || reason
  );
});

process.on("uncaughtException", (err) => {
  error("Uncaught Exception:", err?.stack || err);
  client.logger?.error?.(`Uncaught exception: ${err?.message}`, err?.stack || err);
});

const loadBlockedServers = async (client) => {
  try {
    const now = new Date();
    const blocked = await BlockedServer.find({
      $or: [{ isPermanent: true }, { expiresAt: { $gt: now } }],
    });

    client.blockedServers = blocked.map((s) => s.serverId);
    client.logger.log(`Загружено ${client.blockedServers.length} активных блокировок`);

    for (const server of blocked.filter((s) => !s.isPermanent)) {
      const remaining = server.expiresAt - now;
      if (remaining > 0) {
        setTimeout(async () => {
          await BlockedServer.deleteOne({ _id: server._id });
          client.blockedServers = client.blockedServers.filter((id) => id !== server.serverId);
          client.logger.log(`Сервер ${server.serverId} автоматически разблокирован`);
        }, remaining);
      }
    }
  } catch (err) {
    client.logger.error("Ошибка загрузки блокировок:", err);
  }
};

(async () => {
  await startupCheck();
  await client.initializeMongoose();

  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Launching dashboard");
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {
      client.logger.error("Failed to launch dashboard", ex);
    }
  }

  await client.login(process.env.BOT_TOKEN);

  await loadBlockedServers(client);
  await tempRolesHandler(client);
})();
