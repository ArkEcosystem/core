import get from "lodash/get";

class Config {
    private config: any;

    public init(options: any): void {
        this.config = options;
    }

    public get(key: string, defaultValue: any = null): any {
        return get(this.config, key, defaultValue);
    }
}

export const config = new Config();
