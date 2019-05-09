export interface IPeerData {
    ip: string;
    port: number;
    version: string;
}

export interface IResponseConfig {
    version: string;
    network: {
        version: string;
        name: string;
        nethash: string;
        explorer: string;
        token: {
            name: string;
            symbol: string;
        };
    };
    plugins: { [key: string]: { enabled: boolean; port: number } };
}
