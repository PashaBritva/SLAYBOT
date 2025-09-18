const { Command } = require("@src/structures");
const { getBuffer } = require("@utils/httpUtils");
const { AttachmentBuilder } = require("discord.js");

const PROXY_TYPES = ["all", "http", "socks4", "socks5"];

module.exports = class ProxiesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "proxies",
      description: "Fetch fresh proxies (http, socks4, socks5)",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EmbedLinks", "AttachFiles"],
      command: {
        enabled: true,
        usage: "[type]",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "type",
            description: "Type of proxy",
            type: 3,
            required: true,
            choices: PROXY_TYPES.map((t) => ({ name: t, value: t })),
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
    let type = "all";

    if (args[0]) {
      if (PROXY_TYPES.includes(args[0].toLowerCase())) {
        type = args[0].toLowerCase();
      } else {
        return message.reply("❌ Incorrect type. Use: `http`, `socks4`, `socks5`");
      }
    }

    const waitMsg = await message.channel.send("⏳ Fetching proxies...");
    const response = await getProxies(type);
    if (waitMsg.deletable) await waitMsg.delete();
    return message.reply(response);
  }

  /**
   * @param {import("discord.js").CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const type = interaction.options.getString("type");
    await interaction.followUp("⏳ Fetching proxies...");
    const response = await getProxies(type);
    return interaction.editReply(response);
  }
};

async function getProxies(type) {
  const response = await getBuffer(
    `https://api.proxyscrape.com/?request=displayproxies&proxytype=${type}&timeout=10000&country=all&anonymity=all&ssl=all`
  );

  if (!response.success || !response.buffer) {
    return "❌ Failed to fetch proxies";
  }
  if (response.buffer.length === 0) {
    return "⚠️ No proxies found. Try again later.";
  }

  const file = new AttachmentBuilder(response.buffer, {
    name: `${type}_proxies.txt`,
  });

  return {
    content: `✅ ${type.toUpperCase()} proxies fetched successfully!`,
    files: [file],
  };
}
