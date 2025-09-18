const { EmbedBuilder } = require("discord.js");
const { sendMessage, safeDM } = require("@utils/botUtils");
const { containsLink, containsDiscordInvite } = require("@utils/miscUtils");
const { getMember } = require("@schemas/Member");
const { addModAction } = require("@utils/modUtils");
const { EMBED_COLORS } = require("@root/config");

/**
 * Determines if a message should be moderated
 * @param {import('discord.js').Message} message
 */
const shouldModerate = (message) => {
  const { member, guild, channel } = message;

  if (!channel.permissionsFor(guild.members.me).has("MANAGE_MESSAGES")) return false;

  if (member.permissions.has(["KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_GUILD"])) return false;

  if (channel.permissionsFor(member).has("MANAGE_MESSAGES")) return false;

  return true;
};

/**
 * Performs automod checks on a message
 * @param {import('discord.js').Message} message
 * @param {Object} settings
 */
async function performAutomod(message, settings) {
  const { automod } = settings;
  if (!automod?.debug && !shouldModerate(message)) return;

  const { channel, content, author, mentions } = message;
  const logChannel = settings.modlog_channel ? channel.guild.channels.cache.get(settings.modlog_channel) : null;

  let shouldDelete = false;
  let strikesTotal = 0;
  const embed = new EmbedBuilder();

  if (mentions.members.size > automod.max_mentions) {
    embed.addFields({ name: "Mentions", value: `${mentions.members.size}/${automod.max_mentions}`, inline: true });
    strikesTotal += mentions.members.size - automod.max_mentions;
  }

  if (mentions.roles.size > automod.max_role_mentions) {
    embed.addFields({ name: "Role Mentions", value: `${mentions.roles.size}/${automod.max_role_mentions}`, inline: true });
    strikesTotal += mentions.roles.size - automod.max_role_mentions;
  }

  if (automod.max_lines > 0) {
    const lineCount = content.split("\n").length;
    if (lineCount > automod.max_lines) {
      embed.addFields({ name: "New Lines", value: `${lineCount}/${automod.max_lines}`, inline: true });
      shouldDelete = true;
      strikesTotal += Math.ceil((lineCount - automod.max_lines) / automod.max_lines);
    }
  }

  if (automod.anti_links && containsLink(content)) {
    embed.addFields({ name: "Links Found", value: "✓", inline: true });
    shouldDelete = true;
    strikesTotal += 1;
  }

  if (!automod.anti_links && automod.anti_scam && containsLink(content)) {
    const key = `${author.id}|${message.guildId}`;
    if (message.client.antiScamCache.has(key)) {
      const antiScamInfo = message.client.antiScamCache.get(key);
      if (antiScamInfo.channelId !== message.channelId && antiScamInfo.content === content && Date.now() - antiScamInfo.timestamp < 2000) {
        embed.addFields({ name: "AntiScam Detection", value: "✓", inline: true });
        shouldDelete = true;
        strikesTotal += 1;
      }
    } else {
      message.client.antiScamCache.set(key, { channelId: message.channelId, content, timestamp: Date.now() });
    }
  }

  if (!automod.anti_links && automod.anti_invites && containsDiscordInvite(content)) {
    embed.addFields({ name: "Discord Invites", value: "✓", inline: true });
    shouldDelete = true;
    strikesTotal += 1;
  }

  if (shouldDelete && message.deletable) {
    message.delete().catch(() => {});
    sendMessage(channel, "> Auto-Moderation! Message deleted", 5);
  }

  if (strikesTotal > 0) {
    const memberDb = await getMember(message.guildId, author.id);
    memberDb.strikes += strikesTotal;

    embed
      .setAuthor({ name: "Auto Moderation" })
      .setThumbnail(author.displayAvatarURL())
      .setColor(EMBED_COLORS.AUTOMOD)
      .setDescription(`**Channel:** ${channel.toString()}`)
      .setFooter({ text: `By ${author.tag} | ${author.id}`, iconURL: author.avatarURL() });

    if (logChannel) sendMessage(logChannel, { embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.AUTOMOD)
      .setThumbnail(message.guild.iconURL())
      .setAuthor({ name: "Auto Moderation" })
      .setDescription(
        `You have received ${strikesTotal} strike(s)!\n\n` +
          `**Guild:** ${message.guild.name}\n` +
          `**Total Strikes:** ${memberDb.strikes} / ${automod.strikes}`
      );

    embed.data.fields?.forEach((field) => dmEmbed.addFields({ name: field.name, value: field.value, inline: true }));
    safeDM(author, { embeds: [dmEmbed] });

    if (memberDb.strikes >= automod.strikes) {
      await addModAction(message.guild.members.me, message.member, "Automod: Max strikes received", automod.action);
      memberDb.strikes = 0;
    }

    await memberDb.save();
  }
}

module.exports = {
  performAutomod,
};
