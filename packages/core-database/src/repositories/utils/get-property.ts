import { Services } from "@arkecosystem/core-kernel";

// todo: review implementation - quite a mess at the moment
export const getProperty = (item: any, prop: string): any => {
    for (const [key, value] of Object.entries(item)) {
        if (key === prop) {
            return value;
        }

        if (value instanceof Services.Attributes.AttributeMap) {
            const delegateProps: string[] = [
                "approval",
                "forgedFees",
                "forgedRewards",
                "forgedTotal",
                "lastBlock",
                "producedBlocks",
                "rank",
                "round",
                "username",
                "voteBalance",
            ];

            if (delegateProps.includes(prop)) {
                prop = `delegate.${prop}`;
            }

            try {
                if (value.has(prop)) {
                    return value.get(prop);
                }
            } catch {
                // Unknown attribute was tried to be accessed
            }
        }
    }

    return undefined;
};
