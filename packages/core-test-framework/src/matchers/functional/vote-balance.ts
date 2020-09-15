import got from "got";

export {};

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toHaveVoteBalance(voteBalance: string): Promise<R>;
        }
    }
}

expect.extend({
    toHaveVoteBalance: async (publicKey: string, voteBalance: string) => {
        let pass: boolean = false;
        let fetchedVoteBalance: string;
        try {
            const { body } = await got.get(`http://localhost:4003/api/delegates/${publicKey}`);

            const parsedBody = JSON.parse(body);

            fetchedVoteBalance = parsedBody.data.votes;
            pass = fetchedVoteBalance === voteBalance;
        } catch (e) {} // tslint:disable-line

        return {
            pass,
            message: /* istanbul ignore next */ () =>
                `expected delegate ${publicKey} ${
                    // @ts-ignore                    
                    this.isNot ? "not" : ""
                } to have vote balance = ${voteBalance}, got ${fetchedVoteBalance}`,
        };
    },
});
