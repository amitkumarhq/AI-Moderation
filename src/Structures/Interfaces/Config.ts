export interface Config {
    TOKEN: string;
    Database: {
        MongoDB: string;
        Redis?: string;

    };
    OwnerIds?: object[];
    AdminIds?: object[];
    Webhooks?: object[];
    DevGuilds: [
        {
            name: string;
            id: string;

        }

    ];
    APIs?: [
        {
            name: string;
            apiKey: string;

        }

    ];

}
