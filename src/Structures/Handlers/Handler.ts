import { BaseClient } from '../Classes/Client.js';
import { Event, Command } from '../Interfaces/index.js';
import { promisify } from 'util';
import glob from 'glob';

const PG = promisify(glob);

export class Handler {
	constructor() {}

	public async loadEvents(client: BaseClient) {
        const EventsDir = await PG(`${process.cwd()}/dist/Events/*/*{.ts,.js}`);

        EventsDir.forEach(async (file) => {
            const event: Event = (await import(file)).default;

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
			if (file.endsWith('.dev.ts') || file.endsWith('.dev.js')) {
				const command: Command = (await import(file)).default;
				DevArray.push(command.data.toJSON());
				client.commands.set(command.data.name, command);
			} else {
				const command: Command = (await import(file)).default;
				CmdArray.push(command.data.toJSON());
				client.commands.set(command.data.name, command);
			}

			// Register Commands
			client.on('ready', async () => {
				// PUBLIC Commands
				client.guilds.cache.forEach(async (guild) => {
					client.application?.commands.set(CmdArray);
				});

				// DEV Commands
				client.config.DevGuilds.forEach(async (guild) => {
					await client.guilds.cache.get(guild.id)?.commands.set(DevArray);
				});
			});
		});
	}
}
