import boxen, { Options } from 'boxen';
import chalk from 'chalk';

interface ItemOptions {
	name: string;
	value: string;
}

export class Box {
	constructor() {}

	public async createBox() {
		const arr: string[] = [];
		return arr;
	}

	public async addItem(box: string[], options: ItemOptions) {
		box.push(`${options.name}: ${options.value}`);
	}

	public async addItems(box: string[], options: ItemOptions[]) {
		options.forEach((item) => {
			box.push(`${item.name}: ${item.value}`);
		});
	}

	public async showBox(box: string[], options: Options) {
		return console.log(boxen(box.join('\n'), options));
	}
}
