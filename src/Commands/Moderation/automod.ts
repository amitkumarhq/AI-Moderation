import {
    ChannelType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';
import { BaseClient } from '../../Structures/Classes/Client.js';
import DB from '../../Structures/Schemas/ModerationDB.js';
import { icon } from '../../Structures/Design/index.js';
import { Command } from '../../Structures/Interfaces';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('AI Based Moderation System')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommandGroup((group) =>
            group
                .setName('channel')
                .setDescription('Channels To Use Automod')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('add')
                        .setDescription('Add Channel For Automod')
                        .addChannelOption((option) =>
                            option
                                .setName('channel')
                                .setDescription('The Channel To Add')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove Channel For Automod')
                        .addChannelOption((option) =>
                            option
                                .setName('channel')
                                .setDescription('The Channel To Remove')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true),
                        ),
                ),
        )
        .addSubcommandGroup((group) =>
            group
                .setName('bypass')
                .setDescription('Channels To Use Automod')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('add')
                        .setDescription('Add Users/Roles To Automod Bypass')
                        .addUserOption((option) =>
                            option
                                .setName('user')
                                .setDescription('Add User To Automod Bypass')
                                .setRequired(false),
                        )
                        .addRoleOption((option) =>
                            option
                                .setName('role')
                                .setDescription('Add Role To Automod Bypass')
                                .setRequired(false),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove Users/Roles From Automod Bypass')
                        .addUserOption((option) =>
                            option
                                .setName('user')
                                .setDescription('Remove User From Automod Bypass')
                                .setRequired(false),
                        )
                        .addRoleOption((option) =>
                            option
                                .setName('role')
                                .setDescription('Remove Role From Automod Bypass')
                                .setRequired(false),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('list').setDescription('List Automod Bypass'),
                ),
        )
        .addSubcommandGroup((group) =>
            group
                .setName('log')
                .setDescription('Configure Automod Logging Channels')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('add')
                        .setDescription('Add Channel To Automod Logging')
                        .addChannelOption((option) =>
                            option
                                .setName('channel')
                                .setDescription('The Channel For Automod Logging')
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews)
                                .setRequired(false),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove Channel From Automod Logging')
                        .addChannelOption((option) =>
                            option
                                .setName('channel')
                                .setDescription('The Channel For Automod Logging')
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews)
                                .setRequired(false),
                        ),
                ),
        )
        .addSubcommandGroup((group) =>
            group
                .setName('config')
                .setDescription('Configure Automod')
                .addSubcommand((subcommand) =>
                    subcommand.setName('list').setDescription('Show All Automod Configurations'),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('punishments')
                .setDescription('Configure Automod Punishments')
                .addStringOption((option) =>
                    option
                        .setName('low')
                        .setDescription('Set Low Severity Punishment')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Delete', value: 'delete' },
                            { name: 'Timeout', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' },
                        ),
                )
                .addStringOption((option) =>
                    option
                        .setName('medium')
                        .setDescription('Set Medium Severity Punishment')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Delete', value: 'delete' },
                            { name: 'Timeout', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' },
                        ),
                )
                .addStringOption((option) =>
                    option
                        .setName('high')
                        .setDescription('Set High Severity Punishment')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Delete', value: 'delete' },
                            { name: 'Timeout', value: 'timeout' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' },
                        ),
                ),
        ),
    async execute(interaction: ChatInputCommandInteraction, client: BaseClient) {
        const { options, guild } = interaction;
        const docs = await DB.findOne({ GuildID: guild?.id });

        const NotConfiguredEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🛑 Automod Not Configured!')
            .setDescription(
                `Please configure automod first.\nUse \`/automod channel add\`, \`/automod log\` & \`/automod punishments\` to configure automod`,
            );

        switch (options.getSubcommand()) {
            case 'add':
                {
                    switch (options.getSubcommandGroup()) {
                        case 'channel':
                            {
                                const channel = options.getChannel('channel');

                                if (!docs) {
                                    await DB.create({
                                        GuildID: guild?.id,
                                        ChannelIDs: channel?.id,
                                    });

                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Green')
                                                .setDescription(
                                                    `${channel} Has Been Added to the Automod Channels`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                } else if (docs && docs.ChannelIDs.includes(channel?.id)) {
                                    return interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Red')
                                                .setDescription(
                                                    `${channel} Is Already In The Automod Channels`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                }

                                docs?.ChannelIDs.push(channel?.id);
                                await docs?.save();

                                await interaction.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor('Green')
                                            .setDescription(
                                                `${channel} Has Been Added to the Automod Channels`,
                                            ),
                                    ],
                                    ephemeral: true,
                                });
                            }
                            break;

                        case 'bypass':
                            {
                                const addUser = options.getUser('user');
                                const addRole = options.getRole('role');

                                if (addUser) {
                                    try {
                                        if (!docs) {
                                            await DB.create({
                                                GuildID: guild?.id,
                                                BypassUsers: addUser.id,
                                            });
                                        } else if (docs && docs.BypassUsers.includes(addUser.id)) {
                                            return interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setDescription(
                                                            `${addUser} Is Already In The Automod Bypass List`,
                                                        ),
                                                ],
                                                ephemeral: true,
                                            });
                                        } else {
                                            docs.BypassUsers.push(addUser.id);
                                            await docs.save();
                                        }

                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Green')
                                                    .setDescription(
                                                        `${addUser} Has Been Added to the Automod Bypass List`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    } catch (err) {
                                        console.log(err);
                                    }
                                } else if (addRole) {
                                    try {
                                        if (!docs) {
                                            await DB.create({
                                                GuildID: guild?.id,
                                                BypassRoles: addRole.id,
                                            });
                                        } else if (docs && docs.BypassRoles.includes(addRole.id)) {
                                            return interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setDescription(
                                                            `${addRole} Is Already In The Automod Bypass List`,
                                                        ),
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        docs?.BypassRoles.push(addRole.id);
                                        await docs?.save();

                                        await interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Green')
                                                    .setDescription(
                                                        `${addRole} Has Been Added to the Automod Bypass List`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    } catch (err) {
                                        console.log(err);
                                    }
                                } else {
                                    return interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Red')
                                                .setTitle('🛑 Invalid Arguments')
                                                .setDescription(
                                                    `Please Provide A User/Role To Add To The Automod Bypass List`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                }
                            }
                            break;

                        case 'log':
                            {
                                try {
                                    const addChannel = options.getChannel('channel');
                                    const docs = await DB.findOne({ GuildID: guild?.id });

                                    if (!docs) {
                                        await DB.create({
                                            GuildID: guild?.id,
                                            LogChannelIDs: addChannel?.id,
                                        });
                                    } else if (
                                        docs &&
                                        docs.LogChannelIDs.includes(addChannel?.id)
                                    ) {
                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setDescription(
                                                        `${addChannel} Is Already In The Automod Logging Channels`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    }

                                    docs?.LogChannelIDs.push(addChannel?.id);
                                    await docs?.save();

                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Green')
                                                .setDescription(
                                                    `${addChannel} Has Been Added to the Automod Logging Channels`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;
                    }
                }
                break;

            case 'remove':
                {
                    switch (options.getSubcommandGroup()) {
                        case 'channel':
                            {
                                try {
                                    const channel = options.getChannel('channel');

                                    if (!docs || docs.ChannelIDs.length < 1) {
                                        return interaction.reply({
                                            embeds: [NotConfiguredEmbed],
                                            ephemeral: true,
                                        });
                                    } else if (!docs.ChannelIDs.includes(channel?.id)) {
                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setDescription(
                                                        `${channel} is not in the automod channels`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    }

                                    docs.ChannelIDs.splice(docs.ChannelIDs.indexOf(channel?.id), 1);
                                    await docs.save();

                                    await interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Green')
                                                .setDescription(
                                                    `${channel} has been removed from the automod channels`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;

                        case 'bypass':
                            {
                                try {
                                    const removeUser = options.getUser('user');
                                    const removeRole = options.getRole('role');

                                    if (removeUser) {
                                        if (!docs || docs.BypassUsers.length < 1) {
                                            return interaction.reply({
                                                embeds: [NotConfiguredEmbed],
                                                ephemeral: true,
                                            });
                                        } else if (!docs.BypassUsers.includes(removeUser?.id)) {
                                            return interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setDescription(
                                                            `${removeUser} is not in the Automod Bypass List`,
                                                        ),
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        docs.BypassUsers = removeOne(
                                            docs.BypassUsers,
                                            removeUser?.id,
                                        );
                                        await docs.save();

                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Green')
                                                    .setDescription(
                                                        `${removeUser} has been removed from the Automod Bypass List`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    } else if (removeRole) {
                                        if (!docs || docs.BypassRoles.length < 1) {
                                            return interaction.reply({
                                                embeds: [NotConfiguredEmbed],
                                                ephemeral: true,
                                            });
                                        } else if (!docs.BypassRoles.includes(removeRole?.id)) {
                                            return interaction.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setColor('Red')
                                                        .setDescription(
                                                            `${removeRole} is not in the Automod Bypass List`,
                                                        ),
                                                ],
                                                ephemeral: true,
                                            });
                                        }

                                        docs.BypassRoles = removeOne(
                                            docs.BypassRoles,
                                            removeRole.id,
                                        );
                                        await docs.save();

                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Green')
                                                    .setDescription(
                                                        `${removeRole} has been removed from the Automod Bypass List`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    }
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;

                        case 'log':
                            {
                                try {
                                    const removeChannel = options.getChannel('channel');

                                    if (!docs || docs.LogChannelIDs.length < 1) {
                                        return interaction.reply({
                                            embeds: [NotConfiguredEmbed],
                                            ephemeral: true,
                                        });
                                    } else if (!docs.LogChannelIDs.includes(removeChannel?.id)) {
                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Red')
                                                    .setDescription(
                                                        `${removeChannel} is not in the Automod Log Channel List`,
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    }

                                    docs.LogChannelIDs = removeOne(
                                        docs.LogChannelIDs,
                                        removeChannel?.id,
                                    );
                                    await docs.save();

                                    return interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Green')
                                                .setDescription(
                                                    `${removeChannel} has been removed from the Automod Log Channel List`,
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;
                    }
                }
                break;

            case 'list':
                {
                    switch (options.getSubcommandGroup()) {
                        case 'bypass':
                            {
                                try {
                                    if (!docs) {
                                        return interaction.reply({
                                            embeds: [NotConfiguredEmbed],
                                            ephemeral: true,
                                        });
                                    } else {
                                        return interaction.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setColor('Green')
                                                    .setTitle('Automod Bypass List')
                                                    .addFields(
                                                        {
                                                            name: `${icon.reply.default} Users (${docs.BypassUsers.length})`,
                                                            value: `${
                                                                docs.BypassUsers.map((user) => {
                                                                    return `<@${user}>`;
                                                                }).join(', ') || `None`
                                                            }\nㅤ`,
                                                            inline: false,
                                                        },
                                                        {
                                                            name: `${icon.reply.default} Roles (${docs.BypassRoles.length})`,
                                                            value: `${
                                                                docs.BypassRoles.map((role) => {
                                                                    return `<@&${role}>`;
                                                                }).join(', ') || `None`
                                                            }\nㅤ`,
                                                            inline: false,
                                                        },
                                                    ),
                                            ],
                                            ephemeral: true,
                                        });
                                    }
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;

                        case 'config':
                            {
                                try {
                                    const ChannelIDs: any[] = [];
                                    const Punishment: any[] = [];
                                    const LogChannelIDs: any[] = [];
                                    const Severity = ['Low', 'Medium', 'High'];

                                    if (!docs || docs.ChannelIDs.length < 1) {
                                        return interaction.reply({
                                            embeds: [NotConfiguredEmbed],
                                            ephemeral: true,
                                        });
                                    }

                                    await FetchAndPush();

                                    async function FetchAndPush() {
                                        docs?.ChannelIDs.forEach(async (c) => {
                                            const channel = await client.channels.fetch(c);
                                            ChannelIDs.push(channel!);
                                        });

                                        docs?.LogChannelIDs.forEach(async (c) => {
                                            const channel = await client.channels.fetch(c);
                                            LogChannelIDs.push(channel!);
                                        });

                                        docs?.Punishments.map(async (action: string, i: number) =>
                                            Punishment.push(
                                                `**${Severity[i]}**: ${
                                                    action.toUpperCase() || 'None'
                                                }`,
                                            ),
                                        );
                                    }

                                    return interaction.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor('Green')
                                                .setTitle(`Automod Configuration`)
                                                .addFields(
                                                    {
                                                        name: `${icon.reply.default} Channels (${ChannelIDs.length})`,
                                                        value: `${
                                                            ChannelIDs.join('\n') || 'None'
                                                        }\nㅤ`,
                                                        inline: false,
                                                    },
                                                    {
                                                        name: `${icon.reply.default} Punishments`,
                                                        value: `${Punishment.join('\n')}\nㅤ`,
                                                        inline: false,
                                                    },
                                                    {
                                                        name: `${icon.reply.default} Logging (${LogChannelIDs.length})`,
                                                        value: `${
                                                            LogChannelIDs.join('\n') || 'None'
                                                        }\nㅤ`,
                                                        inline: false,
                                                    },
                                                    {
                                                        name: `${icon.reply.default} Bypass`,
                                                        value: `\`•\` **Users:** ${
                                                            docs.BypassUsers.length || 'None'
                                                        } \n\`•\` **Roles:** ${
                                                            docs.BypassRoles.length || 'None'
                                                        }\nㅤ`,
                                                        inline: false,
                                                    },
                                                ),
                                        ],
                                        ephemeral: true,
                                    });
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                            break;
                    }
                }
                break;

            case 'punishments':
                {
                    const low = options.getString('low');
                    const medium = options.getString('medium');
                    const high = options.getString('high');

                    const Punishment: any[] = [];
                    const Severity = ['Low', 'Medium', 'High'];

                    const docs = await DB.findOneAndUpdate(
                        { GuildID: guild?.id },
                        {
                            Punishments: [low, medium, high],
                        },
                        { new: true, upsert: true },
                    );

                    docs?.Punishments.map(async (action: string, i: number) =>
                        Punishment.push(`**${Severity[i]}**: ${action.toUpperCase() || 'None'}`),
                    );

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(`Automod Punishments`)
                                .setDescription(`${Punishment.join('\n')}\nㅤ`),
                        ],
                        ephemeral: true,
                    });
                }
                break;
        }
    },
};

/**Remove Single Value From Array */
function removeOne(arr: any[], value: any) {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

export default command;
