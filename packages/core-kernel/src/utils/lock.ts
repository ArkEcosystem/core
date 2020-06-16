export class Lock {
    private exclusivePromise?: Promise<any>;

    private readonly nonExclusivePromises: Set<Promise<any>> = new Set<Promise<any>>();

    public async runNonExclusive<T>(callback: () => Promise<T>): Promise<T> {
        while (this.exclusivePromise) {
            const safeExclusivePromise = this.exclusivePromise.catch(() => undefined);
            await safeExclusivePromise;
        }

        const promise = callback();

        try {
            this.nonExclusivePromises.add(promise);
            return await promise;
        } finally {
            this.nonExclusivePromises.delete(promise);
        }
    }

    public async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
        while (this.exclusivePromise) {
            const safeExclusivePromise = this.exclusivePromise.catch(() => undefined);
            await safeExclusivePromise;
        }

        const promise = (async () => {
            const safeNonExclusivePromises = Array.from(this.nonExclusivePromises).map((p) => p.catch(() => undefined));
            await Promise.all(safeNonExclusivePromises);
            return await callback();
        })();

        try {
            this.exclusivePromise = promise;
            return await promise;
        } finally {
            this.exclusivePromise = undefined;
        }
    }
}
