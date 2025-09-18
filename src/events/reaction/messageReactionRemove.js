const { reactionHandler } = require("@src/handlers");

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

  const { message } = reaction;

  const role = reactionHandler.getRole(reaction);
  if (role) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    await member.roles.remove(role).catch(() => {});
  }
};
