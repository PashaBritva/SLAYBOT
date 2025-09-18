const { Command } = require("@src/structures");
const { EmbedBuilder, PermissionsBitField, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const moment = require("moment");

module.exports = class UrbanCommand extends Command {
  constructor(client) {
    super(client, {
      name: "urban",
      description: "Searches the Urban Dictionary",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: [PermissionsBitField.Flags.EmbedLinks],
      command: {
        enabled: true,
        usage: "<word>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "word",
            description: "The word for which you want the urban meaning",
            type: 3,
            required: true,
          },
        ],
      },
    });
  }

  /** @param {Message} message @param {string[]} args */
  async messageRun(message, args) {
    const word = args.join(" ");
    const response = await urban(word);
    await message.reply(response);
  }

  /** @param {CommandInteraction} interaction */
  async interactionRun(interaction) {
    const word = interaction.options.getString("word");
    const response = await urban(word);
    await interaction.followUp(response);
  }
};

async function urban(word) {
  const response = await getJson(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`);
  if (!response.data || !response.data.list) return MESSAGES.API_ERROR;

  const data = response.data.list[0];
  if (!data) return `Nothing found matching \`${word}\``;

  const embed = new EmbedBuilder()
    .setTitle(data.word)
    .setURL(data.permalink)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`**Definition**\n\`\`\`css\n${data.definition}\`\`\``)
    .addFields(
      { name: "Author", value: data.author, inline: true },
      { name: "ID", value: data.defid.toString(), inline: true },
      { name: "Likes / Dislikes", value: `👍 ${data.thumbs_up} | 👎 ${data.thumbs_down}`, inline: true },
      { name: "Example", value: data.example || "NA", inline: false }
    )
    .setFooter({ text: `Created ${moment(data.written_on).fromNow()}` });

  return { embeds: [embed] };
}
