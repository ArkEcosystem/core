import nsfw from "nsfw";
import { IApplication } from "../../contracts/kernel";
import { inject } from "../../ioc";

/**
 * @interface IFileEvent
 */
interface IFileEvent {
    /**
     * @type {number}
     * @memberof IFileEvent
     */
    action: number;

    /**
     * @type {string}
     * @memberof IFileEvent
     */
    directory: string;

    /**
     * @type {string}
     * @memberof IFileEvent
     */
    file: string;
}

/**
 * @export
 * @class Watcher
 */
export class Watcher {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof AbstractManager
     */
    private readonly app: IApplication;

    /**
     * Creates an instance of Watcher.
     *
     * @param {{ app: IApplication }} { app }
     * @memberof Watcher
     */
    public constructor(@inject("app") app: IApplication) {
        this.app = app;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async watch(): Promise<void> {
        const configFiles = [".env", "config.yml"];

        const watcher = await nsfw(this.app.configPath(), (events: IFileEvent[]) => {
            for (const event of events) {
                if (configFiles.includes(event.file) && event.action === nsfw.actions.MODIFIED) {
                    this.app.reboot();
                }
            }
        });

        await watcher.start();
    }
}
