import { injectable } from "../ioc";

/**
 * @export
 * @class Clear
 */
@injectable()
export class Clear {
    /**
     * @static
     * @memberof Clear
     */
    public render(): void {
        process.stdout.write("\x1b[2J");
        process.stdout.write("\x1b[0f");
    }
}
