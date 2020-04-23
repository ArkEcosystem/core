export class HeightTracker {
    private height: number;

    public constructor() {
        this.height = 1;
    }

    public setHeight(value: number): void {
        this.height = value;
    }

    public getHeight(): number | undefined {
        return this.height;
    }
}
