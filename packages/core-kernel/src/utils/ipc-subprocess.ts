import { ChildProcess } from "child_process";

type Actions<T extends {}> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (ReturnType<T[K]> extends void ? K : never) : never;
}[keyof T];

type Requests<T extends {}> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (ReturnType<T[K]> extends Promise<any> ? K : never) : never;
}[keyof T];

type SuccessReply<T, K extends Requests<T>> = {
    id: number;
    method: K;
    result: ReturnType<T[K]>;
};

type ErrorReply<T, K extends Requests<T>> = {
    id: number;
    method: K;
    error: string;
};

type Reply<T, K extends Requests<T>> = SuccessReply<T, K> | ErrorReply<T, K>;

type RequestCallback<T, K extends Requests<T>> = {
    resolve: (result: ReturnType<T[K]>) => void;
    reject: (error: Error) => void;
};

type RequestCallbacks<T> = RequestCallback<T, Requests<T>>;

export class IpcSubprocess<T> {
    private lastId = 1;
    private readonly subprocess: ChildProcess;
    private readonly callbacks = new Map<number, RequestCallbacks<T>>();

    public constructor(subprocess: ChildProcess) {
        this.subprocess = subprocess;
        this.subprocess.on("message", (message: Reply<T, Requests<T>>) => {
            const cb = this.callbacks.get(message.id);
            if (cb) {
                try {
                    "error" in message ? cb.reject(new Error(message.error)) : cb.resolve(message.result);
                } finally {
                    this.callbacks.delete(message.id);
                }
            }
        });
    }

    public getQueueSize(): number {
        return this.callbacks.size;
    }

    public sendAction<K extends Actions<T>>(method: K, ...args: Parameters<T[K]>): void {
        this.subprocess.send({ method, args });
    }

    public sendRequest<K extends Requests<T>>(method: K, ...args: Parameters<T[K]>): Promise<ReturnType<T[K]>> {
        return new Promise((resolve, reject) => {
            const id = this.lastId++;
            this.callbacks.set(id, { resolve, reject });
            this.subprocess.send({ id, method, args });
        });
    }
}
