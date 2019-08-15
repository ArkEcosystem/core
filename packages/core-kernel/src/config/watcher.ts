import nsfw from "nsfw";
import { Kernel } from "../contracts";

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
     * @param {Kernel.IApplication} app
     * @memberof Watcher
     */
    public constructor(readonly app: Kernel.IApplication) {}

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
