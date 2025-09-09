const TYPE_MAP = {
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11
};

const CHANNEL_TYPE_MAP = {
    GUILD_TEXT: 0,
    DM: 1,
    GUILD_VOICE: 2,
    GROUP_DM: 3,
    GUILD_CATEGORY: 4,
    GUILD_NEWS: 5,
    GUILD_STORE: 6,
    GUILD_NEWS_THREAD: 10,
    GUILD_PUBLIC_THREAD: 11,
    GUILD_PRIVATE_THREAD: 12,
    GUILD_STAGE_VOICE: 13
};

function convertOptions(options) {
    if (!Array.isArray(options)) return options;

    return options.map(opt => {
        const newOpt = { ...opt };

        if (typeof newOpt.type === "string") {
            const mappedType = TYPE_MAP[newOpt.type];
            if (mappedType !== undefined) {
                newOpt.type = mappedType;
            } else {
                console.warn(`Unknown option type: ${newOpt.type}. Leaving as is.`);
            }
        }

        if (Array.isArray(newOpt.channel_types)) {
            newOpt.channel_types = newOpt.channel_types.map(ch => {
                const mappedChannelType = CHANNEL_TYPE_MAP[ch];
                return mappedChannelType !== undefined ? mappedChannelType : ch;
            });
        }

        if (Array.isArray(newOpt.options)) {
            newOpt.options = convertOptions(newOpt.options);
        }

        return newOpt;
    });
}

export default function convertSlashCommands(commands) {
    for (const cmd of commands.values()) {
        if (cmd.slashCommand?.options && Array.isArray(cmd.slashCommand.options)) {
            cmd.slashCommand.options = convertOptions(cmd.slashCommand.options);
        }
    }
}