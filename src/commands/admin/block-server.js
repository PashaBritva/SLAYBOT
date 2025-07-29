// src/commands/admin/block-server.js
const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const BlockedServer = require("@models/BlockedServer");
const { EMBED_COLORS } = require("@root/config");
const timeUtils = require("@utils/timeUtils");

module.exports = class BlockServerCommand extends Command {
  constructor(client) {
    super(client, {
      name: "block-server",
      description: "managing the list of blocked servers",
      category: "ADMIN",
      botPermissions: ["EMBED_LINKS"],
      userPermissions: ["ADMINISTRATOR"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "add <serverId> [duration] [reason]",
            description: "add a server to the blacklist"
          },
          {
            trigger: "remove <serverId>",
            description: "remove a server from blacklist"
          },
          {
            trigger: "list",
            description: "show blocked servers"
          }
        ]
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "add",
            description: "add a server to the blacklist",
            type: "SUB_COMMAND",
            options: [
              {
                name: "server",
                description: "ID server",
                type: "STRING",
                required: true
              },
              {
                name: "duration",
                description: "duration of the lock (1d, 2h, 30m)",
                type: "STRING",
                required: false
              },
              {
                name: "reason",
                description: "reason for blocking",
                type: "STRING",
                required: false
              }
            ]
          },
          {
            name: "remove",
            description: "remove a server from blacklist",
            type: "SUB_COMMAND",
            options: [
              {
                name: "server",
                description: "ID server",
                type: "STRING",
                required: true
              }
            ]
          },
          {
            name: "list",
            description: "show blocked servers",
            type: "SUB_COMMAND"
          }
        ]
      }
    });
    
    this.blockedCheckInterval = setInterval(() => this.checkExpiredBlocks(), 60 * 60 * 1000);
  }
  
  async checkExpiredBlocks() {
    try {
      const now = new Date();
      const expired = await BlockedServer.find({
        isPermanent: false,
        expiresAt: { $lte: now }
      });
      
      for (const block of expired) {
        await BlockedServer.deleteOne({ _id: block._id });
        this.client.blockedServers = this.client.blockedServers.filter(id => id !== block.serverId);
        this.client.logger.log(`The server ${block.serverId} automatically unblocked after the time has expired`);
      }
    } catch (err) {
      this.client.logger.error("Error checking the locks", err);
    }
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const sub = args[0].toLowerCase();
    const response = await this.handleCommand(sub, args.slice(1), message.author, message);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const serverId = interaction.options.getString("server");
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason");
    const args = serverId ? [serverId, duration, reason].filter(Boolean) : [];
    
    const response = await this.handleCommand(sub, args, interaction.user, interaction);
    await interaction.followUp(response);
  }

  async handleCommand(sub, args, user, context) {
    try {
      switch (sub) {
        case "add":
          return await this.addServer(user, args[0], args[1], args.slice(2).join(" "), context.client);
        case "remove":
          return await this.removeServer(args[0], context.client);
        case "list":
          return await this.listServers(context.client);
        default:
          return "❌ Unknown subcommand";
      }
    } catch (ex) {
      context.client.logger.error("block-server", ex);
      return `❌ Command execution error: ${ex.message}`;
    }
  }

  async addServer(user, serverId, durationStr, reason, client) {
    if (!serverId || serverId.length !== 18 || !/^\d+$/.test(serverId)) {
      return "❌ Specify the correct server ID (18 digits)";
    }

    const existing = await BlockedServer.findOne({ serverId });
    if (existing) return `❌ Server \`${serverId}\` already blocked`;

    let duration = 0;
    let isPermanent = true;
    
    if (durationStr) {
      duration = timeUtils.parseDuration(durationStr);
      if (duration === 0) return "❌ Incorrect duration format. Use: 1d, 2h, 30m";
      isPermanent = false;
    }

    const blockedServer = new BlockedServer({
      serverId,
      reason: reason || "Not specified",
      blockedBy: user.id,
      blockedAt: new Date(),
      duration,
      isPermanent
    });

    await blockedServer.save();
    client.blockedServers.push(serverId);

    // const guild = client.guilds.cache.get(serverId);
    // if (guild) {
    //   try {
    //     await guild.leave();
    //   } catch (ex) {
    //     client.logger.error(`Couldn't leave the server ${guild.name}`, ex);
    //   }
    // }

    if (!isPermanent) {
      setTimeout(async () => {
        await BlockedServer.deleteOne({ serverId });
        client.blockedServers = client.blockedServers.filter(id => id !== serverId);
        client.logger.log(`Server ${serverId} automatically unblocked after the time has expired`);
      }, duration);
    }

    return `✅ Server \`${serverId}\` blocked ${
      isPermanent ? "forever" : `for ${timeUtils.formatDuration(duration)}`
    }${reason ? `. Reason: ${reason}` : ''}`;
  }

  async removeServer(serverId, client) {
    if (!serverId || serverId.length !== 18 || !/^\d+$/.test(serverId)) {
      return "❌ Specify the correct server ID (18 digits)";
    }

    const result = await BlockedServer.deleteOne({ serverId });
    if (result.deletedCount === 0) return `❌ The server \`${serverId}\` was not found in the list`;

    client.blockedServers = client.blockedServers.filter(id => id !== serverId);
    return `✅ The server \`${serverId}\` has been removed from the blacklist`;
  }

  async listServers(client) {
    const blockedServers = await BlockedServer.find();
    if (!blockedServers.length) return "📭 The list of blocked servers is empty";

    const list = blockedServers.map(server => {
      const duration = server.isPermanent 
        ? "Forever" 
        : `Until <t:${Math.floor(server.expiresAt.getTime() / 1000)}:R>`;
        
      return `• \`${server.serverId}\` - ${duration}\n  Reason: ${server.reason}\n  Blocked it: <@${server.blockedBy}>`;
    }).join("\n\n");

    return {
      embeds: [{
        title: "🚫 Blocked servers",
        description: list,
        color: EMBED_COLORS.ERROR,
        footer: { text: `Total: ${blockedServers.length}` }
      }]
    };
  }
};