const { Command } = require("@src/structures");
const { musicValidations } = require("@utils/botUtils");

module.exports = class Resume extends Command {
  constructor(client) {
    super(client, {
      name: "resume",
      description: "resumes the music player",
      category: "MUSIC",
      validations: musicValidations,
      command: { enabled: true },
      slashCommand: { enabled: true },
    });
  }

  async messageRun(message) {
    await message.reply(resumePlayer(message));
  }

  async interactionRun(interaction) {
    await interaction.followUp(resumePlayer(interaction));
  }
};

function resumePlayer({ client, guildId }) {
  const player = client.musicManager.get(guildId);
  if (!player.paused) return "> The player is already resumed";
  player.pause(false);
  return "> ▶️ Resumed the music player";
}
