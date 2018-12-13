import { AbstractLogger } from "../../src/logger";

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

    public verbose(message: string): void {
        //
    }

    public printTracker(title: string, current: number, max: number, postTitle: string, figures: number): void {
        //
    }

    public stopTracker(title: string, current: number, max: number): void {
        //
    }

    public suppressConsoleOutput(suppress: boolean): void {
        //
    }
}
