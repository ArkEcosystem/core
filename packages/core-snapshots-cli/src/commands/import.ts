import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import _cliProgress from "cli-progress";

export async function importSnapshot(options) {
    const snapshotManager = app.resolve<SnapshotManager>("snapshots");

    const progressBar = new _cliProgress.Bar(
        {
            format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total} | Duration: {duration}s",
        },
        _cliProgress.Presets.shades_classic,
    );

    app.emitter.on("start", data => {
        progressBar.start(data.count, 1);
    });

    app.emitter.on("progress", data => {
        progressBar.update(data.value);
    });

    app.emitter.on("complete", data => {
        progressBar.stop();
    });

    await snapshotManager.importData(options);
}
