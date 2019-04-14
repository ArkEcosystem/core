import { app } from "@arkecosystem/core-container";
import { dato, Dato } from "@faustbrian/dato";

export function formatTimestamp(
    epochStamp: number,
): {
    epoch: number;
    unix: number;
    human: string;
} {
    const timestamp: Dato = dato(app.getConfig().getMilestone().epoch).addSeconds(epochStamp);

    return {
        epoch: epochStamp,
        unix: timestamp.toUnix(),
        human: timestamp.toISO(),
    };
}
