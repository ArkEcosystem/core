import { Contracts } from "@arkecosystem/core-kernel";

import { DatabaseService } from "./database-service";

export class LogServiceWrapper implements Contracts.Kernel.Logger {
    public constructor(private logger: Contracts.Kernel.Logger, private databaseService: DatabaseService) {}

    public async make(options?: any): Promise<Contracts.Kernel.Logger> {
        return this.logger.make(options);
    }
    public emergency(message: any): void {
        this.logger.emergency(message);
        this.databaseService.addEvent("log.emergency", message);
    }
    public alert(message: any): void {
        this.logger.alert(message);
        this.databaseService.addEvent("log.alert", message);
    }
    public critical(message: any): void {
        this.logger.critical(message);
        this.databaseService.addEvent("log.critical", message);
    }
    public error(message: any): void {
        this.logger.error(message);
        this.databaseService.addEvent("log.error", message);
    }
    public warning(message: any): void {
        this.logger.warning(message);
        this.databaseService.addEvent("log.warning", message);
    }
    public notice(message: any): void {
        this.logger.notice(message);
        this.databaseService.addEvent("log.notice", message);
    }
    public info(message: any): void {
        this.logger.info(message);
        this.databaseService.addEvent("log.info", message);
    }
    public debug(message: any): void {
        this.logger.debug(message);
        this.databaseService.addEvent("log.debug", message);
    }
    public suppressConsoleOutput(suppress: boolean): void {
        this.logger.suppressConsoleOutput(suppress);
    }
}
