// export valid and invalid asset data for registration and update
// excluding `name` property as it is not allowed for update

import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";

export const validAssetData: Interfaces.IEntityAssetData[] = [
    { description: "my updated description as developer" },
    { website: "http://randomwebsite.co" },
    { website: "http://subdomain.randomwebsite.co" },
    { website: "http://randomwebsite.co/about" },
    { website: "https://randomwebsite.co/about" },
    { images: ["https://flickr.com/something"] },
    { videos: ["https://youtube.com/something"] },
    { videos: ["https://vimeo.com/something"] },
    { videos: ["https://youtube.com/something", "https://vimeo.com/somethingelse"] },
    { sourceControl: { github: "https://github.com/anyrepo" } },
    { sourceControl: { gitlab: "https://gitlab.com/anyrepo" } },
    { sourceControl: { bitbucket: "https://bitbucket.org/anyrepo" } },
    { sourceControl: { npmjs: "https://npmjs.com/anyrepo" } },
    { sourceControl: {
        github: "https://github.com/anyrepo",
        gitlab: "https://gitlab.com/anyrepo",
        bitbucket: "https://bitbucket.org/anyrepo",
        npmjs: "https://npmjs.com/anyrepo",
    } },
    { socialMedia: { facebook: "https://facebook.com/random" } },
    { socialMedia: { twitter: "https://twitter.com/random" } },
    { socialMedia: { linkedin: "https://linkedin.com/random" } },
    { socialMedia: {
        facebook: "https://facebook.com/random",
        twitter: "https://twitter.com/random",
        linkedin: "https://linkedin.com/random"
    } },

];

export const invalidAssetData: Interfaces.IEntityAssetData[] = [
    { description: "description that is too long because it exceeds the max length of 140 characters. description that is too long because it exceeds the max length of 140 characters." },
    { description: "description with invalid \u0000 char" },
    { website: "www.randomwebsite.co" },
    { website: "nothttp://randomwebsite.com" },
    { images: ["https://notflickr.com/something"] },
    { videos: ["https://notyoutube.com/something"] },
    { videos: ["https://youtube.com/something", "https://notvimeo.com/somethingelse"] },
    { sourceControl: { github: "https://gitlab.com/anyrepo" } },
    { sourceControl: { gitlab: "https://github.com/anyrepo" } },
    { sourceControl: { bitbucket: "https://github.com/anyrepo" } },
    { sourceControl: { bitbucket: "https://bitbucket.com/anyrepo" } }, // .com instead of .org
    { sourceControl: { npmjs: "https://gitlab.com/anyrepo" } },
    { sourceControl: { github: "http://github.com/anyrepo" } }, // http
    { sourceControl: { gitlab: "http://gitlab.com/anyrepo" } },
    { sourceControl: { bitbucket: "http://bitbucket.org/anyrepo" } },
    { sourceControl: { npmjs: "http://npmjs.com/anyrepo" } },
    { socialMedia: { facebook: "https://twitter.com/random" } },
    { socialMedia: { twitter: "https://facebook.com/random" } },
    { socialMedia: { linkedin: "https://facebook.com/random" } },
    { socialMedia: { facebook: "http://facebook.com/random" } }, // http
    { socialMedia: { twitter: "http://twitter.com/random" } },
    { socialMedia: { linkedin: "http://linkedin.com/random" } },
    { unknownProperty: "what am I doing here" } as any,
];