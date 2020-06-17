export class PoolError extends Error {
    public readonly type: string;

    public constructor(message: string, type: string) {
        super(message);
        this.type = type;
    }
}
