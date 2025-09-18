const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Shuffle extends Command {
  constructor(client) {
    super(client, {
      name: "shuffle",
      description: "shuffle the queue",
      category: "MUSIC",
      validations: musicValidations,
      command: { enabled: true },
      slashCommand: { enabled: true },
    });
  }

  async messageRun(message) {
    const response = await shuffle(message);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const response = await shuffle(interaction);
    await interaction.followUp(response);
  }
};

async function shuffle({ client, guildId }) {
  const player = client.musicManager.get(guildId);

  if (!player) return "> ❌ There is no active music player.";
  if (!player.queue || !player.queue.length) return "> ❌ There are no songs in the queue to shuffle.";

  player.queue.shuffle();
  return "> 🎶 Queue has been shuffled!";
}
