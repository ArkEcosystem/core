import { Contracts } from "@arkecosystem/core-kernel";

import { EventsDatabaseService } from "./database/events-database-service";

export class LogServiceWrapper implements Contracts.Kernel.Logger {
    public constructor(private logger: Contracts.Kernel.Logger, private databaseService: EventsDatabaseService) {}

    public async make(options?: any): Promise<Contracts.Kernel.Logger> {
        return this.logger.make(options);
    }
    public emergency(message: any): void {
        this.logger.emergency(message);
        this.databaseService.add("log.emergency", message);
    }
    public alert(message: any): void {
        this.logger.alert(message);
        this.databaseService.add("log.alert", message);
    }
    public critical(message: any): void {
        this.logger.critical(message);
        this.databaseService.add("log.critical", message);
    }
    public error(message: any): void {
        this.logger.error(message);
        this.databaseService.add("log.error", message);
    }
    public warning(message: any): void {
        this.logger.warning(message);
        this.databaseService.add("log.warning", message);
    }
    public notice(message: any): void {
        this.logger.notice(message);
        this.databaseService.add("log.notice", message);
    }
    public info(message: any): void {
        this.logger.info(message);
        this.databaseService.add("log.info", message);
    }
    public debug(message: any): void {
        this.logger.debug(message);
        this.databaseService.add("log.debug", message);
    }
    public suppressConsoleOutput(suppress: boolean): void {
        this.logger.suppressConsoleOutput(suppress);
    }
}
