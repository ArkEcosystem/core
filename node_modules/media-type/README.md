# media-type

Node.js module to parse and validate
[RFC6838](http://tools.ietf.org/html/rfc6838) media types.

Useful for parsing `Content-Type` HTTP response headers
from [HATEOAS](http://en.wikipedia.org/wiki/HATEOAS) constrained services.

Aware of vendor subtype trees, +suffixes, wildcards and semicolon delimited parameters.

## Install

    npm install media-type

## Usage examples

```javascript
var mediaType = require('media-type');
```

```javascript
var media = mediaType.fromString('text/plain');
if (media.isValid()) {
  console.log(media.type);        // 'text'
  console.log(media.subtype);     // 'plain'
  console.log(media.hasSuffix()); // false
  console.log(media.asString());  // 'text/plain'
  console.log(media);             // { type: 'text', subtype: 'plain', subtypeFacets: [ 'plain' ] ... }
}
```

```javascript
var media = mediaType.fromString('application/vnd.company.app.entity-v2+xml; charset=utf8; BOM=true');
if (media.isValid()) {
  console.log(media.type);             // 'application'
  console.log(media.subtype);          // 'vnd.company.app.entity-v2'
  console.log(media.subtypeFacets);    // ['vnd', 'company', 'app', 'entity-v2']
  console.log(media.hasSuffix());      // true
  console.log(media.suffix);           // 'xml'
  console.log(media.parameters);       // {charset: 'utf8', bom: 'true'}
  console.log(media.isVendor());       // true
  console.log(media.isPersonal());     // false
  console.log(media.isExperimental()); // false
  console.log(media.asString());       // 'application/vnd.company.app.entity-v2+xml;bom=true;charset=utf8'
  console.log(media);                  // { type: 'application', subtype: 'vnd.company.app.entity-v2',
                                       //   subtypeFacets: [ 'vnd', 'company', 'app', 'entity-v2' ],
                                       //   suffix: 'xml', parameters: { charset: 'utf8', bom: 'true' } }
}
```

## API

### fromString(str)

Factory method to construct an Object from a String representation of a media type.

### isValid()

Is this media type valid?

### asString()

Return media type as a normalised String.

### hasSuffix()

Does the media type have a suffix, e.g. the `xml` of `image/svg+xml`?

### isVendor()

Does the media type have a vendor prefix, e.g. `text/vnd.DMClientScript`?

### isPersonal()

Does the media type have a personal prefix, e.g. `text/prs.lines.tag`?

### isExperimental()

Does the media type have an experimental prefix, e.g. `text/x-test`?

## Test [![Build Status](https://travis-ci.org/lovell/media-type.png?branch=master)](https://travis-ci.org/lovell/media-type)

Run the unit tests with:

    npm test

## Licence

Copyright 2013, 2014, 2015 Lovell Fuller and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
