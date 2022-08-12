import { ClientEvents } from 'discord.js';

interface EventOptions {
    ONCE?: boolean;
    REST?: boolean;
}

export interface Event {
    name: keyof ClientEvents;
    options?: EventOptions;
    execute: (...args: any[]) => any;
}
