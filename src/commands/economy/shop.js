const { Command } = require("@src/structures");
const { MessageEmbed, Permissions } = require("discord.js");

const additem = require("./sub/shop/additem");
const removeitem = require("./sub/shop/removeitem");
const listitems = require("./sub/shop/listitems");
const buy = require("./sub/shop/buy");
const sell = require("./sub/shop/sell");
const ServerShop = require("@schemas/Shop");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

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
          { trigger: "additem <name> <price> [role]", description: "Add an item to the server shop" },
          { trigger: "removeitem <name>", description: "Remove an item from the server shop" },
          { trigger: "list", description: "Show all items in the server shop" },
          { trigger: "buy <name>", description: "Buy an item from the server shop" },
          { trigger: "sell <name>", description: "Sell an item back to the server shop" },
          { trigger: "balance", description: "Check shop balance" },
          { trigger: "withdraw <amount>", description: "Withdraw from shop balance (max 100000)" },
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
              { name: "role", description: "Role to give (optional)", type: "ROLE", required: false },
              { name: "duration", description: "Timestamp to role (optional)", type: "INTEGER", required: false },
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
          {
            name: "balance",
            description: "Store balance",
            type: "SUB_COMMAND",
          },
          {
            name: "withdraw",
            description: "Balance withdrawal",
            type: "SUB_COMMAND",
            options: [
              { name: "amount", description: "up to 100.000", type: "INTEGER", required: true }
            ]
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const sub = args[0].toLowerCase();

    if ((sub === "additem" || sub === "removeitem") && 
        !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return this.errorEmbed("You need administrator permissions to use this command");
    }

    if (sub === "additem") {
      if (args.length < 3) 
        return this.errorEmbed("Usage: shop additem <name> <price> [role]", message);
      
      const name = args[1];
      const price = parseInt(args[2]);
      let roleId = null;
      
      if (args[3]) {
        const roleArg = args[3];
        if (roleArg.startsWith('<@&') && roleArg.endsWith('>')) {
          roleId = roleArg.slice(3, -1);
        } else {
          roleId = roleArg;
        }
      }
      
      if (isNaN(price)) return this.errorEmbed("Price must be a valid number", message);
      if (price < 0) return this.errorEmbed("Price cannot be negative", message);
      
      const response = await additem(message.guild.id, name, price, roleId, duration ? parseInt(duration) : null);

      return message.reply({ embeds: [response] });
    }

    else if (sub === "removeitem") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      const response = await removeitem(message.guild.id, args[1]);
      return message.reply({ embeds: [response] });
    }

    else if (sub === "list") {
      const response = await listitems(message.guild.id);
      return message.reply({ embeds: [response] });
    }

    else if (sub === "buy") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      const response = await buy(message.guild.id, message.author, args[1]);
      return message.reply({ embeds: [response] });
    }

    else if (sub === "sell") {
      if (args.length < 2) 
        return this.errorEmbed("You must provide an item name", message);
      const response = await sell(message.guild.id, message.author, args[1]);
      return message.reply({ embeds: [response] });
    }

    else if (sub === "balance") {
      const shop = await ServerShop.findOne({ guildId: message.guild.id });
      const balance = shop?.balance || 0;
      const response = new MessageEmbed()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle("🏪 Shop Balance")
        .setDescription(`Shop balance: **${balance}**${ECONOMY.CURRENCY}`);
      return message.reply({ embeds: [response] });
    }

    else if (sub === "withdraw") {
      if (args.length < 2) 
        return this.errorEmbed("Usage: shop withdraw <amount>", message);
      
      const amount = parseInt(args[1]);
      
      if (isNaN(amount)) return this.errorEmbed("Amount must be a valid number", message);
      if (amount <= 0) return this.errorEmbed("Amount must be positive", message);
      if (amount > 100000) return this.errorEmbed("Maximum amount is 100000", message);
      
      let shop = await ServerShop.findOne({ guildId: message.guild.id });
      if (!shop) {
        shop = new ServerShop({ guildId: message.guild.id, items: [], balance: 0 });
      }
      
      if (shop.balance < amount) {
        return this.errorEmbed(`Shop balance is only ${shop.balance}${ECONOMY.CURRENCY}`);
      }
      
      shop.balance -= amount;
      await shop.save();
      
      const userDoc = await getUser(message.author.id);
      userDoc.coins += amount;
      await userDoc.save();
      
      const response = new MessageEmbed()
        .setColor("GREEN")
        .setTitle("✅ Withdraw Successful")
        .setDescription(`Withdrawn **${amount}**${ECONOMY.CURRENCY} from shop balance\nYour new balance: **${userDoc.coins}**${ECONOMY.CURRENCY}`);
      return message.reply({ embeds: [response] });
    }

    else {
      return this.errorEmbed("Invalid subcommand. Use `shop` to see available commands.", message);
    }
  }

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    if ((sub === "additem" || sub === "removeitem") && 
        !interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      const response = this.errorEmbed("You need administrator permissions to use this command");
      return interaction.followUp({ embeds: [response] });
    }

    if (sub === "additem") {
      const name = interaction.options.getString("name");
      const price = interaction.options.getInteger("price");
      const role = interaction.options.getRole("role");
      const durationValue = interaction.options.getInteger("duration");
      const roleId = role ? role.id : null;
      
      if (price < 0) {
        const response = this.errorEmbed("Price cannot be negative");
        return interaction.followUp({ embeds: [response] });
      }
      
      const response = await additem(interaction.guild.id, name, price, roleId, durationValue);
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "removeitem") {
      const response = await removeitem(interaction.guild.id, interaction.options.getString("name"));
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "list") {
      const response = await listitems(interaction.guild.id);
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "buy") {
      const response = await buy(interaction.guild.id, interaction.user, interaction.options.getString("name"));
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "sell") {
      const response = await sell(interaction.guild.id, interaction.user, interaction.options.getString("name"));
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "balance") {
      const shop = await ServerShop.findOne({ guildId: interaction.guild.id });
      const balance = shop?.balance || 0;
      
      const response = new MessageEmbed()
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTitle("🏪 Shop Balance")
        .setDescription(`Shop balance: **${balance}**${ECONOMY.CURRENCY}`);
      
      return interaction.followUp({ embeds: [response] });
    }

    else if (sub === "withdraw") {
      const amount = interaction.options.getInteger("amount");
      
      if (amount <= 0) {
        const response = this.errorEmbed("Amount must be positive");
        return interaction.followUp({ embeds: [response] });
      }
      if (amount > 100000) {
        const response = this.errorEmbed("Maximum amount is 100000");
        return interaction.followUp({ embeds: [response] });
      }
      
      let shop = await ServerShop.findOne({ guildId: interaction.guild.id });
      if (!shop) {
        shop = new ServerShop({ guildId: interaction.guild.id, items: [], balance: 0 });
      }
      
      if (shop.balance < amount) {
        const response = this.errorEmbed(`Shop balance is only ${shop.balance}${ECONOMY.CURRENCY}`);
        return interaction.followUp({ embeds: [response] });
      }
      
      shop.balance -= amount;
      const userDB = await getUser(interaction.user.id);
      userDB.coins += amount;
      
      await shop.save();
      await userDB.save();
      
      const response = new MessageEmbed()
        .setColor("GREEN")
        .setTitle("✅ Withdraw Successful")
        .setDescription(`Withdrawn **${amount}**${ECONOMY.CURRENCY} from shop balance\nYour new balance: **${userDoc.coins}**${ECONOMY.CURRENCY}`);
      
      return interaction.followUp({ embeds: [response] });
    }
  }

  errorEmbed(description, msg) {
    const embed = new MessageEmbed()
      .setColor("RED")
      .setTitle("❌ Error")
      .setDescription(description)
      .setTimestamp();
    
    if (msg) {
      msg.reply({ embeds: [embed] });
      return embed;
    }
    return embed;
  }
};