import Listr from "listr";

import { injectable } from "../ioc";

/**
 * @export
 * @class TaskList
 */
@injectable()
export class TaskList {
    /**
     * @static
     * @param {{ title: string; task: any }[]} tasks
     * @returns {Promise<void>}
     * @memberof TaskList
     */
    public async render(tasks: { title: string; task: any }[]): Promise<void> {
        return new Listr(tasks).run();
    }
}
