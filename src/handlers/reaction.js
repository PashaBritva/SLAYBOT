const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { getReactionRoles } = require("@schemas/Message");
const { isTranslated, logTranslation } = require("@schemas/TranslateLog");
const data = require("@src/data.json");
const { getCountryLanguages } = require("country-language");
const { sendMessage } = require("@utils/botUtils");
const { translate } = require("@utils/httpUtils");
const { timeformat } = require("@utils/miscUtils");

const TRANSLATE_COOLDOWN = 120;

/**
 * Get remaining translation cooldown for a user
 * @param {import('discord.js').User} user
 */
const getTranslationCooldown = (user) => {
  if (user.client.flagTranslateCache.has(user.id)) {
    const elapsed = (Date.now() - user.client.flagTranslateCache.get(user.id)) / 1000;
    if (elapsed > TRANSLATE_COOLDOWN) {
      user.client.flagTranslateCache.delete(user.id);
      return 0;
    }
    return TRANSLATE_COOLDOWN - elapsed;
  }
  return 0;
};

/**
 * Get role linked to a reaction
 * @param {import("discord.js").MessageReaction} reaction
 */
function getRole(reaction) {
  const { message, emoji } = reaction;
  if (!message || !message.channel) return;

  const rr = getReactionRoles(message.guildId, message.channel.id, message.id);
  const emote = emoji.id ?? emoji.toString();
  const found = rr.find((doc) => doc.emote === emote);

  if (found) return message.guild.roles.cache.get(found.role_id);
}

/**
 * Handle flag reaction for translations
 * @param {string} countryCode
 * @param {import("discord.js").Message} message
 * @param {import("discord.js").User} user
 */
async function handleFlagReaction(countryCode, message, user) {
  const remaining = getTranslationCooldown(user);
  if (remaining > 0) {
    return sendMessage(
      message.channel,
      `${user}, you must wait ${timeformat(remaining)} before translating again!`,
      5
    );
  }

  if (await isTranslated(message, countryCode)) return;

  const languages = await new Promise((resolve) => {
    getCountryLanguages(countryCode, (err, langs) => {
      if (err) return resolve([]);
      resolve(langs);
    });
  });

  if (!languages.length) return;

  let targetCodes = languages
    .filter((lang) => data.GOOGLE_TRANSLATE[lang.iso639_1] !== undefined)
    .map((lang) => lang.iso639_1);

  if (targetCodes.length > 1 && targetCodes.includes("en")) {
    targetCodes = targetCodes.filter((c) => c !== "en");
  }

  let srcLang;
  let desc = "";
  let translatedCount = 0;

  for (const tc of targetCodes) {
    const response = await translate(message.content, tc);
    if (!response) continue;

    srcLang = response.inputLang;
    desc += `**${response.outputLang}:**\n${response.output}\n\n`;
    translatedCount++;
  }

  if (translatedCount === 0) return;

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Original Message")
      .setStyle(5)
      .setURL(message.url)
  );

  const embed = new EmbedBuilder()
    .setColor(message.client.config.EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `Translation from ${srcLang}` })
    .setDescription(desc)
    .setFooter({ text: `Requested by ${user.tag}`, iconURL: user.displayAvatarURL() });

  await sendMessage(message.channel, { embeds: [embed], components: [btnRow] });

  user.client.flagTranslateCache.set(user.id, Date.now());
  logTranslation(message, countryCode);
}

module.exports = {
  getRole,
  handleFlagReaction,
};
