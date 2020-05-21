import deepmerge from "deepmerge";

import { InvalidMilestoneConfigurationError } from "../errors";
import { IMilestone } from "../interfaces";
import { NetworkConfig } from "../interfaces/networks";
import { HeightTracker } from "./height-tracker";

export interface MilestoneSearchResult {
    found: boolean;
    height: number;
    data: any;
}

export class MilestoneManager<T> {
    private milestone: IMilestone;
    private milestones: Record<string, any>;

    public constructor(private heightTracker: HeightTracker, private config: NetworkConfig<T>) {
        this.milestones = config.milestones.sort((a, b) => a.height - b.height);
        this.milestone = {
            index: 0,
            data: this.milestones[0],
        };

        this.validateMilestones();
        this.buildConstants();
    }

    public isNewBlockTime(height: number): boolean {
        if (height === 1) return true;

        let milestone;

        for (let i = this.milestones.length - 1; i >= 0; i--) {
            const temp = this.milestones[i];

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
    }

    public calculateBlockTime(height: number): number {
        for (let i = this.milestones.length - 1; i >= 0; i--) {
            const milestone = this.milestones[i];
            if (milestone.height <= height) {
                if (milestone.blocktime) {
                    return milestone.blocktime;
                }
            }
        }

        throw new Error(`No milestones specifying any height were found`);
    }

    // TODO: should we set the height on the tracker whenever height is passed here?
    public isNewMilestone(height?: number): boolean {
        height = height || this.heightTracker.getHeight();

        return this.milestones.some((milestone) => milestone.height === height);
    }

    public getMilestone(height?: number): { [key: string]: any } {
        height = height || this.heightTracker.getHeight();

        while (
            this.milestone.index < this.milestones.length - 1 &&
            height >= this.milestones[this.milestone.index + 1].height
        ) {
            this.milestone.index++;
            this.milestone.data = this.milestones[this.milestone.index];
        }

        while (height < this.milestones[this.milestone.index].height) {
            this.milestone.index--;
            this.milestone.data = this.milestones[this.milestone.index];
        }

        return this.milestone.data;
    }

    public getNextMilestoneWithNewKey(previousMilestone: number, key: string): MilestoneSearchResult {
        if (!this.milestones || !this.milestones.length) {
            throw new Error(`Attempted to get next milestone but none were set`);
        }

        for (let i = 0; i < this.milestones.length; i++) {
            const milestone = this.milestones[i];
            if (
                milestone[key] &&
                milestone[key] !== this.getMilestone(previousMilestone)[key] &&
                milestone.height > previousMilestone
            ) {
                return {
                    found: true,
                    height: milestone.height,
                    data: milestone[key],
                };
            }
        }

        return {
            found: false,
            height: previousMilestone,
            data: null,
        };
    }

    public getMilestones(): any {
        return this.milestones;
    }

    private buildConstants(): void {
        let lastMerged = 0;

        const overwriteMerge = (dest, source, options) => source;

        while (lastMerged < this.milestones.length - 1) {
            this.milestones[lastMerged + 1] = deepmerge(this.milestones[lastMerged], this.milestones[lastMerged + 1], {
                arrayMerge: overwriteMerge,
            });
            lastMerged++;
        }
    }

    private validateMilestones(): void {
        if (!this.config) {
            throw new Error();
        }

        const delegateMilestones = this.config.milestones
            .sort((a, b) => a.height - b.height)
            .filter((milestone) => milestone.activeDelegates);

        for (let i = 1; i < delegateMilestones.length; i++) {
            const previous = delegateMilestones[i - 1];
            const current = delegateMilestones[i];

            if (previous.activeDelegates === current.activeDelegates) {
                continue;
            }

            if ((current.height - previous.height) % previous.activeDelegates !== 0) {
                throw new InvalidMilestoneConfigurationError(
                    `Bad milestone at height: ${current.height}. The number of delegates can only be changed at the beginning of a new round.`,
                );
            }
        }
    }
}
