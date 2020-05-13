export type RemoteActionHandler = (params: any) => Promise<any>;

export interface RemoteAction {
    name: string;
    handler: RemoteActionHandler;
    schema?: any;
}

export interface RemoteActionsService {
    register(remoteAction: RemoteAction): void;
}
