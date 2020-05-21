export const isNewBlockTime = <T>(height: number, milestones: Array<Record<string, any>>): boolean => {
    if (height === 1) return true;

    let milestone;

    for (let i = milestones.length - 1; i >= 0; i--) {
        const temp = milestones[i];

        if (temp.height > height) {
            continue;
        }

        if (!milestone || temp.blocktime === milestone.blocktime) {
            if (temp.blocktime) {
                milestone = temp;
            }
        } else {
            break;
        }
    }

    if (!milestone) return false;

    return height - milestone.height === 0;
};

export const calculateBlockTime = (height: number, milestones: Array<Record<string, any>>): number => {
    for (let i = milestones.length - 1; i >= 0; i--) {
        const milestone = milestones[i];
        if (milestone.height <= height) {
            if (milestone.blocktime) {
                return milestone.blocktime;
            }
        }
    }

    throw new Error(`No milestones specifying any height were found`);
};
