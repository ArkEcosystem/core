import { app, Contracts } from "@arkecosystem/core-kernel";
import { existsSync, lstatSync, readdirSync } from "fs-extra";
import prompts from "prompts";

import { abort } from "./cli";

// todo: review the implementation
export const setUpLite = async (flags): Promise<Contracts.Kernel.Application> => {
    await app.bootstrap({
        flags,
        plugins: {
            include: [
                "@arkecosystem/core-state",
                "@arkecosystem/core-database-postgres",
                "@arkecosystem/core-snapshots",
            ],
        },
    });

    await app.boot();

    return app;
};

// todo: review the implementation
export const chooseSnapshot = async (dataPath: string, message: string) => {
    const source = `${dataPath}/snapshots`;

    if (!existsSync(source)) {
        abort("The snapshots directory could not be found.");
    }

    const snapshots: string[] = readdirSync(source).filter((name: string) =>
        lstatSync(`${source}/${name}`).isDirectory(),
    );

    if (!snapshots || !snapshots.length) {
        abort("Failed to find any snapshots.");
    }

    if (snapshots.length === 1) {
        return snapshots[0];
    }

    const response = await prompts([
        {
            type: "select",
            name: "blocks",
            message,
            choices: snapshots.map((name: string) => ({ title: name, value: name })),
        },
        {
            type: "confirm",
            name: "confirm",
            message: "Can you confirm?",
        },
    ]);

    if (!response.confirm) {
        abort("You'll need to confirm the snapshot to continue.");
    }

    if (!response.blocks) {
        abort("Please select a snapshot and try again.");
    }

    return response.blocks;
};
