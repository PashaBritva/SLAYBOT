const { getJson } = require("@utils/httpUtils");
const config = require("@root/config.js");
const { success, warn, error, log } = require("@src/helpers/logger");

async function checkForUpdates() {
  try {
    const response = await getJson("https://api.github.com/repos/PashaBritva/SLAYBOT/releases/latest");
    if (!response.success) {
      throw new Error("Failed to fetch release data");
    }

    const semver = require("semver");
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
  // Validate .env file
  if (!process.env.BOT_TOKEN) {
    error("env: BOT_TOKEN cannot be empty");
    process.exit();
  }
  if (!process.env.MONGO_CONNECTION) {
    error("env: MONGO_CONNECTION cannot be empty");
    process.exit();
  }
  if (config.DASHBOARD.enabled) {
    if (!process.env.BOT_SECRET) {
      error("env: BOT_SECRET cannot be empty");
      process.exit();
    }
    if (!process.env.SESSION_PASSWORD) {
      error("env: SESSION_PASSWORD cannot be empty");
      process.exit();
    }
  }
  if (!process.env.WEATHERSTACK_KEY) {
    warn("env: WEATHERSTACK_KEY is missing. Weather command won't work");
  }

  // Validate config.js file
  if (isNaN(config.CACHE_SIZE.GUILDS) || isNaN(config.CACHE_SIZE.USERS) || isNaN(config.CACHE_SIZE.MEMBERS)) {
    error("config.js: CACHE_SIZE must be a positive integer");
    process.exit();
  }
  if (!config.PREFIX) {
    error("config.js: PREFIX cannot be empty");
    process.exit();
  }
  if (config.DASHBOARD.enabled) {
    if (!config.DASHBOARD.baseURL || !config.DASHBOARD.failureURL || !config.DASHBOARD.port) {
      error("config.js: DASHBOARD details cannot be empty");
      process.exit();
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
 * @param {import('discord.js').TextBasedChannels} channel
 * @param {string|import('discord.js').MessagePayload|import('discord.js').MessageOptions} content
 * @param {number} [seconds]
 */
async function sendMessage(channel, content, seconds) {
  if (!channel || !content) return;
  const perms = ["VIEW_CHANNEL", "SEND_MESSAGES"];
  if (content.embeds && content.embeds.length > 0) perms.push("EMBED_LINKS");
  if (channel.type !== "DM" && !channel.permissionsFor(channel.guild.me).has(perms)) return;
  try {
    if (!seconds) return await channel.send(content);
    const reply = await channel.send(content);
    setTimeout(async () => { try { if (reply.deletable) await reply.delete(); } catch (e) {} }, seconds * 1000);
  } catch (ex) {
    error(`sendMessage`, ex);
  }
}

/**
 * @param {import('discord.js').User} user
 * @param {string|import('discord.js').MessagePayload|import('discord.js').MessageOptions} message
 * @param {number} [seconds]
 */
async function safeDM(user, message, seconds) {
  if (!user || !message) return;
  try {
    const dm = await user.createDM();
    if (!seconds) return await dm.send(message);
    const reply = await dm.send(message);
    setTimeout(() => reply.deletable && reply.delete().catch((ex) => {}), seconds * 1000);
  } catch (ex) {
    /** Ignore */
  }
}

const permissions = {
  CREATE_INSTANT_INVITE: "Create instant invite",
  KICK_MEMBERS: "Kick members",
  BAN_MEMBERS: "Ban members",
  ADMINISTRATOR: "Administrator",
  MANAGE_CHANNELS: "Manage channels",
  MANAGE_GUILD: "Manage server",
  ADD_REACTIONS: "Add Reactions",
  VIEW_AUDIT_LOG: "View audit log",
  PRIORITY_SPEAKER: "Priority speaker",
  STREAM: "Video",
  VIEW_CHANNEL: "View channel",
  SEND_MESSAGES: "Send messages",
  SEND_TTS_MESSAGES: "Send TTS messages",
  MANAGE_MESSAGES: "Manage messages",
  EMBED_LINKS: "Embed links",
  ATTACH_FILES: "Attach files",
  READ_MESSAGE_HISTORY: "Read message history",
  MENTION_EVERYONE: "Mention everyone",
  USE_EXTERNAL_EMOJIS: "Use external emojis",
  VIEW_GUILD_INSIGHTS: "View server insights",
  CONNECT: "Connect",
  SPEAK: "Speak",
  MUTE_MEMBERS: "Mute members",
  DEAFEN_MEMBERS: "Deafen members",
  MOVE_MEMBERS: "Move members",
  USE_VAD: "Use voice activity",
  CHANGE_NICKNAME: "Change nickname",
  MANAGE_NICKNAMES: "Manage nicknames",
  MANAGE_ROLES: "Manage roles",
  MANAGE_WEBHOOKS: "Manage webhooks",
  MANAGE_EMOJIS_AND_STICKERS: "Manage emojis and stickers",
  USE_APPLICATION_COMMANDS: "Use Application Commands",
  REQUEST_TO_SPEAK: "Request to Speak",
  MANAGE_THREADS: "Manage Threads",
  USE_PUBLIC_THREADS: "Use Public Threads",
  USE_PRIVATE_THREADS: "Use Private Threads",
  USE_EXTERNAL_STICKERS: "Use External Stickers",
  SEND_MESSAGES_IN_THREADS: "Send Messages In Threads",
  START_EMBEDDED_ACTIVITIES: "Start Embedded Activities",
  MODERATE_MEMBERS: "Moderate Members",
};

/**
 * @param {import("discord.js").PermissionResolvable[]} perms
 */
const parsePermissions = (perms) => {
  const word = perms.length > 1 ? "permissions" : "permission";
  return `${perms.map((p) => `\`${permissions[p]}\``).join(", ")} ${word}`;
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
