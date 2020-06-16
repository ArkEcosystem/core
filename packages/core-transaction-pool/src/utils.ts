export type Comparator<T> = (a: T, b: T) => number;

export class IteratorMany<T> implements Iterator<T> {
    private readonly results = new Map<Iterator<T>, IteratorResult<T>>();
    private readonly comparator: Comparator<T>;

    public constructor(iterators: Iterator<T>[], comparator: Comparator<T>) {
        this.comparator = comparator;

        for (const iterator of iterators) {
            const result = iterator.next();
            if (result.done === false) {
                this.results.set(iterator, result);
            }
        }
    }

    public next(): IteratorResult<T> {
        if (this.results.size === 0) {
            return { done: true, value: undefined };
        }

        const [iterator, result] = Array.from(this.results.entries()).reduce((min, entry) => {
            return this.comparator(entry[1].value, min[1].value) < 0 ? entry : min;
        });

        const nextResult = iterator.next();
        if (nextResult.done) {
            this.results.delete(iterator);
        } else {
            this.results.set(iterator, nextResult);
        }

        return result;
    }
}

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
