import { EntityType, EntitySubType, EntityAction } from "@arkecosystem/core-magistrate-crypto/src/enums";
export const validUpdates = [
    // array of update assets
    // we expect to have the wallet updated accordingly after
    {
        type: EntityType.Business,
        subType: EntitySubType.None,
        action: EntityAction.Update,
        registrationId: "521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b",
        data: {
            description: "business updated",
            website: "www.mybizupdated.com",
            socialMedia: {
                twitter: "https://twitter.com/mybizupdated",
                facebook: "https://facebook.com/mybizupdated",
                linkedin: "https://linkedin.com/mybizupdated",
            },
            sourceControl: {
                github: "https://github.com/mybizupdatedorg",
                gitlab: "https://gitlab.com/mybizupdatedorg",
                bitbucket: "https://bitbucket.com/mybizupdatedorg",
                npmjs: "https://npmjs.com/mybizupdatedorg",
            },
            images: ["https://flickr.com/dummyupdated.png"],
            videos: ["https://youtube.com/dummyupdated"],
        },
    }
];