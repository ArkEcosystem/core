type Actions<T extends {}> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (ReturnType<T[K]> extends void ? K : never) : never;
}[keyof T];

type Requests<T extends {}> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (ReturnType<T[K]> extends Promise<any> ? K : never) : never;
}[keyof T];

export class IpcHandler<T> {
    private readonly handler: T;

    public constructor(handler: T) {
        this.handler = handler;
    }

    public handleAction<K extends Actions<T>>(method: K): void {
        process.on("message", (message) => {
            /* istanbul ignore else */
            if (message.method === method) {
                this.handler[method](...message.args);
            }
        });
    }

    public handleRequest<K extends Requests<T>>(method: K): void {
        process.on("message", async (message) => {
            /* istanbul ignore else */
            if (message.method === method) {
                try {
                    const result = await this.handler[method](...message.args);
                    process.send!({ id: message.id, result });
                } catch (error) {
                    process.send!({ id: message.id, error: error.message });
                }
            }
        });
    }
}
