const { Collection, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { sendMessage } = require("@utils/botUtils");
const { containsLink } = require("@utils/miscUtils");
const { error } = require("../helpers/logger");
const { getSettings } = require("@schemas/Guild");
const { getMember } = require("@schemas/Member");
const { addModLogToDb } = require("@schemas/ModLog");

const DEFAULT_TIMEOUT_DAYS = 7;

function memberInteract(issuer, target) {
  const { guild } = issuer;
  if (guild.ownerId === issuer.id) return true;
  if (guild.ownerId === target.id) return false;
  return issuer.roles.highest.position > target.roles.highest.position;
}

async function addModAction(issuer, target, reason, action) {
  switch (action) {
    case "MUTE":
      return timeoutTarget(issuer, target, DEFAULT_TIMEOUT_DAYS * 24 * 60, reason);
    case "KICK":
      return kickTarget(issuer, target, reason);
    case "SOFTBAN":
      return softbanTarget(issuer, target, reason);
    case "BAN":
      return banTarget(issuer, target, reason);
  }
}

async function logModeration(issuer, target, reason, type, data = {}) {
  if (!type) return;
  const { guild } = issuer;
  const settings = await getSettings(guild);

  let logChannel;
  if (settings.modlog_channel) logChannel = guild.channels.cache.get(settings.modlog_channel);

  const embed = new EmbedBuilder().setAuthor({ name: `Moderation Case - ${type}` });

  switch (type.toUpperCase()) {
    case "PURGE":
      embed.addFields(
        { name: "Issuer", value: `<@${issuer.id}> [${issuer.id}]`, inline: false },
        { name: "Purge Type", value: data.purgeType, inline: true },
        { name: "Messages", value: data.deletedCount.toString(), inline: true },
        { name: "Channel", value: `#${data.channel.name} [${data.channel.id}]`, inline: false }
      );
      break;

    case "TIMEOUT":
      embed.setColor(EMBED_COLORS.TIMEOUT_LOG);
      break;
    case "UNTIMEOUT":
      embed.setColor(EMBED_COLORS.UNTIMEOUT_LOG);
      break;
    case "KICK":
      embed.setColor(EMBED_COLORS.KICK_LOG);
      break;
    case "SOFTBAN":
      embed.setColor(EMBED_COLORS.SOFTBAN_LOG);
      break;
    case "BAN":
      embed.setColor(EMBED_COLORS.BAN_LOG);
      break;
    case "VMUTE":
      embed.setColor(EMBED_COLORS.VMUTE_LOG);
      break;
    case "VUNMUTE":
      embed.setColor(EMBED_COLORS.VUNMUTE_LOG);
      break;
    case "DEAFEN":
      embed.setColor(EMBED_COLORS.DEAFEN_LOG);
      break;
    case "UNDEAFEN":
      embed.setColor(EMBED_COLORS.UNDEAFEN_LOG);
      break;
    case "DISCONNECT":
      embed.setColor(EMBED_COLORS.DISCONNECT_LOG);
      break;
    case "MOVE":
      embed.setColor(EMBED_COLORS.MOVE_LOG);
      break;
  }

  if (type.toUpperCase() !== "PURGE") {
    embed
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: "Issuer", value: `<@${issuer.id}> [${issuer.id}]`, inline: false },
        { name: "Member", value: `<@${target.id}> [${target.id}]`, inline: false },
        { name: "Reason", value: reason || "No reason provided", inline: true }
      )
      .setTimestamp(Date.now());

    if (type.toUpperCase() === "TIMEOUT" && target.communicationDisabledUntilTimestamp) {
      embed.addFields({
        name: "Expires",
        value: `<t:${Math.round(target.communicationDisabledUntilTimestamp / 1000)}:R>`,
        inline: true,
      });
    }
    if (type.toUpperCase() === "MOVE" && data.channel) {
      embed.addFields({ name: "Moved to", value: data.channel.name, inline: true });
    }
  }

  await addModLogToDb(issuer, target, reason, type.toUpperCase());
  if (logChannel) sendMessage(logChannel, { embeds: [embed] });
}

async function purgeMessages(issuer, channel, type, amount, argument) {
  if (
    !channel
      .permissionsFor(issuer)
      .has([PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ReadMessageHistory])
  ) {
    return "MEMBER_PERM";
  }

  if (
    !channel
      .permissionsFor(channel.guild.members.me)
      .has([PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ReadMessageHistory])
  ) {
    return "BOT_PERM";
  }

  const toDelete = new Collection();

  try {
    const messages = await channel.messages.fetch({ limit: amount });

    for (const message of messages.values()) {
      if (toDelete.size >= amount) break;
      if (!message.deletable) continue;

      if (type === "ALL") toDelete.set(message.id, message);
      else if (type === "ATTACHMENT" && message.attachments.size > 0) toDelete.set(message.id, message);
      else if (type === "BOT" && message.author.bot) toDelete.set(message.id, message);
      else if (type === "LINK" && containsLink(message.content)) toDelete.set(message.id, message);
      else if (type === "TOKEN" && message.content.includes(argument)) toDelete.set(message.id, message);
      else if (type === "USER" && message.author.id === argument) toDelete.set(message.id, message);
    }

    if (toDelete.size === 0) return "NO_MESSAGES";

    const deletedMessages = await channel.bulkDelete(toDelete, true);
    await logModeration(issuer, issuer, "", "Purge", {
      purgeType: type,
      channel: channel,
      deletedCount: deletedMessages.size,
    });

    return deletedMessages.size;
  } catch (ex) {
    error("purgeMessages", ex);
    return "ERROR";
  }
}

