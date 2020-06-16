export class Lock {
    private concurrency: number = 0;

    private currentExclusive?: Promise<any>;

    private readonly currentNonExclusive: Set<Promise<any>> = new Set<Promise<any>>();

    public isIdle(): boolean {
        return this.concurrency === 0;
    }

    public async runNonExclusive<T>(callback: () => Promise<T>): Promise<T> {
        try {
            // count this execution
            this.concurrency++;

            // wait for potentially several exclusive executions to finish
            while (this.currentExclusive) {
                await this.currentExclusive.catch(() => undefined);
            }

            // start execution which may throw and it's ok
            const nonExclusivePromise = callback();

            try {
                // remember this execution, so new exclusive execution can wait for it to finish
                this.currentNonExclusive.add(nonExclusivePromise);

                // wait for execution to finish
                return await nonExclusivePromise;
            } finally {
                // forget finished execution
                this.currentNonExclusive.delete(nonExclusivePromise);
            }
        } finally {
            // one parallel execution less
            this.concurrency--;
        }
    }

    public async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
        try {
            // count this execution
            this.concurrency++;

            // wait for potentially several exclusive executions to finish
            while (this.currentExclusive) {
                await this.currentExclusive.catch(() => undefined);
            }

            const exclusivePromise = (async () => {
                // wait for all non-exclusive executions to finish
                await Promise.all(Array.from(this.currentNonExclusive).map((p) => p.catch(() => undefined)));

                // run exclusive execution
                return callback();
            })();

            try {
                // remember this execution, so new executions can wait for it to finish
                this.currentExclusive = exclusivePromise;

                // wait for execution to finish
                return await exclusivePromise;
            } finally {
                // forget finished execution
                this.currentExclusive = undefined;
            }
        } finally {
            // one parallel execution less
            this.concurrency--;
        }
    }
}
