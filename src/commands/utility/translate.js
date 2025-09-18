const { Command } = require("@src/structures");
const { EmbedBuilder, Message, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { translate } = require("@utils/httpUtils");
const { GOOGLE_TRANSLATE } = require("@src/data.json");

const choices = ["ar","cs","de","en","fa","fr","hi","hr","it","ja","ko","la","nl","pl","ru","ta","te"];

module.exports = class TranslateCommand extends Command {
  constructor(client) {
    super(client, {
      name: "translate",
      description: "Translate from one language to another",
      cooldown: 20,
      category: "UTILITY",
      botPermissions: ["EmbedLinks"],
      command: {
        enabled: true,
        aliases: ["tr"],
        usage: "<iso-code> <message>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "language",
            description: "Translation language",
            type: 3,
            required: true,
            choices: choices.map(c => ({ name: GOOGLE_TRANSLATE[c], value: c })),
          },
          {
            name: "text",
            description: "The text to translate",
            type: 3,
            required: true,
          },
        ],
      },
    });
  }

  /** @param {Message} message @param {string[]} args */
  async messageRun(message, args) {
    const outputCode = args.shift();
    if (!GOOGLE_TRANSLATE[outputCode]) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.WARNING)
            .setDescription(
              "Invalid translation code. See [here](https://cloud.google.com/translate/docs/languages) for supported codes"
            ),
        ],
      });
    }

    const input = args.join(" ");
    if (!input) return message.reply("Provide some valid translation text");

    const response = await getTranslation(message.author, input, outputCode);
    await message.reply(response);
  }

  /** @param {CommandInteraction} interaction */
  async interactionRun(interaction) {
    const outputCode = interaction.options.getString("language");
    const input = interaction.options.getString("text");

    const response = await getTranslation(interaction.user, input, outputCode);
    await interaction.followUp(response);
  }
};

async function getTranslation(author, input, outputCode) {
  const data = await translate(input, outputCode);
  if (!data) return "Failed to translate your text";

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${author.username} says`, iconURL: author.displayAvatarURL() })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(data.output)
    .setFooter({ text: `${data.inputLang} (${data.inputCode}) ⟶ ${data.outputLang} (${data.outputCode})` });

  return { embeds: [embed] };
}
