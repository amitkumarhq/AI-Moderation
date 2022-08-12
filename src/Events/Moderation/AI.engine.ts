import { AttachmentBuilder, ChannelType, EmbedBuilder, Message, TextChannel, MessageOptions } from 'discord.js';
import { BaseClient } from '../../Structures/Classes/Client.js';
import { Event } from '../../Structures/Interfaces/Event.js';
import { color } from '../../Structures/Design/color.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { icon } from '../../Structures/Design/icons.js';
import Perspective from 'perspective-api-client';
import { ChartConfiguration } from 'chart.js';
import ms from 'ms';

import DB from '../../Structures/Schemas/ModerationDB.js';

interface IScore {
    name: string;
    value: number;
}

const event: Event = {
    name: 'messageCreate',
    execute: async (message: Message, client: BaseClient) => {
        if (message.channel.type === ChannelType.DM) return;

        const msg = await message.fetch();
        const { author, member, guild, channel } = msg;

        const perspective = new Perspective({ apiKey: client.config.APIs![0].apiKey });

        // DATABASE
        const docs = await DB.findOne({ GuildID: msg.guildId });
        if (!docs) return;

        const { Punishments, LogChannelIDs, ChannelIDs, BypassUsers, BypassRoles } = docs;
        const [ PLow, PMed, PHigh ] = Punishments;
        const LogChannels = LogChannelIDs;

        // BYPASS CHECKS
        try {
            const isMemberAdmin = (await guild?.members.fetch({ user: author }))?.permissions.has('Administrator', true);

            if (author.id === client.user?.id || author.bot) return;
            if (BypassUsers.includes(author.id) || isMemberAdmin) return;
            if (BypassRoles.length) {
                for (const role of BypassRoles) {
                    if (member?.roles.cache.has(role)) return;
                }
            }
        } catch (err) {
            console.log(err);
        }

        // AI ANALYSIS
        const SCORES: IScore[] = await analyzeMessage(msg.content);
        const AvgScore = SCORES.reduce((a, b) => a + b.value, 0) / SCORES.length;

        const findAttribute = (name: string, arr: IScore[]) => arr.find((attr) => attr.name === name);

        // CHART GENERATION
        const INSULT_SCORE = await findAttribute('Insult', SCORES);
        const TOXICITY_SCORE = await findAttribute('Toxicity', SCORES);
        const PROFANITY_SCORE = await findAttribute('Profanity', SCORES);

        /**
         * Create a new Canvas for the chart
         */
        const Canvas = new ChartJSNodeCanvas({
            width: 750,
            height: 360,
            chartCallback: (ChartJS) => { },
        });

        const ChartConfig: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: ['Insult', 'Toxicity', 'Profanity'],
                datasets: [
                    {
                        label: 'Score',
                        data: [
                            INSULT_SCORE!.value,
                            TOXICITY_SCORE!.value,
                            PROFANITY_SCORE!.value,
                        ],
                        borderRadius: 20,
                        borderWidth: 8,
                        maxBarThickness: 80,
                        borderColor: [
                            `${color.Material.RED}`,
                            `${color.Material.YELLOW}`,
                            `${color.Material.BLUE}`,
                        ],
                        backgroundColor: [
                            `${color.Material.RED}50`,
                            `${color.Material.YELLOW}50`,
                            `${color.Material.BLUE}50`,
                        ],
                    },
                ],
            },
            plugins: [],
            options: {
                responsive: false,
                indexAxis: 'y',
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                plugins: {
                    title: {
                        display: false,
                        text: 'Scores',
                    },
                    legend: {
                        display: false,
                        position: 'right',
                    },
                },
            },
        };

        const image = await Canvas.renderToBuffer(ChartConfig);
        const attachment = new AttachmentBuilder(image, {
            name: 'chart.png',
            description: 'AI Analysis Scores',
        });

        // ACTION
        if (!ChannelIDs.includes(channel.id)) return;
        await takeAction(SCORES);

        async function takeAction(SCORES: IScore[]) {
            const Embeds = {
                Delete: new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`[MOD] Deleted a message`)
                    .setDescription(`
                        ${icon.reply.continue.start} **User**: ${author} (${author.id})
						${icon.reply.continue.end} **Channel**: ${channel}
				    `)
                    .addFields(
                        { name: 'Message', value: `${message}`, inline: false },
                        { name: 'Scores', value: SCORES.map((score) => `${icon.reply.default} **${score.name}**: ${score.value}`).join('\n'), inline: false }
                    )
                    .setImage('attachment://chart.png')
                    .setTimestamp(),

                Timeout: new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`[MOD] Timed out a user`)
                    .setDescription(`
                        ${icon.reply.continue.start} **User**: ${author} (${author.id})
						${icon.reply.continue.end} **Channel**: ${channel}    
                    `)
                    .addFields(
                        { name: 'Message', value: `${message}`, inline: false },
                        { name: 'Scores', value: SCORES.map((score) => `${icon.reply.default} **${score.name}**: ${score.value}`).join('\n'), inline: false }
                    )
                    .setImage('attachment://chart.png')
                    .setTimestamp(),

                Kick: new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`[MOD] Kicked a user from the server`)
                    .setDescription(`
                        ${icon.reply.continue.start} **User**: ${author} (${author.id})
						${icon.reply.continue.end} **Channel**: ${channel}
					`)
                    .addFields(
                        { name: 'Message', value: `${message}`, inline: false },
                        { name: 'Scores', value: SCORES.map((score) => `${icon.reply.default} **${score.name}**: ${score.value}`).join('\n'), inline: false }
                    )
                    .setImage('attachment://chart.png')
                    .setTimestamp(),

                Ban: new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`[MOD] Banned a user from the server`)
                    .setDescription(`
                        ${icon.reply.continue.start} **User**: ${author} (${author.id})
						${icon.reply.continue.end} **Channel**: ${channel}
					`)
                    .addFields(
                        { name: 'Message', value: `${message}`, inline: false },
                        { name: 'Scores', value: SCORES.map((score) => `${icon.reply.default} **${score.name}**: ${score.value}`).join('\n'), inline: false }
                    )
                    .setImage('attachment://chart.png')
                    .setTimestamp(),
            };

            if (AvgScore > 0.75 && AvgScore <= 0.8) {
                switch (PLow) {
                    case 'delete': {
                        await deleteMessageAction(msg, LogChannels, { embeds: [Embeds.Delete], files: [attachment] });
                        // await msg.delete();

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Delete], files: [attachment] });
                        // });
                    }
                    break;

                    case 'timeout': {
                        timeoutAction(msg, LogChannels, { embeds: [Embeds.Timeout], files: [attachment] }, {
                            embeds: [
                                Embeds.Timeout.setTitle('You Have Been Timed Out!').setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`)
                            ], files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.timeout(ms('5m'), 'Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Timeout], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Timeout
                        //             .setTitle('You Have Been Timed Out!')
                        //             .setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'kick': {
                        kickAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Kick.setTitle('You Have Been Kicked!').setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.kick('Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Kick], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Kick
                        //             .setTitle('You Have Been Kicked!')
                        //             .setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'ban': {
                        banAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Ban
                                    .setTitle('You Have Been Banned!')
                                    .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.ban({ reason: 'Toxicity Detected' });

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;

                        //     await channel.send({ embeds: [Embeds.Ban], files: [attachment] });

                        //     await member?.send({
                        //         embeds: [
                        //             Embeds.Ban
                        //                 .setTitle('You Have Been Banned!')
                        //                 .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                        //         ],
                        //         files: [attachment],
                        //     });
                        // });
                    }
                    break;
                }

            } else if (AvgScore > 0.8 && AvgScore <= 0.85) {
                switch (PMed) {
                    case 'delete': {
                        await deleteMessageAction(msg, LogChannels, { embeds: [Embeds.Delete], files: [attachment] });
                        // await msg.delete();

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Delete], files: [attachment] });
                        // });
                    }
                    break;

                    case 'timeout': {
                        timeoutAction(msg, LogChannels, { embeds: [Embeds.Timeout], files: [attachment] }, {
                            embeds: [
                                Embeds.Timeout.setTitle('You Have Been Timed Out!').setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`)
                            ], files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.timeout(ms('5m'), 'Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Timeout], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Timeout
                        //             .setTitle('You Have Been Timed Out!')
                        //             .setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'kick': {
                        kickAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Kick.setTitle('You Have Been Kicked!').setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.kick('Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Kick], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Kick
                        //             .setTitle('You Have Been Kicked!')
                        //             .setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'ban': {
                        banAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Ban
                                    .setTitle('You Have Been Banned!')
                                    .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.ban({ reason: 'Toxicity Detected' });

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;

                        //     await channel.send({ embeds: [Embeds.Ban], files: [attachment] });

                        //     await member?.send({
                        //         embeds: [
                        //             Embeds.Ban
                        //                 .setTitle('You Have Been Banned!')
                        //                 .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                        //         ],
                        //         files: [attachment],
                        //     });
                        // });
                    }
                    break;
                }

            } else if (AvgScore > 0.85 && AvgScore >= 0.9) {
                switch (PHigh) {
                    case 'delete': {
                        await deleteMessageAction(msg, LogChannels, { embeds: [Embeds.Delete], files: [attachment] });
                        // await msg.delete();

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Delete], files: [attachment] });
                        // });
                    }
                    break;

                    case 'timeout': {
                        timeoutAction(msg, LogChannels, { embeds: [Embeds.Timeout], files: [attachment] }, {
                            embeds: [
                                Embeds.Timeout.setTitle('You Have Been Timed Out!').setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`)
                            ], files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.timeout(ms('5m'), 'Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Timeout], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Timeout
                        //             .setTitle('You Have Been Timed Out!')
                        //             .setDescription(`${author} You are on a 5 minutes timeout in **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'kick': {
                        kickAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Kick.setTitle('You Have Been Kicked!').setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.kick('Toxicity Detected');

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;
                        //     await channel.send({ embeds: [Embeds.Kick], files: [attachment] });
                        // });

                        // await member?.send({
                        //     embeds: [
                        //         Embeds.Kick
                        //             .setTitle('You Have Been Kicked!')
                        //             .setDescription(`${author} You have been kicked from **${guild?.name}** for Toxic Messages!`),
                        //     ],
                        //     files: [attachment],
                        // });
                    }
                    break;

                    case 'ban': {
                        banAction(msg, LogChannels, { embeds: [Embeds.Kick], files: [attachment] }, {
                            embeds: [
                                Embeds.Ban
                                    .setTitle('You Have Been Banned!')
                                    .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                            ],
                            files: [attachment]
                        });
                        // await msg.delete();
                        // await member?.ban({ reason: 'Toxicity Detected' });

                        // LogChannels.forEach(async (id) => {
                        //     const channel = guild?.channels.cache.get(id) as TextChannel;

                        //     await channel.send({ embeds: [Embeds.Ban], files: [attachment] });

                        //     await member?.send({
                        //         embeds: [
                        //             Embeds.Ban
                        //                 .setTitle('You Have Been Banned!')
                        //                 .setDescription(`${author} You have been banned from **${guild?.name}** for Toxic Messages!`),
                        //         ],
                        //         files: [attachment],
                        //     });
                        // });
                    }
                    break;
                }
            }
        };

        async function analyzeMessage(message: string) {
            const analyzeRequest = {
                comment: {
                    text: message,
                },
                requestedAttributes: {
                    TOXICITY: {},
                    PROFANITY: {},
                    INSULT: {},
                },
            };

            try {
                const speech = await perspective.analyze(analyzeRequest);

                const INSULT_SCORE: number = speech.attributeScores.INSULT.summaryScore.value;
                const TOXICITY_SCORE: number = speech.attributeScores.TOXICITY.summaryScore.value;
                const PROFANITY_SCORE: number = speech.attributeScores.PROFANITY.summaryScore.value;

                return new Promise((resolve: (value: any) => any, reject) => {
                    resolve(
                        [
                            { name: 'Insult', value: INSULT_SCORE },
                            { name: 'Toxicity', value: TOXICITY_SCORE },
                            { name: 'Profanity', value: PROFANITY_SCORE },

                        ],
                    );
                });
            } catch (err) {
                console.log(err);
            }
        }
    }
};

