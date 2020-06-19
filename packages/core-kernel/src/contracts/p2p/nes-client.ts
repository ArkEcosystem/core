export interface Client {
    connect(options: any): Promise<any>;
    overrideReconnectionAuth(auth: any): boolean;
    reauthenticate(auth: any): Promise<any>;
    disconnect(): Promise<any>;
    request(options: any): Promise<any>;
    message(message: any): Promise<any>;
    subscriptions(): string[];
    subscribe(path: any, handler: any): Promise<any>;
    unsubscribe(path: any, handler: any): Promise<any>;
}