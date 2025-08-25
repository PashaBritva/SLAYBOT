const { MessageEmbed } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { sendMessage } = require("@utils/botUtils");

/**
 * Parses user mentions in the text
 * @param {string} text 
 * @param {import('discord.js').Guild} guild 
 * @returns {Promise<string>}
 */
async function parseMentions(text, guild) {
  // Processing user mentions (<@ID>)
  text = text.replace(/<@!?(\d+)>/g, (match, id) => {
    const user = guild.client.users.cache.get(id);
    return user ? `<@${user.id}>` : match;
  });

  // Handling role mentions (<@&ID>)
  text = text.replace(/<@&(\d+)>/g, (match, id) => {
    const role = guild.roles.cache.get(id);
    return role ? role.toString() : match;
  });

  // Processing channel mentions (<#ID>)
  text = text.replace(/<#(\d+)>/g, (match, id) => {
    const channel = guild.channels.cache.get(id);
    return channel ? channel.toString() : match;
  });

  return text;
}

/**
 * Parses the message content with variable substitution
 * @param {string} content
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
const parse = async (content, member, inviterData = {}) => {
  const inviteData = {};

  const getEffectiveInvites = (inviteData = {}) =>
    inviteData.tracked + inviteData.added - inviteData.fake - inviteData.left || 0;

  if (content.includes("{inviter:")) {
    const inviterId = inviterData.member_id || "NA";
    if (inviterId !== "VANITY" && inviterId !== "NA") {
      try {
        const inviter = await member.client.users.fetch(inviterId);
        inviteData.name = inviter.username;
        inviteData.tag = inviter.tag;
      } catch (ex) {
        member.client.logger.error(`Parsing inviterId: ${inviterId}`, ex);
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
};

/**
 * Builds a welcome/farewall message
 * @param {import('discord.js').GuildMember} member
 * @param {"WELCOME"|"FAREWELL"} type
 * @param {Object} config
 * @param {Object} inviterData
 */
const buildGreeting = async (member, type, config, inviterData) => {
  if (!config) return;
  let content;

  // Build content
  if (config.content) content = await parse(config.content, member, inviterData);

  // Build embed
  const embed = new MessageEmbed();
  if (config.embed?.description) {
    embed.setDescription(await parse(config.embed.description, member, inviterData));
  }
  if (config.embed?.color) embed.setColor(config.embed.color);
  if (config.embed?.thumbnail) embed.setThumbnail(member.user.displayAvatarURL());
  if (config.embed?.footer) {
    embed.setFooter({ text: await parse(config.embed.footer, member, inviterData) });
  }

  // Default message
  if (!config.content && !config.embed?.description && !config.embed?.footer) {
    content =
      type === "WELCOME"
        ? `Добро пожаловать на сервер, ${member} 🎉`
        : `${member.user.tag} покинул(а) сервер 👋`;
    return { content };
  }

  return { content, embeds: [embed] };
};

/**
 * Sends a welcome message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendWelcome(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.welcome;
  if (!config || !config.enabled) return;

  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  const response = await buildGreeting(member, "WELCOME", config, inviterData);
  sendMessage(channel, response);
}

/**
 * Sends a farewell message
 * @param {import('discord.js').GuildMember} member
 * @param {Object} inviterData
 */
async function sendFarewell(member, inviterData = {}) {
  const config = (await getSettings(member.guild))?.farewell;
  if (!config || !config.enabled) return;

  const channel = member.guild.channels.cache.get(config.channel);
  if (!channel) return;

  const response = await buildGreeting(member, "FAREWELL", config, inviterData);
  sendMessage(channel, response);
}

module.exports = {
  buildGreeting,
  sendWelcome,
  sendFarewell,
};