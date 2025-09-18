const { reactionHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");
const { getCountryFromFlag } = require("@utils/miscUtils");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').MessageReaction|import('discord.js').PartialMessageReaction} reaction
 * @param {import('discord.js').User|import('discord.js').PartialUser} user
 */
module.exports = async (client, reaction, user) => {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  if (user.partial) await user.fetch();
  if (user.bot) return;

  const { message, emoji } = reaction;

  const role = reactionHandler.getRole(reaction);
  if (role) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member) await member.roles.add(role).catch(() => {});
  }

  if (!emoji.id && message.content) {
    const settings = await getSettings(message.guild);
    if (settings.flag_translation?.enabled) {
      const countryCode = getCountryFromFlag(emoji.name);
      if (countryCode) reactionHandler.handleFlagReaction(countryCode, message, user);
    }
  }
};
