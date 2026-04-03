const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "rules",
  description: "показывает правила сервера",
  category: "INFORMATION",
  command: { enabled: true, usage: "" },
  slashCommand: { enabled: true, ephemeral: true },

  async messageRun(message) {
    await message.safeReply({ embeds: [buildRulesEmbed()] });
  },

  async interactionRun(interaction) {
    await interaction.followUp({ embeds: [buildRulesEmbed()] });
  },
};

function buildRulesEmbed() {
  return new EmbedBuilder()
    .setTitle("📜 Правила")
    .setColor("#068ADD")
    .setDescription(
      `1. **Уважайте всех** — оскорбления, угрозы, грубость → ⚠️ / 🔇 / 🚫\n` +
        `2. **Русский язык** — основной язык сервера → ⚠️ / 🔇\n` +
        `3. **Без политики и религии** — спорные темы запрещены → ⚠️ / 🔇 / 🚫\n` +
        `4. **Без спама и флуда** — тематические обсуждения → ⚠️ / 🔇\n` +
        `5. **Без рекламы** — только с разрешения админа → ⚠️ / 🔇 / 🚫\n` +
        `6. **Без NSFW** — контент 18+ запрещён → 🔇 / 🚫\n` +
        `7. **Команды бота по делу** — не злоупотребляйте → ⚠️ / ⏸️\n` +
        `8. **Уважайте модераторов** — оспаривайте в ЛС → ⚠️ / 🔇\n` +
        `9. **Не делитесь личными данными** — безопасность превыше всего → ⚠️ / 🔇 / 🚫\n` +
        `10. **Фишинг и мошенничество** → 🚫 Бан 7 дней\n\n` +
        `⚠️ — предупреждение\n` +
        `🔇 — мут (1ч — 12ч)\n` +
        `⏸️ — блокировка бота (3ч — 1 день)\n` +
        `🚫 — бан (1 день — 7 дней)`
    )
    .setFooter({ text: "Администрация может изменять правила • Следите за 📰 news" })
    .setTimestamp();
}
