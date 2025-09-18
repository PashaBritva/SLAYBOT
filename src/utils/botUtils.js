const { getJson } = require("@utils/httpUtils");
const config = require("@root/config.js");
const { success, warn, error, log } = require("@src/helpers/logger");
const semver = require("semver");
const { PermissionsBitField, ChannelType } = require("discord.js");

async function checkForUpdates() {
  try {
    const response = await getJson("https://api.github.com/repos/PashaBritva/SLAYBOT/releases/latest");
    if (!response.success) throw new Error("Failed to fetch release data");

    const currentVersion = require("@root/package.json").version;
    const latestVersion = response.data.tag_name.replace(/^v/, "");
    if (semver.gte(currentVersion, latestVersion)) {
      success("VersionCheck: Your discord bot is up to date");
    } else {
      warn(`VersionCheck: Update available: ${latestVersion}`);
      warn("Download: https://github.com/PashaBritva/SLAYBOT/releases/latest");
    }
  } catch (err) {
    error("VersionCheck: Failed to check for bot updates", err.message);
  }
}

function validateConfig() {
  log("Validating config.js and environment variables");

  if (!process.env.BOT_TOKEN) {
    error("env: BOT_TOKEN cannot be empty");
    process.exit(1);
  }
  if (!process.env.MONGO_CONNECTION) {
    error("env: MONGO_CONNECTION cannot be empty");
    process.exit(1);
  }
  if (config.DASHBOARD.enabled) {
    if (!process.env.BOT_SECRET) {
      error("env: BOT_SECRET cannot be empty");
      process.exit(1);
    }
    if (!process.env.SESSION_PASSWORD) {
      error("env: SESSION_PASSWORD cannot be empty");
      process.exit(1);
    }
  }
  if (!process.env.WEATHERSTACK_KEY) {
    warn("env: WEATHERSTACK_KEY is missing. Weather command won't work");
  }

  if (
    isNaN(config.CACHE_SIZE.GUILDS) ||
    isNaN(config.CACHE_SIZE.USERS) ||
    isNaN(config.CACHE_SIZE.MEMBERS)
  ) {
    error("config.js: CACHE_SIZE must be a positive integer");
    process.exit(1);
  }
  if (!config.PREFIX) {
    error("config.js: PREFIX cannot be empty");
    process.exit(1);
  }
  if (config.DASHBOARD.enabled) {
    if (!config.DASHBOARD.baseURL || !config.DASHBOARD.failureURL || !config.DASHBOARD.port) {
      error("config.js: DASHBOARD details cannot be empty");
      process.exit(1);
    }
  }
  if (config.OWNER_IDS.length === 0) warn("config.js: OWNER_IDS are empty");
  if (!config.SUPPORT_SERVER) warn("config.js: SUPPORT_SERVER is not provided");
}

async function startupCheck() {
  await checkForUpdates();
  validateConfig();
}

/**
 * @param {import("discord.js").TextBasedChannel} channel
 * @param {string|import("discord.js").MessagePayload|import("discord.js").MessageCreateOptions} content
 * @param {number} [seconds]
 */
async function sendMessage(channel, content, seconds) {
  if (!channel || !content) return;

  const perms = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages];
  if (content.embeds && content.embeds.length > 0) {
    perms.push(PermissionsBitField.Flags.EmbedLinks);
  }

  if (channel.type !== ChannelType.DM && !channel.permissionsFor(channel.guild.members.me)?.has(perms)) {
    return;
  }

  try {
    const reply = await channel.send(content);
    if (seconds) {
      setTimeout(async () => {
        try {
          if (reply.deletable) await reply.delete();
        } catch {}
      }, seconds * 1000);
    }
    return reply;
  } catch (ex) {
    error(`sendMessage`, ex);
  }
}

/**
 * @param {import("discord.js").User} user
 * @param {string|import("discord.js").MessagePayload|import("discord.js").MessageCreateOptions} message
 * @param {number} [seconds]
 */
async function safeDM(user, message, seconds) {
  if (!user || !message) return;
  try {
    const dm = await user.createDM();
    const reply = await dm.send(message);
    if (seconds) {
      setTimeout(() => reply.deletable && reply.delete().catch(() => {}), seconds * 1000);
    }
    return reply;
  } catch {
    /** ignore */
  }
}

const permissions = Object.fromEntries(
  Object.entries(PermissionsBitField.Flags).map(([k]) => [k, k.replace(/_/g, " ").toLowerCase()])
);

/**
 * @param {import("discord.js").PermissionResolvable[]} perms
 */
const parsePermissions = (perms) => {
  const word = perms.length > 1 ? "permissions" : "permission";
  return `${perms.map((p) => `\`${permissions[p] ?? p}\``).join(", ")} ${word}`;
};

const musicValidations = [
  {
    callback: ({ client, guildId }) => client.musicManager.get(guildId),
    message: "🚫 No music is being played!",
  },
  {
    callback: ({ member }) => member.voice.channelId,
    message: "🚫 You need to join my voice channel.",
  },
  {
    callback: ({ member, client, guildId }) =>
      member.voice.channelId === client.musicManager.get(guildId)?.voiceChannel,
    message: "🚫 You're not in the same voice channel.",
  },
];

module.exports = {
  permissions,
  parsePermissions,
  sendMessage,
  safeDM,
  startupCheck,
  musicValidations,
};
