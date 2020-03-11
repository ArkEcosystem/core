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

export const createLock = () => {
    type QueueItem = () => Promise<void>;
    const queue: QueueItem[] = [];

    return <T>(callback: () => Promise<T>): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            queue.push(async () => {
                try {
                    resolve(await callback());
                } catch (error) {
                    reject(error);
                } finally {
                    queue.shift();
                    if (queue.length) {
                        queue[0]();
                    }
                }
            });

            if (queue.length === 1) {
                queue[0]();
            }
        });
    };
};
