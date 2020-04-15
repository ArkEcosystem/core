export interface Action {
    init(options: any): void,
    start(): Promise<void>
}
