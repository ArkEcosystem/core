import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import { EventEmitter } from "@arkecosystem/core-interfaces";
import _cliProgress from "cli-progress";

export async function importSnapshot(options) {
    const snapshotManager = app.resolvePlugin<SnapshotManager>("snapshots");
    const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    const progressBar = new _cliProgress.Bar(
        {
            format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
        },
        _cliProgress.Presets.shades_classic,
    );

    emitter.on("start", data => {
        progressBar.start(data.count, 1);
    });

    emitter.on("progress", data => {
        progressBar.update(data.value);
    });

    emitter.on("complete", data => {
        progressBar.stop();
    });

    await snapshotManager.importData(options);
}
