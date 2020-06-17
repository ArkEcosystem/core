type CompareFunction<T> = (a: T, b: T) => number;
type FindFunction<T> = (value: T, index?: number) => boolean;

export class SortedArray<T> {
    private sortedArray: T[] = [];
    private compareFunction: CompareFunction<T>;

    constructor(compareFunction: CompareFunction<T>) {
        this.compareFunction = compareFunction;
    }

    public size(): number {
        return this.sortedArray.length;
    }

    public isEmpty(): boolean {
        return this.sortedArray.length === 0;
    }

    public getCompareFunction(): CompareFunction<T> {
        return this.compareFunction;
    }

    public insert(item: T): void {
        const index = this.sortedArray.findIndex(current => this.compareFunction(current, item) > 0);
        if (index === -1) {
            // item is bigger than all the elements in the array
            this.sortedArray.push(item);
        } else {
            this.sortedArray.splice(index, 0, item);
        }
    }

    public removeAtIndex(index: number): void {
        if (index < 0) {
            return;
        }
        this.sortedArray.splice(index, 1);
    }

    public findIndex(findFunction: FindFunction<T>): number {
        return this.sortedArray.findIndex(findFunction);
    }

    public getAll(): T[] {
        return [...this.sortedArray]; // return a clone
    }

    public getStrictlyBelow(max: T): T[] {
        const itemsBelow = [];
        for (const item of this.sortedArray) {
            if (this.compareFunction(item, max) < 0) {
                itemsBelow.push(item);
            } else {
                // no need to go further as the array is sorted
                return itemsBelow;
            }
        }
        return itemsBelow;
    }

    public getStrictlyBetween(min: T, max: T): T[] {
        const itemsBetween = [];
        let i: number = 0;

        for (; i < this.sortedArray.length && this.compareFunction(this.sortedArray[i], min) <= 0; i++) {
            // tslint:disable:no-empty
        }

        // we are now either above min or at the end of the array
        for (; i < this.sortedArray.length && this.compareFunction(this.sortedArray[i], max) < 0; i++) {
            itemsBetween.push(this.sortedArray[i]);
        }

        return itemsBetween;
    }
}
