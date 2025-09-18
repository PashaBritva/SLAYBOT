const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Skip extends Command {
  constructor(client) {
    super(client, {
      name: "skip",
      description: "skip the current song",
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

  async messageRun(message) {
    const response = await skip(message);
    await message.reply(response);
  }

  async interactionRun(interaction) {
    const response = await skip(interaction);
    await interaction.followUp(response);
  }
};

async function skip({ client, guildId }) {
  const player = client.musicManager.get(guildId);

  if (!player) return "> ❌ There is no active music player.";
  if (!player.queue || !player.queue.current) return "> ❌ There is no song to skip.";

  const { title } = player.queue.current;
  player.stop();

  return `> ⏭️ Skipped: **${title}**`;
}
