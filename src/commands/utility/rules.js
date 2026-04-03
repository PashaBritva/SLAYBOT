const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "rules",
  description: "показывает правила сервера",
  category: "INFORMATION",
  command: { enabled: true, usage: "" },
  slashCommand: { enabled: true, ephemeral: true },

  async messageRun(message) {
    await message.safeReply({ embeds: buildRulesEmbeds() });
  },

  async interactionRun(interaction) {
    await interaction.followUp({ embeds: buildRulesEmbeds() });
  },
};

function buildRulesEmbeds() {
  const ACCENT = "#5865F2";

  return [
    // Main rules embed
    new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle("📜 Правила сервера")
      .setDescription(
        `Незнание правил **не освобождает** от ответственности.\n` +
          `Администрация оставляет за собой право изменять правила.`
      )
      .addFields(
        {
          name: "👤 1 — Уважение",
          value: "Оскорбления, угрозы и грубые высказывания запрещены.\n" + "`⚠️ → 🔇 3ч → 🚫 1д`",
          inline: true,
        },
        {
          name: "🌐 2 — Язык",
          value: "Основной язык — **русский**. Иные языки — только в спец. каналах.\n" + "`⚠️ → 🔇 1ч → 🔇 6ч`",
          inline: true,
        },
        {
          name: "🚫 3 — Запретные темы",
          value: "**Политика** и **религия** строго запрещены.\n" + "`⚠️ → 🔇 6ч → 🚫 1д`",
          inline: true,
        },
        {
          name: "💬 4 — Флуд и спам",
          value: "Не флудите и не спамьте. Поддерживайте порядок.\n" + "`⚠️ → 🔇 3ч → 🔇 12ч`",
          inline: true,
        },
        {
          name: "📢 5 — Реклама",
          value: "Реклама и самореклама запрещены без разрешения.\n" + "`⚠️ → 🔇 6ч → 🚫 1д`",
          inline: true,
        },
        {
          name: "🔞 6 — NSFW",
          value: "Контент 18+ запрещён в любых каналах.\n" + "`🔇 6ч → 🚫 3д`",
          inline: true,
        }
      )
      .setFooter({ text: "Следите за обновлениями в 📰 news" }),

    // Additional rules + summary
    new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle("📋 Дополнительно")
      .addFields(
        {
          name: "🤖 Бот",
          value: "Не злоупотребляйте командами бота. Сообщайте о багах.",
          inline: true,
        },
        {
          name: "🛡️ Безопасность",
          value: "Не делитесь личными данными. Фишинг → **🚫 7 дней**.",
          inline: true,
        },
        {
          name: "⚖️ Модерация",
          value: "Оспаривайте решения **корректно и в ЛС** с администрацией.",
          inline: true,
        }
      )
      .setFooter({ text: "SLAYBOT • Правила сервера" })
      .setTimestamp(),
  ];
}
