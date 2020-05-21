export interface WorkerAction {
    init(options: any): void;
    start(): Promise<void>;
    sync(data: any): void; // TODO: what type is this?
}
