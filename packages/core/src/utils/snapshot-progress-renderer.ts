import { Container, Contracts } from "@arkecosystem/core-kernel";
import { SnapshotApplicationEvents } from "@arkecosystem/core-snapshots";
import { Ora } from "ora";

export class ProgressRenderer {
    private isAnyStarted: boolean = false;

    private spinner: Ora;

    private count = {
        blocks: 0,
        transactions: 0,
        rounds: 0,
    }

    private progress = {
        blocks: "---.--",
        transactions: "---.--",
        rounds: "---.--",
    }

    public constructor(spinner: Ora, app: Contracts.Kernel.Application) {
        this.spinner = spinner;

        const emitter = app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);

        emitter.listen(SnapshotApplicationEvents.SnapshotStart, {
            handle: (data) => {
                this.handleStart(data.data);
            },
        });

        emitter.listen(SnapshotApplicationEvents.SnapshotProgress, {
            handle: (data) => {
                this.handleUpdate(data.data);
            },
        });

        emitter.listen(SnapshotApplicationEvents.SnapshotComplete, {
            handle: (data) => {
                this.handleComplete(data.data);
            },
        });
    }

    private handleStart(data: { table: string; count: number }): void {
        if (data.table && data.count) {
            this.count[data.table] = data.count;

            if (!this.isAnyStarted) {
                this.isAnyStarted = true;

                this.render();
            }
        }
    }

    private handleUpdate(data: { table: string; value: number }): void {
        if (data.table && data.value) {
            this.progress[data.table] = this.calculatePercentage(this.count[data.table], data.value);

            this.render();
        }
    }

    private handleComplete(data: { table: string }): void {
        if (data.table) {
            this.progress[data.table] = "100.00";
            this.render();
        }
    }

    private calculatePercentage(count: number, value: number): string {
        const percentage: string = ((value / count) * 100).toFixed(2);

        // Append spaces to match ---.--
        return `${" ".repeat(6 - percentage.length)}${percentage}`;
    }

    private render(): void {
        this.spinner.text = `Blocks: ${this.progress.blocks} % Transactions: ${this.progress.transactions} % Rounds: ${this.progress.rounds} % \n`;
        this.spinner.render();
    }
}
