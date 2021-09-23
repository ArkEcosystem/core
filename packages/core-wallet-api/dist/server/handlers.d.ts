export declare const config: {
    handler(): Promise<{
        data: {
            version: string;
            network: {
                version: any;
                name: any;
                nethash: any;
                explorer: any;
                token: {
                    name: any;
                    symbol: any;
                };
            };
            plugins: import("@arkecosystem/core-interfaces/dist/core-p2p").IPeerPlugins;
        };
    }>;
    config: {
        cors: boolean;
    };
};
