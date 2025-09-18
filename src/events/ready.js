const { counterHandler, inviteHandler } = require("@src/handlers");
const { cacheReactionRoles } = require("@schemas/Message");
const { getSettings } = require("@schemas/Guild");
const { updateCounterChannels } = require("@src/handlers/counter");
const { PRESENCE } = require("@root/config");

/**
 * @param {import('@src/structures').BotClient} client
 */
module.exports = async (client) => {
  client.logger.success(`Logged in as ${client.user.tag}! (${client.user.id})`);

  client.logger.log("Initializing music manager");
  client.musicManager.init(client.user.id);

  if (PRESENCE.ENABLED) {
    updatePresence(client);
    setInterval(() => updatePresence(client), 10 * 60 * 1000);
  }

  if (client.config.INTERACTIONS.SLASH || client.config.INTERACTIONS.CONTEXT) {
    if (client.config.INTERACTIONS.GLOBAL) {
      await client.registerInteractions();
    } else {
      await client.registerInteractions(client.config.INTERACTIONS.TEST_GUILD_ID);
    }
  }

  await cacheReactionRoles(client);

  for (const guild of client.guilds.cache.values()) {
    const settings = await getSettings(guild);

    if (settings.counters?.length > 0) {
      await counterHandler.init(guild, settings);
    }

    if (settings.invite?.tracking) {
      await inviteHandler.cacheGuildInvites(guild);
    }
  }

  setInterval(() => updateCounterChannels(client), 10 * 60 * 1000);
};

/**
 * Updates bot presence
 * @param {import('@src/structures').BotClient} client
 */
function updatePresence(client) {
  let message = PRESENCE.MESSAGE;

  if (message.includes("{servers}")) {
    message = message.replaceAll("{servers}", client.guilds.cache.size);
  }

  if (message.includes("{members}")) {
    const members = client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0);
    message = message.replaceAll("{members}", members);
  }

  client.user.setPresence({
    status: PRESENCE.STATUS,
    activities: [
      {
        name: message,
        type: PRESENCE.TYPE,
      },
    ],
  });
}
