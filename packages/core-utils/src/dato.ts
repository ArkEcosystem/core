export class Dato {
    private date: Date = new Date();

    public constructor(dateTime?: string) {
        if (dateTime) {
            this.date = new Date(Date.parse(dateTime));
        }

        this.ensureUTC();
    }

    public diff(compareTo: Date): number {
        return Math.abs(compareTo.getTime() - this.date.getTime());
    }

    public isAfter(compareTo: Date): boolean {
        return this.date > compareTo;
    }

    public isBefore(compareTo: Date): boolean {
        return !this.isAfter(compareTo);
    }

    public addSeconds(amount: number): Dato {
        this.add(amount, "Seconds");

        return this;
    }

    public addMinutes(amount: number): Dato {
        this.add(amount, "Minutes");

        return this;
    }

    public subtractSeconds(amount: number): Dato {
        this.subtract(amount, "Seconds");

        return this;
    }

    public subtractMinutes(amount: number): Dato {
        this.subtract(amount, "Minutes");

        return this;
    }

    public toDate(): Date {
        return this.date;
    }

    public toMilliseconds(): number {
        return this.date.valueOf();
    }

    public toUTC(): string {
        return this.date.toUTCString();
    }

    public toISO(): string {
        return this.date.toISOString();
    }

    public toUnix(): number {
        return +Math.floor(this.date.getTime() / 1000).toFixed(0);
    }

    private add(amount: number, unit: string): void {
        this.date[`set${unit}`](+this.date[`get${unit}`]() + amount);
    }

    private subtract(amount: number, unit: string): void {
        this.date[`set${unit}`](+this.date[`get${unit}`]() - amount);
    }

    private ensureUTC() {
        this.date = new Date(this.date.toUTCString());
    }
}

export function dato(dateTime?: string): Dato {
    return new Dato(dateTime);
}
