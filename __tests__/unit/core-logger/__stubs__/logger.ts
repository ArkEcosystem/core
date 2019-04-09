import { AbstractLogger } from "../../../../packages/core-logger/src";

export class Logger extends AbstractLogger {
    protected logger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };

    public make(): any {
        if (this.options.stubLogger) {
            this.logger = this.options.stubLogger;
        }

        return this;
    }

    public error(message: string): boolean {
        return this.log("error", message);
    }

    public warn(message: string): boolean {
        return this.log("warn", message);
    }

    public info(message: string): boolean {
        return this.log("info", message);
    }

    public debug(message: string): boolean {
        return this.log("debug", message);
    }

    public verbose(message: string): boolean {
        return this.log("verbose", message);
    }
}
