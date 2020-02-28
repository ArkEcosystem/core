import Table3 from "cli-table3";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Table
 */
@injectable()
export class Table {
    /**
     * @private
     * @type {Logger}
     * @memberof Command
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @static
     * @param {string[]} head
     * @param {*} callback
     * @param {object} [opts={}]
     * @memberof Table
     */
    public render(head: string[], callback: any, opts: object = {}): void {
        const table = new Table3({
            ...{
                head,
                chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
            },
            ...opts,
        });

        callback(table);

        this.logger.log(table.toString());
    }
}
