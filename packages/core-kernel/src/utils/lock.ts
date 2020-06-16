export class Lock {
    private exclusivePromise?: Promise<any>;

    private readonly nonExclusivePromises: Set<Promise<any>> = new Set<Promise<any>>();

    public async runNonExclusive<T>(callback: () => Promise<T>): Promise<T> {
        while (this.exclusivePromise) {
            const safeExclusivePromise = this.exclusivePromise.catch(() => undefined);
            await safeExclusivePromise;
        }

        const nonExclusivePromise = callback();

        try {
            this.nonExclusivePromises.add(nonExclusivePromise);
            return await nonExclusivePromise;
        } finally {
            this.nonExclusivePromises.delete(nonExclusivePromise);
        }
    }

    public async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
        while (this.exclusivePromise) {
            const safeExclusivePromise = this.exclusivePromise.catch(() => undefined);
            await safeExclusivePromise;
        }

        const exclusivePromise = (async () => {
            const safeNonExclusivePromises = Array.from(this.nonExclusivePromises).map((p) => p.catch(() => undefined));
            await Promise.all(safeNonExclusivePromises);
            return await callback();
        })();

        try {
            this.exclusivePromise = exclusivePromise;
            return await exclusivePromise;
        } finally {
            this.exclusivePromise = undefined;
        }
    }
}
