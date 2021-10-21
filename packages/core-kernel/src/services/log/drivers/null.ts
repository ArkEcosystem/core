import { Logger } from "../../../contracts/kernel/log";
import { injectable } from "../../../ioc";

@injectable()
export class NullLogger implements Logger {
    /**
     * @param {*} [options]
     * @returns {Promise<Logger>}
     * @memberof MemoryLogger
     */
    public async make(options?: any): Promise<Logger> {
        return this;
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public emergency(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public alert(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public critical(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public error(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public warning(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public notice(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public info(message: any): void {
        //
    }

    /**
     * @param {*} message
     * @memberof MemoryLogger
     */
    public debug(message: any): void {
        //
    }

    /**
     * @param {boolean} suppress
     * @memberof MemoryLogger
     */
    public suppressConsoleOutput(suppress: boolean): void {
        //
    }

    /**
     * Dispose logger.
     *
     * @returns {Promise<void>}
     * @memberof NullLogger
     */
    public async dispose(): Promise<void> {
        //
    }
}
