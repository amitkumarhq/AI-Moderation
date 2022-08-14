import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { BaseClient } from '../../Structures/Classes/Client.js';
import { Event } from '../../Structures/Interfaces/Event.js';

const event: Event = {
    name: 'interactionCreate',
    options: {
        ONCE: false,
        REST: false,
    },

    execute(interaction: CommandInteraction, client: BaseClient) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('🛑 Error')
                        .setDescription('This command is outdated.'),
                ],
                ephemeral: true,
            });
        }

        command.execute(interaction, client);
    },
};

export default event;
