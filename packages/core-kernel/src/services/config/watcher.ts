import nsfw from "nsfw";
import { IApplication } from "../../contracts/kernel";
import { inject, injectable } from "../../container";

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
@injectable()
export class Watcher {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof AbstractManager
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async watch(): Promise<void> {
        const configFiles: string[] = [".env", "delegates.json", "packages.js", "peers.json"];

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
