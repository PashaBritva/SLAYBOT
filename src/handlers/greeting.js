const { EmbedBuilder } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { sendMessage } = require("@utils/botUtils");

/**
 * Parses mentions (<@ID>, <@&ID>, <#ID>) in the text
 * @param {string} text 
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<string>}
 */
async function parseMentions(text, guild) {
  text = text.replace(/<@!?(\d+)>/g, (match, id) => {
    const user = guild.client.users.cache.get(id);
    return user ? `<@${user.id}>` : match;
  });

  text = text.replace(/<@&(\d+)>/g, (match, id) => {
    const role = guild.roles.cache.get(id);
    return role ? role.toString() : match;
  });

  text = text.replace(/<#(\d+)>/g, (match, id) => {
    const channel = guild.channels.cache.get(id);
    return channel ? channel.toString() : match;
  });

  return text;
}

/**
 * Parses content with variables for welcome/farewell messages
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function parseContent(content, member, inviterData = {}) {
  const inviteData = {};
  const getEffectiveInvites = (inviteData = {}) =>
    (inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left) || 0;

  if (content.includes("{inviter:")) {
    const inviterId = inviterData.member_id || "NA";
    if (inviterId !== "VANITY" && inviterId !== "NA") {
      try {
        const inviter = await member.client.users.fetch(inviterId);
        inviteData.name = inviter.username;
        inviteData.tag = inviter.tag;
      } catch {
        inviteData.name = "NA";
        inviteData.tag = "NA";
      }
    } else {
      inviteData.name = inviterId;
      inviteData.tag = inviterId;
    }
  }

  let parsed = content
    .replaceAll(/\\n/g, "\n")
    .replaceAll(/{server}/g, member.guild.name)
    .replaceAll(/{count}/g, member.guild.memberCount)
    .replaceAll(/{member}/g, member.toString())
    .replaceAll(/{member:name}/g, member.displayName)
    .replaceAll(/{member:tag}/g, member.user.tag)
    .replaceAll(/{inviter:name}/g, inviteData.name)
    .replaceAll(/{inviter:tag}/g, inviteData.tag)
    .replaceAll(/{invites}/g, getEffectiveInvites(inviterData.invite_data));

  parsed = await parseMentions(parsed, member.guild);
  return parsed;
}

/**
 * Builds a welcome/farewell embed message
 * @param {import('discord.js').GuildMember} member
 * @param {"WELCOME"|"FAREWELL"} type
 * @param {Object} config
 * @param {Object} inviterData
 */
async function buildGreeting(member, type, config, inviterData = {}) {
  if (!config) return null;

  let content;
  if (config.content) content = await parseContent(config.content, member, inviterData);

  const embed = new EmbedBuilder();
  if (config.embed?.description) {
    embed.setDescription(await parseContent(config.embed.description, member, inviterData));
  }
  if (config.embed?.color) embed.setColor(config.embed.color);
  if (config.embed?.thumbnail) embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
  if (config.embed?.footer) {
    embed.setFooter({ text: await parseContent(config.embed.footer, member, inviterData) });
  }

  if (!content && !config.embed?.description && !config.embed?.footer) {
    content =
      type === "WELCOME"
        ? `Welcome to server, ${member} 🎉`
        : `${member.user.tag} leave from server 👋`;
    return { content };
  }

  return { content, embeds: [embed] };
}

/**
 * Sends welcome message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendWelcome(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.welcome;
  if (!config?.enabled) return;

  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  const message = await buildGreeting(member, "WELCOME", config, inviterData);
  if (message) sendMessage(channel, message);
}

/**
 * Sends farewell message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendFarewell(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.farewell;
  if (!config?.enabled) return;

  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  const message = await buildGreeting(member, "FAREWELL", config, inviterData);
  if (message) sendMessage(channel, message);
}

module.exports = {
  buildGreeting,
  sendWelcome,
  sendFarewell,
};