/**
 * Warn
 */
async function warnTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";

  try {
    logModeration(issuer, target, reason, "Warn");
    const memberDb = await getMember(issuer.guild.id, target.id);
    memberDb.warnings += 1;
    const settings = await getSettings(issuer.guild);

    if (memberDb.warnings >= settings.max_warn.limit) {
      await addModAction(issuer.guild.members.me, target, "Max warnings reached", settings.max_warn.action);
      memberDb.warnings = 0;
    }

    await memberDb.save();
    return true;
  } catch (ex) {
    error("warnTarget", ex);
    return "ERROR";
  }
}

/**
 * Timeout / Mute
 */
async function timeoutTarget(issuer, target, minutes, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (target.communicationDisabledUntilTimestamp && target.communicationDisabledUntilTimestamp > Date.now())
    return "ALREADY_TIMEOUT";

  try {
    await target.timeout(minutes * 60 * 1000, reason);
    logModeration(issuer, target, reason, "Timeout", { minutes });
    return true;
  } catch (ex) {
    error("timeoutTarget", ex);
    return "ERROR";
  }
}

/**
 * Untimeout
 */
async function unTimeoutTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.communicationDisabledUntilTimestamp || target.communicationDisabledUntilTimestamp < Date.now())
    return "NO_TIMEOUT";

  try {
    await target.timeout(null, reason);
    logModeration(issuer, target, reason, "UnTimeout");
    return true;
  } catch (ex) {
    error("unTimeoutTarget", ex);
    return "ERROR";
  }
}

/**
 * Kick
 */
async function kickTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";

  try {
    await target.kick(reason);
    logModeration(issuer, target, reason, "Kick");
    return true;
  } catch (ex) {
    error("kickTarget", ex);
    return "ERROR";
  }
}

/**
 * Softban
 */
async function softbanTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";

  try {
    await target.ban({ days: 7, reason });
    await issuer.guild.members.unban(target.user);
    logModeration(issuer, target, reason, "Softban");
    return true;
  } catch (ex) {
    error("softbanTarget", ex);
    return "ERROR";
  }
}

/**
 * Ban
 */
async function banTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";

  try {
    await target.ban({ reason });
    logModeration(issuer, target, reason, "Ban");
    return true;
  } catch (ex) {
    error("banTarget", ex);
    return "ERROR";
  }
}

/**
 * Voice mute
 */
async function vMuteTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice.channel) return "NO_VOICE";
  if (target.voice.serverMute) return "ALREADY_MUTED";

  try {
    await target.voice.setMute(true, reason);
    logModeration(issuer, target, reason, "Vmute");
    return true;
  } catch (ex) {
    error("vMuteTarget", ex);
    return "ERROR";
  }
}

async function vUnmuteTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice.channel) return "NO_VOICE";
  if (!target.voice.serverMute) return "NOT_MUTED";

  try {
    await target.voice.setMute(false, reason);
    logModeration(issuer, target, reason, "Vunmute");
    return true;
  } catch (ex) {
    error("vUnmuteTarget", ex);
    return "ERROR";
  }
}

async function deafenTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice.channel) return "NO_VOICE";
  if (target.voice.serverDeaf) return "ALREADY_DEAFENED";

  try {
    await target.voice.setDeaf(true, reason);
    logModeration(issuer, target, reason, "Deafen");
    return true;
  } catch (ex) {
    error("deafenTarget", ex);
    return "ERROR";
  }
}

async function unDeafenTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice.channel) return "NO_VOICE";
  if (!target.voice.serverDeaf) return "NOT_DEAFENED";

  try {
    await target.voice.setDeaf(false, reason);
    logModeration(issuer, target, reason, "UnDeafen");
    return true;
  } catch (ex) {
    error("unDeafenTarget", ex);
    return "ERROR";
  }
}

async function disconnectTarget(issuer, target, reason) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice.channel) return "NO_VOICE";

  try {
    await target.voice.disconnect(reason);
    logModeration(issuer, target, reason, "Disconnect");
    return true;
  } catch (ex) {
    error("disconnectTarget", ex);
    return "ERROR";
  }
}

async function moveTarget(issuer, target, reason, channel) {
  if (!memberInteract(issuer, target)) return "MEMBER_PERM";
  if (!memberInteract(issuer.guild.members.me, target)) return "BOT_PERM";
  if (!target.voice?.channel) return "NO_VOICE";
  if (target.voice.channelId === channel.id) return "ALREADY_IN_CHANNEL";

  if (!channel.permissionsFor(target).has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect]))
    return "TARGET_PERM";

  try {
    await target.voice.setChannel(channel, reason);
    logModeration(issuer, target, reason, "Move", { channel });
    return true;
  } catch (ex) {
    error("moveTarget", ex);
    return "ERROR";
  }
}

module.exports = {
  memberInteract,
  addModAction,
  warnTarget,
  purgeMessages,
  timeoutTarget,
  unTimeoutTarget,
  kickTarget,
  softbanTarget,
  banTarget,
  vMuteTarget,
  vUnmuteTarget,
  deafenTarget,
  unDeafenTarget,
  disconnectTarget,
  moveTarget,
};
