const config = require("@root/config");
const { EmbedBuilder, WebhookClient } = require("discord.js");
const pino = require("pino");

const webhookLogger = process.env.ERROR_LOGS ? new WebhookClient({ url: process.env.ERROR_LOGS }) : undefined;

const today = new Date();
const pinoLogger = pino.default(
  {
    level: "debug",
  },
  pino.multistream([
    {
      level: "info",
      stream: pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:mm:ss",
          ignore: "pid,hostname",
          singleLine: false,
          hideObject: true,
          customColors: "info:blue,warn:yellow,error:red",
        },
      }),
    },
    {
      level: "debug",
      stream: pino.destination({
        dest: `${process.cwd()}/logs/combined-${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}.log`,
        sync: true,
        mkdir: true,
      }),
    },
  ])
);

function sendWebhook(content, err) {
  if (!content && !err) return;

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.ERROR)
    .setAuthor({ name: err?.name || "Error" })
    .addFields(
      { name: "Description", value: content || "NA" },
      { name: "Details", value: "```js\n" + (err?.stack?.slice(0, 4000) || "No details") + "\n```" }
    );

  webhookLogger.send({ username: "Logs", embeds: [embed] }).catch(() => {});
}

module.exports = class Logger {
  /**
   * @param {string} content
   */
  static success(content) {
    pinoLogger.info(content);
  }

  /**
   * @param {string} content
   */
  static log(content) {
    pinoLogger.info(content);
  }

  /**
   * @param {string} content
   */
  static warn(content) {
    pinoLogger.warn(content);
  }

  /**
   * @param {string} content
   * @param {object} ex
   */
  static error(content, ex) {
    let message = content;
    let details = "";

    if (ex instanceof Error) {
      message += `: ${ex.message}`;
      details = ex.stack || ex.message;
    } else if (typeof ex === "object" && ex !== null) {
      try {
        details = JSON.stringify(ex, null, 2);
      } catch {
        details = String(ex);
      }
    } else if (ex) {
      details = String(ex);
    }

    pinoLogger.error({ details }, message);

    if (webhookLogger) sendWebhook(content, { name: "Error", stack: details, message });
  }


  /**
   * @param {string} content
   */
  static debug(content) {
    pinoLogger.debug(content);
  }
};
