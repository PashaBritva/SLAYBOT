const { Guild, TextChannel, VoiceChannel, Message, Role, PermissionsBitField } = require("discord.js");

const ROLE_MENTION = /<?@?&?(\d{17,20})>?/;
const MEMBER_MENTION = /<?@?!?(\d{17,20})>?/;
const CHANNEL_MENTION = /<?#?(\d{17,20})>?/;

/**
 * @param {Guild} guild
 * @param {string} name
 */
function getRoleByName(guild, name) {
  return guild.roles.cache.find((role) => role.name.toLowerCase() === name.toLowerCase());
}

/**
 * @param {TextChannel} channel
 */
function canSendEmbeds(channel) {
  if (!channel || !(channel instanceof TextChannel)) return false;
  const me = channel.guild.members.me;
  if (!me) return false;

  return channel.permissionsFor(me).has([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
  ]);
}

/**
 * @param {Guild} guild
 * @param {string} query
 */
function getMatchingChannel(guild, query) {
  if (!guild || !query || typeof query !== "string") return [];

  const patternMatch = query.match(CHANNEL_MENTION);
  if (patternMatch) {
    const id = patternMatch[1];
    const channel = guild.channels.cache.get(id);
    if (channel) return [channel];
  }

  const exact = [];
  const startsWith = [];
  const includes = [];
  guild.channels.cache.forEach((ch) => {
    const lowerName = ch.name.toLowerCase();
    if (ch.name === query) exact.push(ch);
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(ch);
    if (lowerName.includes(query.toLowerCase())) includes.push(ch);
  });

  if (exact.length > 0) return exact;
  if (startsWith.length > 0) return startsWith;
  if (includes.length > 0) return includes;
  return [];
}

/**
 * @param {VoiceChannel} vc
 * @param {string} name
 */
async function setVoiceChannelName(vc, name) {
  if (vc.manageable) {
    vc.setName(name).catch((err) => vc.client.logger?.log("Set Name error:", err));
  }
}

/**
 * @param {Guild} guild
 */
async function getMemberStats(guild) {
  const all = await guild.members.fetch({ force: false, cache: false });
  const total = all.size;
  const bots = all.filter((mem) => mem.user.bot).size;
  const members = total - bots;
  return [total, bots, members];
}

/**
 * @param {Guild} guild
 * @param {string} query
 * @return {Role[]}
 */
function findMatchingRoles(guild, query) {
  if (!guild || !query || typeof query !== "string") return [];

  const patternMatch = query.match(ROLE_MENTION);
  if (patternMatch) {
    const id = patternMatch[1];
    const role = guild.roles.cache.get(id);
    if (role) return [role];
  }

  const exact = [];
  const startsWith = [];
  const includes = [];
  guild.roles.cache.forEach((role) => {
    const lowerName = role.name.toLowerCase();
    if (role.name === query) exact.push(role);
    if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role);
    if (lowerName.includes(query.toLowerCase())) includes.push(role);
  });
  if (exact.length > 0) return exact;
  if (startsWith.length > 0) return startsWith;
  if (includes.length > 0) return includes;
  return [];
}

/**
 * @param {Message} message
 * @param {string} query
 * @param {Boolean} exact
 */
async function resolveMember(message, query, exact = false) {
  if (!message || !query || typeof query !== "string") return;
  const memberManager = message.guild.members;

  const patternMatch = query.match(MEMBER_MENTION);
  if (patternMatch) {
    const id = patternMatch[1];

    const mentioned = message.mentions.members.get(id);
    if (mentioned) return mentioned;

    const fetched = await memberManager.fetch({ user: id }).catch(() => null);
    if (fetched) return fetched;
  }

  await memberManager.fetch({ query }).catch(() => null);

  const matchingTags = memberManager.cache.filter((mem) => mem.user.tag === query);
  if (matchingTags.size === 1) return matchingTags.first();

  if (!exact) {
    return memberManager.cache.find(
      (x) =>
        x.user.username === query ||
        x.user.username.toLowerCase().includes(query.toLowerCase()) ||
        x.displayName.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = {
  canSendEmbeds,
  getMatchingChannel,
  setVoiceChannelName,
  getMemberStats,
  findMatchingRoles,
  resolveMember,
  getRoleByName,
};
