const { Command } = require("@src/structures");
const create = require("./sub/auction/create");
const bid = require("./sub/auction/bid");
const end = require("./sub/auction/end");

module.exports = class AuctionCommand extends Command {
  constructor(client) {
    super(client, {
      name: "auction",
      description: "Аукцион: создать, сделать ставку или завершить",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          { trigger: "create <startprice> <duration> [role/channel/user/custom]", description: "Создать аукцион" },
          { trigger: "bid <amount>", description: "Сделать ставку" },
          { trigger: "end", description: "Завершить аукцион вручную" },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "create",
            description: "Создать аукцион",
            type: "SUB_COMMAND",
            options: [
              { name: "startprice", description: "Стартовая цена", type: "INTEGER", required: true },
              { name: "duration", description: "Длительность (мин)", type: "INTEGER", required: true },
              { name: "role", description: "Роль для аукциона", type: "ROLE", required: false },
              { name: "channel", description: "Канал для аукциона", type: "CHANNEL", required: false },
              { name: "user", description: "Пользователь как предмет", type: "USER", required: false },
              { name: "custom", description: "Текстовый предмет", type: "STRING", required: false },
            ],
          },
          {
            name: "bid",
            description: "Сделать ставку",
            type: "SUB_COMMAND",
            options: [
              { name: "amount", description: "Сумма ставки", type: "INTEGER", required: true },
            ],
          },
          {
            name: "end",
            description: "Завершить аукцион вручную",
            type: "SUB_COMMAND",
          },
        ],
      },
    });
  }

  async messageRun(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "create") return create(message, this.client, args.slice(1));
    if (sub === "bid") return bid(message, this.client, args.slice(1));
    if (sub === "end") return end(message, this.client);
  }

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "create") return create(interaction, this.client);
    if (sub === "bid") return bid(interaction, this.client);
    if (sub === "end") return end(interaction, this.client);
  }
};