async function deleteMessageAction(msg: Message, LogChannels: string[], SendData: MessageOptions) {
    await msg.delete();

    LogChannels.forEach(async (id) => {
        const channel = msg.guild?.channels.cache.get(id) as TextChannel;
        await channel.send(SendData);
    });

    return true;
}

async function timeoutAction(msg: Message, LogChannels: string[], SendData: MessageOptions, MemberSend: MessageOptions) {
    await msg.delete();
    await msg.member?.timeout(ms('5m'), 'Toxicity Detected');

    LogChannels.forEach(async (id) => {
        const channel = msg.guild?.channels.cache.get(id) as TextChannel;
        await channel.send(SendData);
    });

    await msg.member?.send(MemberSend);
}

async function kickAction(msg: Message, LogChannels: string[], SendData: MessageOptions, MemberSend: MessageOptions) {
    await msg.delete();
    await msg.member?.kick('Toxicity Detected');

    LogChannels.forEach(async (id) => {
        const channel = msg.guild?.channels.cache.get(id) as TextChannel;
        await channel.send(SendData);
    });

    await msg.member?.send(MemberSend);
}

async function banAction(msg: Message, LogChannels: string[], SendData: MessageOptions, MemberSend: MessageOptions) {
    await msg.delete();
    await msg.member?.ban({ reason: 'Toxicity Detected' });

    LogChannels.forEach(async (id) => {
        const channel = msg.guild?.channels.cache.get(id) as TextChannel;
        await channel.send(SendData);
    });

    await msg.member?.send(MemberSend);
}

export default event;