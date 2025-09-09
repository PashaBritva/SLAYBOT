const { Manager } = require("erela.js");
const { MUSIC } = require("@root/config");

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

    this.on("nodeConnect", (node) => console.log(`[MUSIC] Node ${node.options.identifier} connected`));
    this.on("nodeError", (node, error) => console.error(`[MUSIC] Node ${node.options.identifier} error:`, error));
    this.on("trackStart", (player, track) => console.log(`[MUSIC] Start track: ${track.title}`));
  }
};
