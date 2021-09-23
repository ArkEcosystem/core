"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SortedArray {
    constructor(compareFunction) {
        this.sortedArray = [];
        this.compareFunction = compareFunction;
    }
    size() {
        return this.sortedArray.length;
    }
    isEmpty() {
        return this.sortedArray.length === 0;
    }
    getCompareFunction() {
        return this.compareFunction;
    }
    insert(item) {
        const index = this.sortedArray.findIndex(current => this.compareFunction(current, item) > 0);
        if (index === -1) {
            // item is bigger than all the elements in the array
            this.sortedArray.push(item);
        }
        else {
            this.sortedArray.splice(index, 0, item);
        }
    }
    removeAtIndex(index) {
        if (index < 0) {
            return;
        }
        this.sortedArray.splice(index, 1);
    }
    findIndex(findFunction) {
        return this.sortedArray.findIndex(findFunction);
    }
    getAll() {
        return [...this.sortedArray]; // return a clone
    }
    getStrictlyBelow(max) {
        const itemsBelow = [];
        for (const item of this.sortedArray) {
            if (this.compareFunction(item, max) < 0) {
                itemsBelow.push(item);
            }
            else {
                // no need to go further as the array is sorted
                return itemsBelow;
            }
        }
        return itemsBelow;
    }
    getStrictlyBetween(min, max) {
        const itemsBetween = [];
        let i = 0;
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
exports.SortedArray = SortedArray;
//# sourceMappingURL=sorted-array.js.map