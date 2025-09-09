const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const { postToBin } = require("@utils/httpUtils");
const { EMBED_COLORS } = require("@root/config.js");
const { getSettings } = require("@schemas/Guild");
const { sendMessage, safeDM } = require("@utils/botUtils");
const { error } = require("@src/helpers/logger");

const OPEN_PERMS = [PermissionsBitField.Flags.ManageChannels];
const CLOSE_PERMS = [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ReadMessageHistory];

function isTicketChannel(channel) {
  return (
    channel.type === ChannelType.GuildText &&
    channel.name.startsWith("tіcket-") &&
    channel.topic &&
    channel.topic.startsWith("tіcket|")
  );
}

function getTicketChannels(guild) {
  return guild.channels.cache.filter((ch) => isTicketChannel(ch));
}

function getExistingTicketChannel(guild, userId) {
  const tktChannels = getTicketChannels(guild);
  return tktChannels.find((ch) => ch.topic.split("|")[1] === userId);
}

async function parseTicketDetails(channel) {
  if (!channel.topic) return;
  const split = channel.topic?.split("|");
  const userId = split[1];
  const title = split[2];
  const user = await channel.client.users.fetch(userId, { cache: false }).catch(() => {});
  return { title, user };
}

async function closeTicket(channel, closedBy, reason) {
  if (!channel.deletable || !channel.permissionsFor(channel.guild.members.me).has(CLOSE_PERMS)) {
    return "MISSING_PERMISSIONS";
  }

  try {
    const config = await getSettings(channel.guild);
    const messages = await channel.messages.fetch();
    const reversed = Array.from(messages.values()).reverse();

    let content = "";
    reversed.forEach((m) => {
      content += `[${new Date(m.createdAt).toLocaleString("en-US")}] - ${m.author.tag}\n`;
      if (m.cleanContent !== "") content += `${m.cleanContent}\n`;
      if (m.attachments.size > 0) content += `${m.attachments.map((att) => att.proxyURL).join(", ")}\n`;
      content += "\n";
    });

    const logsUrl = await postToBin(content, `Ticket Logs for ${channel.name}`);
    const ticketDetails = await parseTicketDetails(channel);

    const components = [];
    if (logsUrl) {
      const channelUrl = `https://discord.com/channels/${channel.guild.id}/${channel.id}`;
      components.push(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("View Channel").setURL(channelUrl).setStyle(5)
        )
      );
    }

    if (channel.deletable) await channel.delete();

    const embed = new EmbedBuilder()
      .setAuthor({ name: "Ticket Closed" })
      .setColor(EMBED_COLORS.TICKET_CLOSE)
      .setDescription(`**Title:** ${ticketDetails.title}`)
      .addFields(
        { name: "Opened By", value: ticketDetails.user ? ticketDetails.user.tag : "User left", inline: true },
        { name: "Closed By", value: closedBy ? closedBy.tag : "User left", inline: true }
      );

    if (reason) embed.addFields({ name: "Reason", value: reason, inline: false });

    if (config.ticket.log_channel) {
      const logChannel = channel.guild.channels.cache.get(config.ticket.log_channel);
      sendMessage(logChannel, { embeds: [embed], components });
    }

    if (ticketDetails.user) {
      const dmEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.TICKET_CLOSE)
        .setAuthor({ name: "Ticket Closed" })
        .setThumbnail(channel.guild.iconURL())
        .setDescription(`**Server:** ${channel.guild.name}\n**Title:** ${ticketDetails.title}`);
      safeDM(ticketDetails.user, { embeds: [dmEmbed], components });
    }

    return "SUCCESS";
  } catch (ex) {
    error("closeTicket", ex);
    return "ERROR";
  }
}

async function closeAllTickets(guild, author) {
  const channels = getTicketChannels(guild);
  let success = 0;
  let failed = 0;

  for (const ch of channels.values()) {
    const status = await closeTicket(ch, author, "Force close all open tickets");
    if (status === "SUCCESS") success += 1;
    else failed += 1;
  }

  return [success, failed];
}

async function openTicket(guild, user, config) {
  if (!guild.members.me.permissions.has(OPEN_PERMS)) return "MISSING_PERMISSIONS";

  const alreadyExists = getExistingTicketChannel(guild, user.id);
  if (alreadyExists) return "ALREADY_EXISTS";

  const settings = await getSettings(guild);
  const existing = getTicketChannels(guild).size;
  if (existing >= settings.ticket.limit) return "TOO_MANY_TICKETS";

  try {
    const ticketNumber = (existing + 1).toString();
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
      {
        id: guild.members.me.roles.highest.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      },
    ];

    config.support_roles.forEach((role) => {
      permissionOverwrites.push({
        id: role,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
      });
    });

    const tktChannel = await guild.channels.create({
      name: `tіcket-${ticketNumber}`,
      type: ChannelType.GuildText,
      topic: `tіcket|${user.id}|${config.title}`,
      permissionOverwrites,
    });

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Ticket #${ticketNumber}` })
      .setDescription(`Hello ${user.toString()}\nSupport will be with you shortly\n\n**Ticket Reason:**\n${config.title}`)
      .setFooter({ text: "You may close your ticket anytime by clicking the button below" });

    const buttonsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Close Ticket").setCustomId("TICKET_CLOSE").setEmoji("🔒").setStyle(1)
    );

    const sent = await sendMessage(tktChannel, { content: user.toString(), embeds: [embed], components: [buttonsRow] });

    const dmEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.TICKET_CREATE)
      .setAuthor({ name: "Ticket Created" })
      .setThumbnail(guild.iconURL())
      .setDescription(`**Server:** ${guild.name}\n**Title:** ${config.title}`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("View Channel").setURL(sent.url).setStyle(5)
    );

    safeDM(user, { embeds: [dmEmbed], components: [row] });

    return "SUCCESS";
  } catch (ex) {
    error("openTicket", ex);
    return "FAILED";
  }
}

module.exports = {
  getTicketChannels,
  getExistingTicketChannel,
  isTicketChannel,
  closeTicket,
  closeAllTickets,
  openTicket,
};
