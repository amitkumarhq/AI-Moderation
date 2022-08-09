import { BaseClient } from '../Classes/Client.js';
import { Event, Command } from '../Interfaces/index.js';
import { pathToFileURL } from 'url';
import { promisify } from 'util';
import glob from 'glob';
import path from 'path';

const PG = promisify(glob);

export class Handler {
    constructor() {

    }

    public async loadEvents(client: BaseClient) {
        const EventsDir = await PG(`${process.cwd()}/dist/Events/*/*{.ts,.js}`);

        EventsDir.forEach(async (file) => {
            const eventPath = path.resolve(file);
            const event: Event = (await import(`${pathToFileURL(eventPath)}`)).default;

            if (event.options?.ONCE) {
                client.once(event.name, (...args) => event.execute(...args, client));

            } else {
                client.on(event.name, (...args) => event.execute(...args, client));

            }

            client.events.set(event.name, event);

        });

    }

    public async loadCommands(client: BaseClient) {
        let CmdArray: any[] = [];
        let DevArray: any[] = [];

        const CmdsDir = await PG(`${process.cwd()}/dist/Commands/*/*{.ts,.js}`);
        CmdsDir.forEach(async (file) => {
            const commandPath = path.resolve(file);
            const command: Command = (await import(`${pathToFileURL(commandPath)}`)).default;

            if (file.endsWith('.dev.ts') || file.endsWith('.dev.js')) {
                DevArray.push(command.data.toJSON());
                client.commands.set(command.data.name, command);

            } else {
                CmdArray.push(command.data.toJSON());
                client.commands.set(command.data.name, command);

            }

            // Register Commands
            client.on('ready', async () => {
                // PUBLIC Commands
                client.application?.commands.set(CmdArray);

                // DEV Commands
                client.config.DevGuilds.forEach(async (guild) => {
                    await client.guilds.cache.get(guild.id)?.commands.set(DevArray);

                });

            });

        });

    }

}
