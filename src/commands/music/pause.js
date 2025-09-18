const { Command } = require("@src/structures");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Pause extends Command {
  constructor(client) {
    super(client, {
      name: "pause",
      description: "pause the music player",
      category: "MUSIC",
      validations: musicValidations,
      command: { enabled: true },
      slashCommand: { enabled: true },
    });
  }

  async messageRun(message) {
    await message.reply(togglePause(message, true));
  }

  async interactionRun(interaction) {
    await interaction.followUp(togglePause(interaction, true));
  }
};

function togglePause({ client, guildId }, pauseState) {
  const player = client.musicManager.get(guildId);
  if (!player) return "> 🚫 There is no active music player in this guild.";
  if (player.paused === pauseState) return `> The player is already ${pauseState ? "paused" : "resumed"}.`;

  player.pause(pauseState);
  return pauseState ? "> ⏸️ Paused the music player." : "> ▶️ Resumed the music player.";
}
