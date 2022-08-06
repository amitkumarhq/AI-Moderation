import { Config } from './Structures/Interfaces/index.js';

const Config: Config = {
	TOKEN: 'YOUR_TOKEN_HERE',
	Database: {
		MongoDB: 'MONGODB_URI_HERE',
	},
	DevGuilds: [
		{
			name: 'Vape Support',
			id: '952168682937798656',
		},
	],
	OwnerIds: [
		{
			name: 'Treotty',
			id: '735504973504184380',
		},
	],
	AdminIds: [
		{
			name: 'Treotty',
			id: '735504973504184380',
		},
	],
	APIs: [
		{
			name: 'Perspective API Key',
			apiKey: 'PERSPECTIVE_API_KEY_HERE',
		},
	],
};

export default Config;
