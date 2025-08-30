const { MessageEmbed } = require("discord.js");
const Auction = require("@schemas/Auction");

module.exports = async (ctx, client, args = []) => {
  const isInteraction = !!ctx.options;

  let role, channel, user, custom, startPrice, duration;

  if (isInteraction) {
    role = ctx.options.getRole("role");
    channel = ctx.options.getChannel("channel");
    user = ctx.options.getUser("user");
    custom = ctx.options.getString("custom");
    startPrice = ctx.options.getInteger("startprice");
    duration = ctx.options.getInteger("duration");
  } else {
    if (args.length < 3) {
      return ctx.reply?.("❌ Использование: !auction create <startprice> <duration> <role/channel/user/custom>");
    }
    startPrice = parseInt(args[0]);
    duration = parseInt(args[1]);
    const typeArg = args[2];

    if (ctx.guild) {
      if (typeArg.startsWith("<@&") && typeArg.endsWith(">")) role = ctx.guild.roles.cache.get(typeArg.slice(3, -1));
      else if (typeArg.startsWith("<#") && typeArg.endsWith(">")) channel = ctx.guild.channels.cache.get(typeArg.slice(2, -1));
      else if (typeArg.startsWith("<@") && typeArg.endsWith(">")) user = await ctx.guild.members.fetch(typeArg.slice(2, -1)).then(m => m.user).catch(() => null);
      else custom = typeArg;
    }
  }

  let type, item;
  if (role) { type = "role"; item = role.id; }
  else if (channel) { type = "channel"; item = channel.id; }
  else if (user) { type = "user"; item = user.id; }
  else if (custom) { type = "custom"; item = custom; }
  else return ctx.reply?.("❌ Укажи предмет аукциона");

  const existing = await Auction.findOne({ guildId: ctx.guildId || ctx.guild.id, active: true });
  if (existing) return ctx.reply?.("⚠ На сервере уже есть активный аукцион.");

  const endTime = new Date(Date.now() + duration * 60 * 1000);
  const auction = await Auction.create({
    guildId: ctx.guildId || ctx.guild.id,
    ownerId: ctx.user?.id || ctx.author?.id,
    type,
    item,
    startPrice,
    highestBid: startPrice,
    endTime,
  });

  const itemDisplay =
    type === "role" ? `<@&${item}>` :
    type === "channel" ? `<#${item}>` :
    type === "user" ? `<@${item}>` : item;

  const embed = new MessageEmbed()
    .setTitle("📦 Новый аукцион!")
    .setColor("GOLD")
    .setDescription(
      `> Лот: **${itemDisplay}**\n` +
      `> Стартовая цена: **${startPrice}**\n` +
      `> Длительность: **${duration} мин**\n\n` +
      `_Делайте ставки командой **\`/auction bid <сумма>\`**_`
    );

  if (isInteraction) return ctx.followUp({ embeds: [embed] });
  else return ctx.reply?.({ embeds: [embed] });
};
