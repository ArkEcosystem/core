import { EntityType, EntitySubType, EntityAction } from "@arkecosystem/core-magistrate-crypto/src/enums";
export const validRegisters = [
    // array of register assets
    // we expect to have the wallet state like { entities: { [txId]: { ...asset.data } } } after
    {
        type: EntityType.Business,
        subType: EntitySubType.None,
        action: EntityAction.Register,
        data: {
            name: "my business 1",
            description: "this is my business",
            website: "http://www.mybiz.com",
            socialMedia: {
                twitter: "https://twitter.com/mybiz",
                facebook: "https://facebook.com/mybiz",
                linkedin: "https://linkedin.com/mybiz",
            },
            sourceControl: {
                github: "https://github.com/mybizorg",
                gitlab: "https://gitlab.com/mybizorg",
                bitbucket: "https://bitbucket.org/mybizorg",
                npmjs: "https://npmjs.com/mybizorg",
            },
            images: ["https://flickr.com/dummy.png", "https://flickr.com/dummy2.png"],
            videos: ["https://youtube.com/dummy", "https://youtube.com/dummy2"],
        }
    }
];

export const invalidRegisters = [
    // array of { initialWalletEntities, asset }
    // which are invalid and should be denied (throwIfCannotBeApplied)
    {
        initialWalletEntities: {},
        asset: {}
    }
]
