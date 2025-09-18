/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (client, invite) => {
  const cachedInvites = client.inviteCache.get(invite?.guild.id);

  if (cachedInvites && cachedInvites.get(invite.code)) {
    cachedInvites.get(invite.code).deletedTimestamp = Date.now();
  }
};
