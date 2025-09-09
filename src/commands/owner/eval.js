const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Eval extends Command {
  constructor(client) {
    super(client, {
      name: "eval",
      description: "Evaluates JavaScript code",
      category: "OWNER",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<script>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "code",
            description: "Code to evaluate",
            type: "STRING",
            required: true,
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    if (!this.client.config.OWNER_IDS.includes(message.author.id)) {
      return message.reply("❌ You don't have permission to use this command!");
    }

    const input = args.join(" ");

    if (!input) return message.reply("Please provide code to eval");
    
    if (input.toLowerCase().includes("token") || 
        input.includes(process.env.BOT_TOKEN) ||
        input.includes("process.env")) {
      return message.reply("❌ Don't try to hack me!");
    }

    let response;
    try {
      const output = eval(input);
      response = buildSuccessResponse(output);
    } catch (ex) {
      response = buildErrorResponse(ex);
    }
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    if (!this.client.config.OWNER_IDS.includes(interaction.user.id)) {
      return interaction.followUp("❌ You don't have permission to use this command!");
    }

    const input = interaction.options.getString("code");
    
    if (input.toLowerCase().includes("token") || 
        input.includes(process.env.BOT_TOKEN) ||
        input.includes("process.env")) {
      return interaction.followUp("❌ Don't try to hack me!");
    }

    let response;
    try {
      const output = eval(input);
      response = buildSuccessResponse(output);
    } catch (ex) {
      response = buildErrorResponse(ex);
    }
    await interaction.followUp(response);
  }
};

const buildSuccessResponse = (output) => {
  const embed = new EmbedBuilder();
  
  let outputStr;
  if (typeof output === "string") {
    outputStr = output;
  } else {
    outputStr = require("util").inspect(output, { depth: 0, maxArrayLength: 100 });
  }

  embed
    .setAuthor({ name: "📤 Output" })
    .setDescription("```js\n" + (outputStr.length > 4096 ? `${outputStr.substring(0, 4000)}...` : outputStr) + "\n```")
    .setColor("GREEN")
    .setTimestamp();

  return { embeds: [embed] };
};

const buildErrorResponse = (err) => {
  const embed = new EmbedBuilder();
  
  let errStr;
  if (typeof err === "string") {
    errStr = err;
  } else {
    errStr = require("util").inspect(err, { depth: 0 });
  }

  embed
    .setAuthor({ name: "📤 Error" })
    .setDescription("```js\n" + (errStr.length > 4096 ? `${errStr.substring(0, 4000)}...` : errStr) + "\n```")
    .setColor(EMBED_COLORS.ERROR)
    .setTimestamp();

  return { embeds: [embed] };
};