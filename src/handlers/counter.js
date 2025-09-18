const { setVoiceChannelName, getMemberStats } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");

/**
 * Updates the counter channels for all guilds in the update queue
 * @param {import('@src/structures').BotClient} client
 */
async function updateCounterChannels(client) {
  const queue = [...client.counterUpdateQueue];

  for (const guildId of queue) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      client.counterUpdateQueue = client.counterUpdateQueue.filter((id) => id !== guildId);
      continue;
    }

    try {
      const settings = await getSettings(guild);
      if (!settings) continue;

      const all = guild.memberCount;
      const bots = settings.data?.bots || 0;
      const members = all - bots;

      for (const config of settings.counters || []) {
        const chId = config.channel_id;
        const vc = guild.channels.cache.get(chId);
        if (!vc) continue;

        let channelName;
        switch (config.counter_type?.toUpperCase()) {
          case "USERS":
            channelName = `${config.name} : ${all}`;
            break;
          case "MEMBERS":
            channelName = `${config.name} : ${members}`;
            break;
          case "BOTS":
            channelName = `${config.name} : ${bots}`;
            break;
          default:
            continue;
        }

        await setVoiceChannelName(vc, channelName);
      }
    } catch (ex) {
      client.logger.error(`Error updating counter channels for guildId: ${guildId}`, ex);
    } finally {
      client.counterUpdateQueue = client.counterUpdateQueue.filter((id) => id !== guildId);
    }
  }
}

/**
 * Initialize guild counters at startup
 * @param {import("discord.js").Guild} guild
 * @param {Object} settings
 */
async function init(guild, settings) {
  if (!settings || !settings.counters?.length) return false;

  const hasMemberOrBotCounters = settings.counters.some((doc) =>
    ["MEMBERS", "BOTS"].includes(doc.counter_type?.toUpperCase())
  );

  if (hasMemberOrBotCounters) {
    const stats = await getMemberStats(guild);
    settings.data = settings.data || {};
    settings.data.bots = stats[1];
    await settings.save();
  }

  if (!guild.client.counterUpdateQueue.includes(guild.id)) {
    guild.client.counterUpdateQueue.push(guild.id);
  }

  return true;
}

module.exports = {
  init,
  updateCounterChannels,
};
