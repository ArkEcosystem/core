export class HeightTracker {
    private height: number;

    public constructor() {
        this.height = 1;
    }

    public setHeight(value: number): void {
        this.height = value;
    }

    public getHeight(): number {
        return this.height;
    }
}
