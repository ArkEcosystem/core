import { app, Contracts } from "@arkecosystem/core-kernel";
import { lstatSync, readdirSync } from "fs";
import prompts from "prompts";

import { CommandFlags } from "../types";

export const setUpLite = async (options): Promise<Contracts.Kernel.Application> => {
    // await app.setUp(version, options, {
    //     include: [
    //         "@arkecosystem/core-state",
    //         "@arkecosystem/core-database-postgres",
    //         "@arkecosystem/core-snapshots",
    //     ],
    // });

    return app;
};

export const chooseSnapshot = async (flags: CommandFlags, message: string) => {
    const source = `${process.env.CORE_PATH_DATA}/snapshots`;

    const snapshots: string[] = readdirSync(source).filter((name: string) =>
        lstatSync(`${source}/${name}`).isDirectory(),
    );

    if (!snapshots) {
        throw new Error("Failed to find any snapshots.");
    }

    if (snapshots.length === 1) {
        flags.blocks = snapshots[0];
        return;
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

    if (!response.blocks || !response.confirm) {
        throw new Error("Please select a snapshot and try again.");
    }

    flags.blocks = response.blocks;
};
