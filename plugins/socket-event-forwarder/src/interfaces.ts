export interface IOptions {
    enabled: boolean;
    port: number;
    events: string[];
    confirmations: number[];
    customEvents: string[];
    systeminformationInterval: number;
    networkLatencyInterval: number;
    blockheightCurrentInterval: number;
}
