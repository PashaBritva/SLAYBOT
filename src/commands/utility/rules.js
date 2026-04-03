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
  const E = "#068ADD";
  return [
    new EmbedBuilder().setColor(E).setTitle("🟢 1.1 Уважение").setDescription("Уважайте всех участников. Оскорбления, угрозы и грубость запрещены.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 3ч → 🚫 1 день" }),
    new EmbedBuilder().setColor(E).setTitle("🌐 1.2 Язык общения").setDescription("Основной язык — русский. Другие языки только в разрешённых каналах.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 1ч → 🔇 6ч" }),
    new EmbedBuilder().setColor(E).setTitle("🚫 1.3 Запрещённые темы").setDescription("Политика, религия и спорные темы запрещены.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 6ч → 🚫 1 день" }),
    new EmbedBuilder().setColor(E).setTitle("💬 2.1 Флуд и спам").setDescription("Запрещено флудить и спамить. Поддерживайте тематические обсуждения.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 3ч → 🔇 12ч" }),
    new EmbedBuilder().setColor(E).setTitle("📢 2.2 Реклама").setDescription("Реклама и самореклама запрещены без разрешения администрации.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 6ч → 🚫 1 день" }),
    new EmbedBuilder().setColor(E).setTitle("🔞 2.3 NSFW контент").setDescription("Контент для взрослых запрещён в любых каналах.").addFields({ name: "⚖️ Последствия", value: "🔇 6ч → 🚫 3 дня" }),
    new EmbedBuilder().setColor(E).setTitle("🤖 3.1 Команды бота").setDescription("Используйте команды по назначению. Не злоупотребляйте.").addFields({ name: "⚖️ Последствия", value: "⚠️ → ⏸️ 3ч → ⏸️ 1 день" }),
    new EmbedBuilder().setColor(E).setTitle("🛡️ 4.1 Уважение к модераторам").setDescription("Уважайте решения модераторов. Оспаривайте корректно в ЛС.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 3ч → 🔇 12ч" }),
    new EmbedBuilder().setColor(E).setTitle("🔒 5.1 Личные данные").setDescription("Не делитесь личными данными и паролями с другими участниками.").addFields({ name: "⚖️ Последствия", value: "⚠️ → 🔇 6ч → 🚫 3 дня" }),
    new EmbedBuilder().setColor("#ED4245").setTitle("⛔ 5.2 Фишинг и мошенничество").setDescription("Любой фишинг и мошенничество запрещены.").addFields({ name: "⚖️ Последствия", value: "🚫 Бан 7 дней" }),
    new EmbedBuilder().setColor(E).setTitle("📝 Дополнительно").setDescription("Администрация может изменять правила. Следите за 📰 `news`.\nНарушение правил ведёт к предупреждению, муту или бану.").setFooter({ text: "Полные правила: RULES.md" }),
  ];
}
