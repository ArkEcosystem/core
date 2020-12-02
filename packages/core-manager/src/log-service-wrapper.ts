import { Contracts } from "@arkecosystem/core-kernel";

import { LogsDatabaseService } from "./database/logs-database-service";

export class LogServiceWrapper implements Contracts.Kernel.Logger {
    public constructor(private logger: Contracts.Kernel.Logger, private databaseService: LogsDatabaseService) {}

    public async make(options?: any): Promise<Contracts.Kernel.Logger> {
        return this.logger.make(options);
    }
    public emergency(message: string): void {
        this.logger.emergency(message);
        this.databaseService.add("emergency", message);
    }
    public alert(message: string): void {
        this.logger.alert(message);
        this.databaseService.add("alert", message);
    }
    public critical(message: string): void {
        this.logger.critical(message);
        this.databaseService.add("critical", message);
    }
    public error(message: string): void {
        this.logger.error(message);
        this.databaseService.add("error", message);
    }
    public warning(message: string): void {
        this.logger.warning(message);
        this.databaseService.add("warning", message);
    }
    public notice(message: string): void {
        this.logger.notice(message);
        this.databaseService.add("notice", message);
    }
    public info(message: string): void {
        this.logger.info(message);
        this.databaseService.add("info", message);
    }
    public debug(message: string): void {
        this.logger.debug(message);
        this.databaseService.add("debug", message);
    }
    public suppressConsoleOutput(suppress: boolean): void {
        this.logger.suppressConsoleOutput(suppress);
    }
}
