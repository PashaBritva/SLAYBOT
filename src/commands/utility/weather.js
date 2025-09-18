const { Command } = require("@src/structures");
const { EmbedBuilder, PermissionsBitField, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");

const API_KEY = process.env.WEATHERSTACK_KEY;

module.exports = class WeatherCommand extends Command {
  constructor(client) {
    super(client, {
      name: "weather",
      description: "Get weather information",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: [PermissionsBitField.Flags.EmbedLinks],
      command: {
        enabled: true,
        usage: "<place>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "place",
            description: "Country/city name to get weather information for",
            type: 3,
            required: true,
          },
        ],
      },
    });
  }

  /** @param {Message} message @param {string[]} args */
  async messageRun(message, args) {
    const place = args.join(" ");
    const response = await weather(place);
    await message.reply(response);
  }

  /** @param {CommandInteraction} interaction */
  async interactionRun(interaction) {
    const place = interaction.options.getString("place");
    const response = await weather(place);
    await interaction.followUp(response);
  }
};

async function weather(place) {
  const response = await getJson(`https://api.weatherstack.com/current?access_key=${API_KEY}&query=${encodeURIComponent(place)}`);
  if (!response.data || !response.data.current) return `No weather info found for \`${place}\``;

  const json = response.data;

  const embed = new EmbedBuilder()
    .setTitle("Weather")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.current?.weather_icons?.[0])
    .addFields(
      { name: "City", value: json.location?.name || "NA", inline: true },
      { name: "Region", value: json.location?.region || "NA", inline: true },
      { name: "Country", value: json.location?.country || "NA", inline: true },
      { name: "Weather condition", value: json.current?.weather_descriptions?.[0] || "NA", inline: true },
      { name: "Date", value: json.location?.localtime?.slice(0, 10) || "NA", inline: true },
      { name: "Time", value: json.location?.localtime?.slice(11, 16) || "NA", inline: true },
      { name: "Temperature", value: `${json.current?.temperature}°C`, inline: true },
      { name: "Cloudcover", value: `${json.current?.cloudcover}%`, inline: true },
      { name: "Wind", value: `${json.current?.wind_speed} km/h`, inline: true },
      { name: "Wind direction", value: json.current?.wind_dir || "NA", inline: true },
      { name: "Pressure", value: `${json.current?.pressure} mb`, inline: true },
      { name: "Precipitation", value: `${json.current?.precip?.toString() || "NA"} mm`, inline: true },
      { name: "Humidity", value: `${json.current?.humidity?.toString() || "NA"}`, inline: true },
      { name: "Visual distance", value: `${json.current?.visibility} km`, inline: true },
      { name: "UV", value: `${json.current?.uv_index?.toString() || "NA"}`, inline: true }
    )
    .setFooter({ text: `Last checked at ${json.current?.observation_time} GMT` });

  return { embeds: [embed] };
}
