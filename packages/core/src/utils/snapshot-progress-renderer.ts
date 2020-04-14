import { Ora } from "ora";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { SnapshotApplicationEvents } from "@arkecosystem/core-snapshots";

export class ProgressRenderer {
    isAnyStarted: boolean = false;

    private spinner: Ora;

    private blocksProgress: string = "---.--";
    private transactionsProgress: string = "---.--";
    private roundsProgress: string = "---.--";

    // @ts-ignore
    private blocksCount: number = 0;
    // @ts-ignore
    private transactionsCount: number = 0;
    // @ts-ignore
    private roundsCount: number = 0;

    private interval?: NodeJS.Timeout;

    public constructor(spinner: Ora, kernelApp: Contracts.Kernel.Application) {
        this.spinner = spinner;

        const emitter = kernelApp.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);

        emitter.listen(SnapshotApplicationEvents.SnapshotStart, { handle: (data) => { this.handleStart(data.data) } });

        emitter.listen(SnapshotApplicationEvents.SnapshotProgress, { handle: (data) => { this.handleUpdate(data.data) } });

        emitter.listen(SnapshotApplicationEvents.SnapshotComplete, { handle: (data) => { this.handleComplete(data.data) } });
    }

    private handleStart(data: {table: string, count: number}): void {
        if (data.table && data.count) {
            this[`${data.table}Count`] = data.count;

            if (!this.isAnyStarted) {
                this.isAnyStarted = true;
                this.interval = setInterval(() => {
                    this.render()
                }, 100);
            }
        }
    }

    private handleUpdate(data: {table:string, value: number}): void {
        if (data.table && data.value) {
            this[`${data.table}Progress`] = this.calculatePercentage(this[`${data.table}Count`], data.value);
        }
    }

    private handleComplete(data: {table: string}): void {
        if (data.table) {
            clearInterval(this.interval!);

            this[`${data.table}Progress`] = "100.00";
            this.render();
        }
    }

    private calculatePercentage(count: number, value: number): string {
        let percentage: string = ((value / count) * 100).toFixed(2);

        // Append spaces to match ---.--
        return `${" ".repeat(6 - percentage.length)}${percentage}`;
    }

    private render(): void {
        this.spinner.text = `Blocks: ${this.blocksProgress} % Transactions: ${this.transactionsProgress} % Rounds: ${this.roundsProgress} % \n`;
        this.spinner.render();
    }
}
