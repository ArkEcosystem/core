import { DatabaseService } from "@arkecosystem/core-database";

import { Container, Contracts } from "../";
import { mapHeightToMilestoneSpanTimestamp } from "./map-height-to-milestone-span-timestamp";

export const getBlockTimeLookup = async (
    app: Contracts.Kernel.Application,
    height: number,
): Promise<(height: number) => number> => {
    const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);

    const getBlockTimestampByHeight = async (height: number): Promise<number> => {
        const blocks = await databaseService.getBlocksByHeight([height]);
        return blocks[0].timestamp;
    };

    return await mapHeightToMilestoneSpanTimestamp(height, getBlockTimestampByHeight);
};
