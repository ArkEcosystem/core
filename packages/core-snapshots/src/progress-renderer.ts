import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Ora } from "ora";

import { SnapshotApplicationEvents } from "./events";

export class ProgressRenderer {
    private isAnyStarted: boolean = false;

    private spinner: Ora;

    private count = {
        blocks: 0,
        transactions: 0,
        rounds: 0,
    };

    private progress = {
        blocks: "---.--",
        transactions: "---.--",
        rounds: "---.--",
    };

    public constructor(spinner: Ora, app: Contracts.Kernel.Application) {
        this.spinner = spinner;

        const events = app.get<Contracts.Kernel.EventDispatcher>(Container.Identifiers.EventDispatcherService);

        events.listen(SnapshotApplicationEvents.SnapshotStart, {
            handle: (data) => {
                this.handleStart(data.data);
            },
        });

        events.listen(SnapshotApplicationEvents.SnapshotProgress, {
            handle: (data) => {
                this.handleUpdate(data.data);
            },
        });

        events.listen(SnapshotApplicationEvents.SnapshotComplete, {
            handle: (data) => {
                this.handleComplete(data.data);
            },
        });
    }

    private handleStart(data: { table: string; count: number }): void {
        /* istanbul ignore else */
        if (data.table && data.count) {
            this.count[data.table] = data.count;

            /* istanbul ignore else */
            if (!this.isAnyStarted) {
                this.isAnyStarted = true;

                this.render();
            }
        }
    }

    private handleUpdate(data: { table: string; value: number }): void {
        /* istanbul ignore else */
        if (data.table && data.value) {
            this.progress[data.table] = this.calculatePercentage(this.count[data.table], data.value);

            this.render();
        }
    }

    private handleComplete(data: { table: string }): void {
        /* istanbul ignore else */
        if (data.table) {
            this.progress[data.table] = "100.00";
            this.render();
        }
    }

    private calculatePercentage(count: number, value: number): string {
        const percentage: string = ((value / count) * 100).toFixed(2);

        // Append spaces to match ---.-- pattern
        return `${" ".repeat(6 - percentage.length)}${percentage}`;
    }

    private render(): void {
        this.spinner.text = `Blocks: ${this.progress.blocks} % Transactions: ${this.progress.transactions} % Rounds: ${this.progress.rounds} % \n`;
        this.spinner.render();
    }
}
