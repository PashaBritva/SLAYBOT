const { Manager } = require("erela.js");
const { MUSIC } = require("@root/config");
const { success, warn, error, log } = require("@src/helpers/logger");

module.exports = class MusicManager extends Manager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    super({
      nodes: MUSIC.NODES,
      autoPlay: true,
      defaultSearchPlatform: "youtube",
      send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
      },
    });

    this.client = client;

    client.once("clientReady", () => {
      this.init(client.user.id);
      log("[MUSIC] Lavalink initialized");
    });

    client.on("raw", (d) => {
      if (["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(d.t)) {
        this.updateVoiceState(d);
      }
    });


    this.on("nodeConnect", (node) => success(`[MUSIC] Node ${node.options.identifier} connected`));
    this.on("nodeError", (node, err) => error(`[MUSIC] Node ${node.options.identifier} error:`, err));
    this.on("nodeDisconnect", (node) => warn(`[MUSIC] Node ${node.options.identifier} disconnected`));

    this.on("trackStart", (track) => log(`[MUSIC] Start track: ${track.title}`));
    this.on("queueEnd", (player) => {
      log(`[MUSIC] Queue ended in guild ${player.guild}`);
      player.destroy();
    });
  }
};
