import get from "lodash/get";
import set from "lodash/set";

export class Config {
    private config : {};

    public init(options: any): void {
        this.config = {};
        Object.assign(console, options)
    }

    public get(key: string, defaultValue: any = null): any {
        return get(this.config, key, defaultValue);
    }

    public set(key: string, value: any): void {
        set(this.config, key, value);
    }
}
