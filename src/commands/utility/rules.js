const { EmbedBuilder } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "rules",
  description: "показывает правила сервера",
  category: "INFORMATION",
  command: {
    enabled: true,
    usage: "",
  },
  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async messageRun(message) {
    const embed = buildRulesEmbed();
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const embed = buildRulesEmbed();
    await interaction.followUp({ embeds: [embed] });
  },
};

function buildRulesEmbed() {
  const embed = new EmbedBuilder()
    .setColor("#068ADD")
    .setTitle("📋 Правила сервера")
    .setDescription(
      `**🟢 1. Общие правила поведения**\n` +
        `**1.1. Уважение** — Уважайте всех участников. Оскорбления и угрозы запрещены.\n` +
        `*⚠️ → 🔇 3ч → 🚫 1 день*\n\n` +
        `**1.2. Язык общения** — Основной язык — русский.\n` +
        `*⚠️ → 🔇 1ч → 🔇 6ч*\n\n` +
        `**1.3. Запрещенные темы** — Политика, религия и спорные темы запрещены.\n` +
        `*⚠️ → 🔇 6ч → 🚫 1 день*\n\n` +
        `**💬 2. Поведение в чатах**\n` +
        `**2.1. Флуд и спам** — Запрещены.\n` +
        `*⚠️ → 🔇 3ч → 🔇 12ч*\n\n` +
        `**2.2. Реклама** — Запрещена.\n` +
        `*⚠️ → 🔇 6ч → 🚫 1 день*\n\n` +
        `**2.3. NSFW контент** — Запрещён.\n` +
        `*🔇 6ч → 🚫 3 дня*\n\n` +
        `**🤖 3. Использование SLAYBOT**\n` +
        `**3.1. Команды бота** — Используйте по назначению.\n` +
        `*⚠️ → ⏸️ 3ч → ⏸️ 1 день*\n\n` +
        `**🛡️ 4. Взаимодействие с администрацией**\n` +
        `**4.1. Уважение к модераторам** — Уважайте решения модераторов.\n` +
        `*⚠️ → 🔇 3ч → 🔇 12ч*\n\n` +
        `**🔒 5. Безопасность**\n` +
        `**5.1. Личные данные** — Не делитесь личными данными.\n` +
        `*⚠️ → 🔇 6ч → 🚫 3 дня*\n\n` +
        `**5.2. Фишинг** — Запрещён.\n` +
        `*🚫 Бан на 7 дней*\n\n` +
        `**📝 6. Дополнительно**\n` +
        `Администрация может изменять правила. Следите за 📰 \`news\`.`
    )
    .setFooter({ text: "Полные правила: RULES.md на GitHub" })
    .setTimestamp();

  return embed;
}
