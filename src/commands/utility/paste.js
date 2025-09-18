const { Command } = require("@src/structures");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { postToBin } = require("@utils/httpUtils");

module.exports = class PasteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "paste",
      description: "Paste something to sourceb.in",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EmbedLinks"],
      command: {
        enabled: true,
        minArgsCount: 2,
        usage: "<title> <content>",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "title",
            description: "Title for your paste",
            required: true,
            type: ApplicationCommandOptionType.String,
          },
          {
            name: "content",
            description: "Content to be pasted",
            required: true,
            type: ApplicationCommandOptionType.String,
          },
        ],
      },
    });
  }

  /**
   * @param {import("discord.js").Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const title = args.shift();
    const content = args.join(" ");
    const response = await paste(content, title);
    return message.reply(response);
  }

  /**
   * @param {import("discord.js").CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const title = interaction.options.getString("title");
    const content = interaction.options.getString("content");
    const response = await paste(content, title);
    return interaction.followUp(response);
  }
};

async function paste(content, title) {
  const response = await postToBin(content, title);
  if (!response) return "❌ Something went wrong while creating paste";

  const embed = new EmbedBuilder()
    .setTitle("📑 Paste Created")
    .setColor("Random")
    .setDescription(`🔸 [View Online](${response.url})\n🔹 [Raw](${response.raw})`);

  return { embeds: [embed] };
}
