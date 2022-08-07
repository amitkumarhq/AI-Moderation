import { SlashCommandBuilder } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | any;
    execute: (...args: any[]) => any;

}
