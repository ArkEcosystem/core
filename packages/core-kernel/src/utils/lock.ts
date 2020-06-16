export class Lock {
    private exclusivePromise?: Promise<any>;

    private readonly nonExclusivePromises: Set<Promise<any>> = new Set<Promise<any>>();

    public async runNonExclusive<T>(callback: () => Promise<T>): Promise<T> {
        while (this.exclusivePromise) {
            try {
                await this.exclusivePromise;
            } catch {}
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
            try {
                await this.exclusivePromise;
            } catch {}
        }

        const exclusivePromise = (async () => {
            for (const nonExclusivePromise of this.nonExclusivePromises) {
                try {
                    await nonExclusivePromise;
                } catch {}
            }

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
