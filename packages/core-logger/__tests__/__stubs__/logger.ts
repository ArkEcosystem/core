import { AbstractLogger } from "../../src";

export class Logger extends AbstractLogger {
    public make(): any {
        return this;
    }

    public error(message: string): void {
        //
    }

    public warn(message: string): void {
        //
    }

    public info(message: string): void {
        //
    }

    public debug(message: string): void {
        //
    }

    public suppressConsoleOutput(suppress: boolean): void {
        //
    }
}
