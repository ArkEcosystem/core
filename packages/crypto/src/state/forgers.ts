import { HashAlgorithms } from "../crypto";
import { CryptoError } from "../errors";
import { IRound, ISlot, IState } from "../interfaces";

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

    public static getNextBlockForger(prevState: IState, nextBlockSlot: ISlot): string {
        if (!prevState.nextBlockRoundForgers) {
            throw new CryptoError("Round delegates aren't set.");
        }

        const nextBlockForgerIndex = nextBlockSlot.no % prevState.nextBlockRound.length;
        const nextBlockForger = prevState.nextBlockRoundForgers[nextBlockForgerIndex];

        return nextBlockForger;
    }
}
