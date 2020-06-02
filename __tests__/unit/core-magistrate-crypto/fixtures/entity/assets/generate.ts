import {
    EntityType,
    EntitySubType,
    EntityAction
} from "@arkecosystem/core-magistrate-crypto/src/enums";
import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";

const allTypes = [
    EntityType.Business,
    EntityType.Bridgechain,
    EntityType.Developer,
    EntityType.Plugin,
];
const allSubTypes = [
    EntitySubType.None,
    EntitySubType.PluginCore,
    EntitySubType.PluginDesktop,
];
const allActions = [
    EntityAction.Register,
    EntityAction.Update,
    EntityAction.Resign,
];
const registrationIds = [
    undefined,
    "c8b924ec44ac3341a110d440f630149e97c8c9c630dff5040466834096eba7f9",
]
const datas = [
    { name: "the name of the entity" },
    { description: " the description of the entity" },
    { website: "www.thewebsite.com" },
    { website: "website could be any string tho for ser/deser" },
    { sourceControl: { github: "https://github.com/theorg/therepo" }},
    { sourceControl: { github: "github could be any string tho" }},
    { sourceControl: { gitlab: "https://gitlab.com/theorg/therepo" }},
    { sourceControl: { gitlab: "gitlab could be any string tho" }},
    { sourceControl: { bitbucket: "https://bitbucket.com/theorg/therepo" }},
    { sourceControl: { bitbucket: "bitbucket could be any string tho" }},
    { sourceControl: { npmjs: "https://npmjs.com/theorg/therepo" }},
    { sourceControl: { npmjs: "npmjs could be any string tho" }},
    { socialMedia: { twitter: "https://twitter.com/dummy" }},
    { socialMedia: { twitter: "twitter could be any string tho" }},
    { socialMedia: { facebook: "https://facebook.com/dummy" }},
    { socialMedia: { facebook: "facebook could be any string tho" }},
    { socialMedia: { linkedin: "https://linkedin.com/dummy" }},
    { socialMedia: { linkedin: "linkedin could be any string tho" }},
    { images: [ "https://flickr.com/dummy.png" ] },
    { images: [ "https://flickr.com/dummy1.png", "https://flickr.com/dummy2.png", "could be any string as image tho" ] },
    { videos: [ "https://youtube.com/dummy" ] },
    { videos: [ "https://youtube.com/dummy", "https://youtube.com/dummy3423", "could be any string as video tho" ] },
];
const specialDatas = [
    // special datas where data => ser => deser does not give back data (see examples)
    // basically, empty object or empty array or empty string is considered undefined
    // [dataToSerialize, expectedDeserialized]
    [{ name: "" }, {}],
    [{ description: "" }, {}],
    [{ website: "" }, {}],
    [{ sourceControl: { github: "" }}, {}],
    [{ sourceControl: { gitlab: "" }}, {}],
    [{ sourceControl: { bitbucket: "" }}, {}],
    [{ sourceControl: { npmjs: "" }}, {}],
    [{ socialMedia: { twitter: "" }}, {}],
    [{ socialMedia: { facebook: "" }}, {}],
    [{ socialMedia: { linkedin: "" }}, {}],
    [ { images: [] }, {} ],
    [ { name: "the name", images: [] }, { name: "the name" }],
    [ { videos: [] }, {} ],
    [ { name: "another name", videos: [] }, { name: "another name" }],
    [ { sourceControl: {} }, {} ],
    [ { name: "new name", sourceControl: {} }, { name: "new name" }],
    [ { socialMedia: {} }, {} ],
    [ { description: "some description", socialMedia: {} }, { description: "some description" }],
];

// base asset properties we will use to generate all kind of {data} with it
const baseAssets = [
    {
        type: EntityType.Developer,
        subType: EntitySubType.None,
        action: EntityAction.Update,
        registrationId: "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c",
    },
    {
        type: EntityType.Plugin,
        subType: EntitySubType.PluginDesktop,
        action: EntityAction.Register,
        registrationId: undefined
    }
];

export const generateAssets = () => {
    // generate all combinations of { type, subType, action, registrationId}
    // with the same { data }
    const assets: IEntityAsset[] = [];
    for (const type of allTypes) {
        for (const subType of allSubTypes) {
            for (const action of allActions) {
                for (const registrationId of registrationIds) {
                    assets.push({
                        type,
                        subType,
                        action,
                        registrationId,
                        data: {} // in theory (for ser/deser) we could have empty {data}
                    })
                }
            }
        }
    }
    
    for (const baseAsset of baseAssets) {
        for (const data of datas) {
            assets.push({
                ...baseAsset,
                data
            })
        }
    }

    return assets;
}

// generateSpecialAssets returns [assetToSerialize, expectedAssetDeserialized]
export const generateSpecialAssets = () => {
    const assets: any[] = [];
    for (const baseAsset of baseAssets) {
        for (const [dataToSerialize, expectedDeserialized] of specialDatas) {
            assets.push([
                {
                    ...baseAsset,
                    data: dataToSerialize
                },
                {
                    ...baseAsset,
                    data: expectedDeserialized
                },
            ])
        }
    }

    return assets;
}