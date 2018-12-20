export abstract class AbstractCommand {
    constructor(readonly options: any) {}

    protected isInterface(): boolean {
        return !this.isInteractive();
    }

    protected isInteractive(): boolean {
        return !!this.options.interactive;
    }
}
