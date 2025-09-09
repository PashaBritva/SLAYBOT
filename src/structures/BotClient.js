const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  WebhookClient,
  ApplicationCommandType,
  PermissionFlagsBits,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const { table } = require("table");
const mongoose = require("mongoose");
const logger = require("../helpers/logger");
const MusicManager = require("./MusicManager");
const Command = require("./Command");
const BaseContext = require("./BaseContext");
const GiveawayManager = require("./GiveawayManager");
const convertSlashCommands = require("@utils/convertSlashTypes");

module.exports = class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.User, Partials.Message, Partials.Reaction],
      allowedMentions: {
        repliedUser: false,
      },
      rest: {
        timeout: 20000,
      },
    });

    this.config = require("@root/config");

    /** @type {Command[]} */
    this.commands = [];
    this.commandIndex = new Collection();

    /** @type {Collection<string, Command>} */
    this.slashCommands = new Collection();

    /** @type {Collection<string, BaseContext>} */
    this.contextMenus = new Collection();
    this.counterUpdateQueue = [];

    // initialize cache
    this.cmdCooldownCache = new Collection();
    this.ctxCooldownCache = new Collection();
    this.xpCooldownCache = new Collection();
    this.inviteCache = new Collection();
    this.antiScamCache = new Collection();
    this.flagTranslateCache = new Collection();

    // initialize webhook for sending guild join/leave details
    this.joinLeaveWebhook = process.env.JOIN_LEAVE_LOGS
      ? new WebhookClient({ url: process.env.JOIN_LEAVE_LOGS })
      : undefined;

    // Music Player
    this.musicManager = new MusicManager(this);

    // Giveaways
    this.giveawaysManager = new GiveawayManager(this);

    // Logger
    this.logger = logger;
  }

  async initializeMongoose() {
    this.logger.log(`Connecting to MongoDb...`);
    await mongoose.connect(process.env.MONGO_CONNECTION);
    this.logger.success("Mongoose: Database connection established");
  }

  getAbsoluteFilePaths(directory) {
    const filePaths = [];
    const readCommands = (dir) => {
      const files = fs.readdirSync(path.join(__appRoot, dir));
      files.forEach((file) => {
        const stat = fs.lstatSync(path.join(__appRoot, dir, file));
        if (stat.isDirectory()) {
          readCommands(path.join(dir, file));
        } else {
          const extension = path.extname(file);
          if (extension !== ".js") {
            this.logger.debug(`Skipping ${file}: not a js file`);
            return;
          }
          const filePath = path.join(__appRoot, dir, file);
          filePaths.push(filePath);
        }
      });
    };
    readCommands(directory);
    return filePaths;
  }

  loadEvents(directory) {
    this.logger.log(`Loading events...`);
    let success = 0;
    let failed = 0;
    const clientEvents = [];
    const musicEvents = [];

    this.getAbsoluteFilePaths(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      const dirName = path.basename(path.dirname(filePath));
      try {
        const eventName = path.basename(file, ".js");
        const event = require(filePath);

        if (dirName === "music") {
          this.musicManager.on(eventName, event.bind(null, this));
          musicEvents.push([file, "✓"]);
        } else {
          this.on(eventName, event.bind(null, this));
          clientEvents.push([file, "✓"]);
        }

        delete require.cache[require.resolve(filePath)];
        success += 1;
      } catch (ex) {
        failed += 1;
        this.logger.error(`loadEvent - ${file}`, ex);
      }
    });

    console.log(
      table(clientEvents, {
        header: { alignment: "center", content: "Client Events" },
        singleLine: true,
        columns: [{ width: 25 }, { width: 5, alignment: "center" }],
      })
    );

    console.log(
      table(musicEvents, {
        header: { alignment: "center", content: "Music Events" },
        singleLine: true,
        columns: [{ width: 25 }, { width: 5, alignment: "center" }],
      })
    );

    this.logger.log(`Loaded ${success + failed} events. Success (${success}) Failed (${failed})`);
  }

  getCommand(invoke) {
    const index = this.commandIndex.get(invoke.toLowerCase());
    return index !== undefined ? this.commands[index] : undefined;
  }

  loadCommand(cmd) {
    if (cmd.command?.enabled) {
      const index = this.commands.length;
      if (this.commandIndex.has(cmd.name)) {
        throw new Error(`Command ${cmd.name} already registered`);
      }
      cmd.command.aliases.forEach((alias) => {
        if (this.commandIndex.has(alias)) throw new Error(`Alias ${alias} already registered`);
        this.commandIndex.set(alias.toLowerCase(), index);
      });
      this.commandIndex.set(cmd.name.toLowerCase(), index);
      this.commands.push(cmd);
    } else {
      this.logger.debug(`Skipping command ${cmd.name}. Disabled!`);
    }

    if (cmd.slashCommand?.enabled) {
      if (this.slashCommands.has(cmd.name)) throw new Error(`Slash Command ${cmd.name} already registered`);
      this.slashCommands.set(cmd.name, cmd);
    } else {
      this.logger.debug(`Skipping slash command ${cmd.name}. Disabled!`);
    }
  }

  loadCommands(directory) {
    this.logger.log(`Loading commands...`);
    this.getAbsoluteFilePaths(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const cmdClass = require(filePath);
        if (!(cmdClass.prototype instanceof Command)) return;
        const cmd = new cmdClass(this);
        this.loadCommand(cmd);
      } catch (ex) {
        this.logger.error(`Failed to load ${file} Reason: ${ex.message}`);
      }
    });
    this.logger.success(`Loaded ${this.commands.length} commands`);
    this.logger.success(`Loaded ${this.slashCommands.size} slash commands`);
    if (this.slashCommands.size > 100) throw new Error("A maximum of 100 slash commands can be enabled");
  }

  loadContexts(directory) {
    this.logger.log(`Loading contexts...`);
    this.getAbsoluteFilePaths(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const ctxClass = require(filePath);
        if (!(ctxClass.prototype instanceof BaseContext)) return;
        const ctx = new ctxClass(this);
        if (!ctx.enabled) return this.logger.debug(`Skipping context ${ctx.name}. Disabled!`);
        if (this.contextMenus.has(ctx.name)) throw new Error(`Context already exists with that name`);
        this.contextMenus.set(ctx.name, ctx);
      } catch (ex) {
        this.logger.error(`Context: Failed to load ${file} Reason: ${ex.message}`);
      }
    });
    const userContexts = this.contextMenus.filter((ctx) => ctx.type === ApplicationCommandType.User).size;
    const messageContexts = this.contextMenus.filter((ctx) => ctx.type === ApplicationCommandType.Message).size;

    if (userContexts > 3) throw new Error("A maximum of 3 USER contexts can be enabled");
    if (messageContexts > 3) throw new Error("A maximum of 3 MESSAGE contexts can be enabled");

    this.logger.success(`Loaded ${userContexts} USER contexts`);
    this.logger.success(`Loaded ${messageContexts} MESSAGE contexts`);
  }

  async registerInteractions(guildId) {
    const toRegister = [];

    if (this.config.INTERACTIONS.SLASH) {
      convertSlashCommands(this.slashCommands);
    }

    if (this.config.INTERACTIONS.SLASH) {
      this.slashCommands
        .map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
        }))
        .forEach((s) => toRegister.push(s));
    }

    if (this.config.INTERACTIONS.CONTEXT) {
      this.contextMenus
        .map((ctx) => ({
          name: ctx.name,
          type: ctx.type,
        }))
        .forEach((c) => toRegister.push(c));
    }

    if (!guildId) {
      await this.application.commands.set(toRegister);
    } else if (typeof guildId === "string") {
      const guild = this.guilds.cache.get(guildId);
      if (!guild) throw new Error(`No guilds found matching ${guildId}`);
      await guild.commands.set(toRegister);
    } else {
      throw new Error(`Did you provide a valid guildId to register slash commands`);
    }

    this.logger.success("Successfully registered slash commands");
  }

  getInvite() {
    return this.generateInvite({
      scopes: ["bot", "applications.commands"],
      permissions: [
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ChangeNickname,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageGuild,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageNicknames,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.PrioritySpeaker,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.ViewChannel,
      ],
    });
  }
};
