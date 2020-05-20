export type ProcessActionHandler = () => Promise<any>;

export interface ProcessAction {
    name: string;
    handler: ProcessActionHandler;
}

export interface ProcessActionsService {
    register(remoteAction: ProcessAction): void;
}
