const { getMember } = require("@schemas/Member");
const { getRandomInt } = require("@utils/miscUtils");
const { sendMessage } = require("@utils/botUtils");

const XP_MIN = 1;
const XP_MAX = 20;

const xpToAdd = () => getRandomInt(XP_MAX - XP_MIN) + XP_MIN;

/**
 * Handle XP gain for a message author
 * @param {import("discord.js").Message} message
 */
async function handleXp(message) {
  if (!message.guild || !message.member) return;
  const key = `${message.guildId}|${message.member.id}`;

  const last = message.client.xpCooldownCache.get(key);
  if (last) {
    const elapsed = (Date.now() - last) / 1000;
    if (elapsed < message.client.config.XP_SYSTEM.COOLDOWN) return;
    message.client.xpCooldownCache.delete(key);
  }

  const memberDb = await getMember(message.guild.id, message.member.id);
  memberDb.xp += xpToAdd();
  message.client.xpCooldownCache.set(key, Date.now());

  const neededXP = memberDb.level * memberDb.level * 100;
  if (memberDb.xp >= neededXP) {
    memberDb.level += 1;
    memberDb.xp -= neededXP;

    const lvlUpMsg = message.client.config.XP_SYSTEM.DEFAULT_LVL_UP_MSG
      .replace("{l}", memberDb.level)
      .replace("{m}", message.member.toString());

    await sendMessage(message.channel, lvlUpMsg);
  }

  await memberDb.save();
}

module.exports = { handleXp };
