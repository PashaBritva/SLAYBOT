const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Stop extends Command {
  constructor(client) {
    super(client, {
      name: "stop",
      description: "stop the music player",
      category: "MUSIC",
      validations: musicValidations,
      command: {
        enabled: true,
      },
      slashCommand: {
        enabled: true,
      },
    });
  }

  /**
   * @param {Message} message
   */
  async messageRun(message) {
    const response = await stop(message);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await stop(interaction);
    await interaction.followUp(response);
  }
};

async function stop({ client, guildId }) {
  const player = client.musicManager.get(guildId);

  if (!player) {
    return "> ❌ There is no active music player for this server.";
  }

  player.destroy();
  return "> 🛑 The music player has been stopped and the queue has been cleared.";
}
