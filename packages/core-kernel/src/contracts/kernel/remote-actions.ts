export type RemoteActionHandler = () => Promise<any>;

export interface RemoteAction {
    name: string;
    handler: RemoteActionHandler;
}

export interface RemoteActionsService {
    register(remoteAction: RemoteAction): void;
}
