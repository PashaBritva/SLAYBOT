const { Command } = require("@src/structures");
const { MessageEmbed } = require("discord.js");

const additem = require("./sub/shop/additem");
const removeitem = require("./sub/shop/removeitem");
const listitems = require("./sub/shop/listitems");
const buy = require("./sub/shop/buy");
const sell = require("./sub/shop/sell");

module.exports = class ShopCommand extends Command {
  constructor(client) {
    super(client, {
      name: "shop",
      description: "Server shop system",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          { trigger: "additem <name> <price>", description: "Add an item to the server shop" },
          { trigger: "removeitem <name>", description: "Remove an item from the server shop" },
          { trigger: "list", description: "Show all items in the server shop" },
          { trigger: "buy <name>", description: "Buy an item from the server shop" },
          { trigger: "sell <name>", description: "Sell an item back to the server shop" },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "additem",
            description: "Add an item to the shop",
            type: "SUB_COMMAND",
            options: [
              { name: "name", description: "Item name", type: "STRING", required: true },
              { name: "price", description: "Item price", type: "INTEGER", required: true },
            ],
          },
          {
            name: "removeitem",
            description: "Remove an item from the shop",
            type: "SUB_COMMAND",
            options: [
              { name: "name", description: "Item name", type: "STRING", required: true },
            ],
          },
          {
            name: "list",
            description: "List all shop items",
            type: "SUB_COMMAND",
          },
          {
            name: "buy",
            description: "Buy an item from the shop",
            type: "SUB_COMMAND",
            options: [
              { name: "name", description: "Item name", type: "STRING", required: true },
            ],
          },
          {
            name: "sell",
            description: "Sell an item back to the shop",
            type: "SUB_COMMAND",
            options: [
              { name: "name", description: "Item name", type: "STRING", required: true },
            ],
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const sub = args[0];
    let response;

    if ((sub === "additem" || sub === "removeitem") && !message.member.permissions.has("ADMINISTRATOR")) {
      return this.errorEmbed("You need administrator permissions to use this command", message);
    }

    if (sub === "additem") {
      if (args.length < 3) 
        return this.errorEmbed("You must provide an item name and price", message);
      const name = args[1];
      const price = parseInt(args[2]);
      if (isNaN(price)) return this.errorEmbed("Price must be a valid number", message);
      response = await additem(message.guild.id, name, price);
    }

    else if (sub === "removeitem") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      response = await removeitem(message.guild.id, args[1]);
    }

    else if (sub === "list") {
      response = await listitems(message.guild.id);
    }

    else if (sub === "buy") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      response = await buy(message.guild.id, message.author, args[1]);
    }

    else if (sub === "sell") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      response = await sell(message.guild.id, message.author, args[1]);
    }

    else {
      return this.errorEmbed("Invalid subcommand", message);
    }

    await message.reply({ embeds: [response] });
  }

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    if (sub === "additem") {
      response = await additem(interaction.guild.id, interaction.options.getString("name"), interaction.options.getInteger("price"));
    }

    else if (sub === "removeitem") {
      response = await removeitem(interaction.guild.id, interaction.options.getString("name"));
    }

    else if (sub === "list") {
      response = await listitems(interaction.guild.id);
    }

    else if (sub === "buy") {
      response = await buy(interaction.guild.id, interaction.user, interaction.options.getString("name"));
    }

    else if (sub === "sell") {
      response = await sell(interaction.guild.id, interaction.user, interaction.options.getString("name"));
    }

    await interaction.followUp({ embeds: [response] });
  }

  successEmbed(description) {
    return new MessageEmbed()
      .setColor("GREEN")
      .setTitle("✅ Success")
      .setDescription(description)
      .setTimestamp();
  }

  errorEmbed(description, msg) {
    const embed = new MessageEmbed()
      .setColor("RED")
      .setTitle("❌ Error")
      .setDescription(description)
      .setTimestamp();
    if (msg) msg.reply({ embeds: [embed] });
    return embed;
  }
};
