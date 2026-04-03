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
  const BLUE = "#068ADD";
  const RED = "#ED4245";
  const GREEN = "#57F287";
  const ORANGE = "#FEE75C";

  return [
    // Заголовок
    new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("📜 Правила сервера")
      .setDescription(
        `Добро пожаловать! Ознакомьтесь с правилами ниже.\n` +
          `Незнание правил **не освобождает** от ответственности.\n\n` +
          `⚠️ — предупреждение\n` +
          `🔇 — мут\n` +
          `🚫 — бан`
      )
      .setFooter({ text: "Администрация может изменять правила • Следите за 📰 news" }),

    // 1. Уважение
    new EmbedBuilder().setColor(BLUE).setTitle("👤 1.1 Уважение").addFields(
      {
        name: "📌 Правило",
        value: "Уважайте всех участников сервера. Оскорбления, угрозы и грубые высказывания запрещены.",
      },
      {
        name: "⚖️ Наказания",
        value: "1-е: ⚠️ предупреждение\n2-е: 🔇 мут на **3 часа**\nПовторное: 🚫 бан на **1 день**",
      }
    ),

    // 1.2 Язык
    new EmbedBuilder().setColor(BLUE).setTitle("🌐 1.2 Язык общения").addFields(
      {
        name: "📌 Правило",
        value:
          "Основной язык сервера — **русский**. Использование других языков допускается только в соответствующих каналах.",
      },
      {
        name: "⚖️ Наказания",
        value: "1-е: ⚠️ предупреждение\n2-е: 🔇 мут на **1 час**\nПовторное: 🔇 мут на **6 часов**",
      }
    ),

    // 1.3 Запрещённые темы
    new EmbedBuilder().setColor(ORANGE).setTitle("🚫 1.3 Запрещённые темы").addFields(
      { name: "📌 Правило", value: "Обсуждение **политики**, **религии** и других спорных тем строго запрещено." },
      {
        name: "⚖️ Наказания",
        value: "1-е: ⚠️ предупреждение\n2-е: 🔇 мут на **6 часов**\nПовторное: 🚫 бан на **1 день**",
      }
    ),

    // 2.1 Флуд и спам
    new EmbedBuilder().setColor(BLUE).setTitle("💬 2.1 Флуд и спам").addFields(
      {
        name: "📌 Правило",
        value: "Запрещено флудить и спамить в любых каналах. Поддерживайте тематические обсуждения.",
      },
      {
        name: "⚖️ Наказания",
        value: "1-е: ⚠️ предупреждение\n2-е: 🔇 мут на **3 часа**\nПовторное: 🔇 мут на **12 часов**",
      }
    ),

    // 2.2 Реклама
    new EmbedBuilder().setColor(ORANGE).setTitle("📢 2.2 Реклама").addFields(
      { name: "📌 Правило", value: "Реклама и самореклама запрещены, кроме случаев, разрешённых администрацией." },
      {
        name: "⚖️ Наказания",
        value: "1-е: ⚠️ предупреждение\n2-е: 🔇 мут на **6 часов**\nПовторное: 🚫 бан на **1 день**",
      }
    ),

    // 2.3 NSFW
    new EmbedBuilder()
      .setColor(RED)
      .setTitle("🔞 2.3 NSFW контент")
      .addFields(
        { name: "📌 Правило", value: "Запрещено размещение контента для взрослых **(NSFW)** в любых каналах." },
        { name: "⚖️ Наказания", value: "1-е: 🔇 мут на **6 часов**\nПовторное: 🚫 бан на **3 дня**" }
      ),

    // Итог
    new EmbedBuilder()
      .setColor(GREEN)
      .setTitle("✅ Помните")
      .setDescription(
        `• Оспаривайте решения модераторов **корректно и в ЛС**\n` +
          `• Сообщайте о багах бота в специальный канал\n` +
          `• Не делитесь личными данными с другими участниками\n` +
          `• **Фишинг и мошенничество** → 🚫 Бан на **7 дней**\n\n` +
          `Соблюдайте правила и наслаждайтесь общением! 💬`
      )
      .setFooter({ text: "SLAYBOT • Правила сервера" })
      .setTimestamp(),
  ];
}
