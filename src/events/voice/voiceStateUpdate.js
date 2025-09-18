const { MUSIC } = require("@root/config");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  const guild = oldState.guild;

  if (oldState.channelId !== guild.me.voice.channelId || newState.channel) return;

  if (oldState.channel.members.size === 1) {
    setTimeout(() => {
      if (!oldState.channel.members.size - 1)
        client.musicManager.get(guild.id) && client.musicManager.get(guild.id).destroy();
    }, MUSIC.IDLE_TIME * 1000);
  }
};
