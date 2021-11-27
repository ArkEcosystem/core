import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IHeaderState, IRound, ISlot } from "../interfaces";

export class Forgers {
    public static getRoundForgers(round: IRound, delegates: readonly string[]): string[] {
        const forgers = delegates.slice();
        let seed = HashAlgorithms.sha256(round.no.toString());

        for (let i = 0; i < forgers.length; i++) {
            for (const s of seed.slice(0, Math.min(forgers.length - i, 4))) {
                const index = s % forgers.length;
                const t = forgers[index];
                forgers[index] = forgers[i];
                forgers[i] = t;
                i++;
            }

            seed = HashAlgorithms.sha256(seed);
        }

        return forgers;
    }

    public static getNextBlockForger(lastState: IHeaderState, nextBlockSlot: ISlot): string {
        if (!lastState.nextBlockRoundForgers) {
            throw new CryptoError("Round delegates aren't set.");
        }

        const nextBlockForgerIndex = nextBlockSlot.no % lastState.nextBlockRound.length;
        const nextBlockForger = lastState.nextBlockRoundForgers[nextBlockForgerIndex];

        return nextBlockForger;
    }
}
