# fast-sort

[![Start](https://img.shields.io/github/stars/snovakovic/fast-sort?style=flat-square)](https://github.com/snovakovic/fast-sort/stargazers)
[![Total Downloads](https://img.shields.io/npm/dt/fast-sort.svg)](https://www.npmjs.com/package/fast-sort)
[![Known Vulnerabilities](https://snyk.io/test/github/snovakovic/fast-sort/badge.svg)](https://snyk.io/test/github/snovakovic/fast-sort)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

[![NPM Package](https://nodei.co/npm/fast-sort.png)](https://www.npmjs.com/package/fast-sort)

Fast easy to use and flexible sorting with TypeScript support.
For speed comparison of `fast-sort` vs other popular sort libraries check [benchmark](#benchmark) section.
For list of all available features check [highlights](#highlights) section.

## Quick examples

```javascript
  import sort from 'fast-sort';

  // Sort flat arrays
  sort([1,4,2]).asc(); // => [1, 2, 4]
  sort([1, 4, 2]).desc(); // => [4, 2, 1]

  // Sort users (array of objects) by firstName in descending order
  sort(users).desc(u => u.firstName);

  // Sort users in ascending order by firstName and lastName
  sort(users).asc([
    u => u.firstName,
    u => u.lastName
  ]);

  // Sort users ascending by firstName and descending by age
  sort(users).by([
    { asc: u => u.firstName },
    { desc: u => u.age }
  ]);
```

## Highlights

  * Sort flat arrays
  * Sort array of objects by one or more properties
  * Sort in multiple directions
  * [Natural sort](#natural-sorting--language-sensitive-sorting) support
  * Support for [custom sort](#custom-sorting) instances
  * Easy to read syntax
  * [Faster](#benchmark) than other popular sort alternatives
  * Undefined and null values are always sorted to bottom (with default comparer)
  * TypeScript support
  * Small footprint with 0 dependencies (~ 750 bytes gzip)
  * Compatible with any JS environment as Node, Web, etc..

Under the hood sort is using [native JavaScript sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
Usage of native sort implies that sorting is not necessarily [stable](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability) and it also implies that input array is modified(sorted) same as it would be when applying native sort.

## More examples

  * `asc` / `desc` sorters. Both asc and desc sorters have exactly the same API.

```javascript
  import sort from 'fast-sort';

  // Sort flat arrays
  sort([1,4,2]).asc(); // => [1, 2, 4]

  // Sort array of objects by single object property
  sort(users).asc(u => u.firstName);

  // For root object properties we can use string shorthand (same as example above)
  sort(users).asc('firstName');

  // Sort by nested object properties
  // NOTE: for nested object properties we can't use string shorthand ('address.city' is not valid syntax).
  sort(users).asc(u => u.address.city);

  // Sort by multiple properties
  sort(users).asc([
    u => u.age,
    u => u.firstName,
  ]);

  // Same as above but using string shorthand
  sort(users).asc(['age', 'firstName']);

  // Sort based on computed property
  // For example sort repositories by total number of issues (summary of open and closed issues)
  sort(repositories).desc(r => r.openIssues + r.closedIssues);
```

  * `by` sorter can do anything that `asc` / `desc` sorters can with addition to some more advance
  sort handling. With `by` sorter we can sort by multiple properties in different directions and
  we can override default `comparer` for e.g natural sort purposes.

```javascript
  import sort from 'fast-sort';

  // Sort users by firstName in ascending order and age in descending order
  sort(users).by([
    { asc: u => u.firstName },
    { desc: u => u.age },
  ]);

  // Same as with asc/desc sorters we can use string shorthand for root object properties
  sort(users).by([{ asc: 'firstName' }, { desc: 'age' }]);

  // Sort users by city using custom comparer
  sort(users).by({
    asc: u => u.address.city,
    comparer: (a, b) => a.localeCompare(b),
  });

  // Sort users ascending by age using default comparer and then by lastName using language sensitive comparer
  sort(users).by([
    { asc: 'age' },
    {
      asc: 'lastName',
      comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare,
    },
  ]);
```

  * Fore even more examples check unit tests `test/sort.spec.ts` in the github repo.

### Natural sorting / Language sensitive sorting

By default `fast-sort` is not doing language sensitive sorting of strings.
e.g `'image-11.jpg'` will be sorted before `'image-2.jpg'` (in ascending sorting).
We can provide custom [Intl.Collator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator) comparer to fast-sort for language sensitive sorting of strings.
Keep in mind that natural sort is slower then default sorting so recommendation is to use it
only when needed.

```javascript
  import sort from 'fast-sort';

  const testArr = ['image-2.jpg', 'image-11.jpg', 'image-3.jpg'];

  // By default fast-sort is not doing natural sort
  sort(testArr).desc(); // => ['image-3.jpg', 'image-2.jpg', 'image-11.jpg']

  // We can use `by` sort to override default comparer with the one that is doing language sensitive comparison
  sort(testArr).by({
    desc: true,
    comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare,
  }); // => ['image-11.jpg', 'image-3.jpg', 'image-2.jpg']


  // Or we can create new sort instance with language sensitive comparer.
  // Recommended if used in multiple places
  const naturalSort = sort.createNewInstance({
    comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare,
  });

  naturalSort(testArr).asc(); // => ['image-2.jpg', 'image-3.jpg', 'image-11.jpg']
  naturalSort(testArr).desc(); // => ['image-11.jpg', 'image-3.jpg', 'image-2.jpg']
```

### Custom sorting

Fast sort can be tailored to fit any sorting need or use case by:
  * creating custom sorting instances
  * overriding default comparer in `by` sorter
  * custom handling in provided callback function
  * combination of any from above

For example we will sort `tags` by "custom" tag importance (e.g `vip` tag is of greater importance then `captain` tag).

```javascript
  import sort from 'fast-sort';

  const tagsImportance = { vip: 3, influencer: 2, captain: 1 }; // Some domain specific logic
  const tags = ['influencer', 'unknown', 'vip', 'captain'];

  // Sort tags in ascending order by custom tags values
  sort(tags).asc(tag => tagImportance[tag] || 0); // => ['unknown', 'captain', 'influencer', 'vip'];
  sort(tags).desc(tag => tagImportance[tag] || 0); // => ['vip', 'influencer', 'captain', 'unknown'];

  // We can also create specialized tagSorter instance and reuse it across the application
  const tagSorter = sort.createNewInstance({
    comparer: (a, b) => (tagImportance[a] || 0) - (tagImportance[b] || 0)
  });

  tagSorter(tags).asc(); // => ['unknown', 'captain', 'influencer', 'vip'];
  tagSorter(tags).desc(); // => ['vip', 'influencer', 'captain', 'unknown'];

  // Default sorter will sort tags by string comparison and not "tag" importance
  sort(tags).asc(); // => ['captain', 'influencer', 'unknown' 'vip']
```

### Things to know

When using custom comparers as e.g [Intl.Collator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator) it's up to you to ensure those features are available in all the platforms you intend to support. (You can check browser compatibility for Intl.Collator by following link above). Same applies for any other custom comparer.

```javascript
  // Sorting values that are not sortable will return same value back
  sort(null).asc(); // => null
  sort(33).desc(); // => 33

  // By default sort will mutate input array (by sorting it),
  const arr = [1, 4, 2];
  const sortedArr = sort(arr).asc();
  console.log(sortedArr); // => [1, 2, 4]
  console.log(arr); // => [1, 2, 4]
  console.log(sortedArr === arr), // => true

  // TIP: to prevent mutating of input array you can clone it before passing to sort as
  const arr = [1, 4, 2];
  const sortedArr = sort([...arr]).asc();
  console.log(arr); // => [1, 4, 2]
  console.log(sortedArr); // => [1, 2, 4]
  console.log(sortedArr === arr), // => false

  // As stated in highlights by default fast-sort sorts null and undefined values to the
  // bottom no matter if sorting is in asc or decs order.
  const addresses = [{ city: 'Split' }, { city: undefined }, { city: 'Zagreb'}];
  sort(addresses).asc(a => a.city); // => Split, Zagreb, undefined
  sort(addresses).desc(a => a.city); // => Zagreb, Split, undefined

  // If above is not intended behaviour you can always create new sort instance that will sort null
  // or undefined values the way you intended it to be. For example of exactly that you can check unit test
  // "Should create sort instance that sorts nil value to the top in desc order" in 'test/sort.spec.ts'
```

### Usage with ts-node

In a nodeJS environment, when fast-sort is being imported with ts-node, you might see an error along the lines of:

```
TypeError {
  message: 'fast_sort_1.default is not a function',
}
```

In this case just add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```

### Fast sort versions

#### `v2` version

  There is no breaking changes in API between `v2` and `v1` version of library.
  Some import files have been removed so if you haven't import it using default import
  you might need to update imports. For more info check [v2 release notes](https://github.com/snovakovic/fast-sort/releases/tag/v2.0.0)

#### Features by version

```javascript
 // Sorting in multiple directions is available from [v1.5.0]
 sort(users).by([{ asc: 'age' }, { desc: 'firstName' }]);

 // Overriding of default comparer in `by` sorter is available from [v1.6.0]
  sort(testArr).by({
    desc: true,
    comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare,
  });

  // Creating new custom sort instances is available from [v2.0.0]
  const naturalSort = sort.createNewInstance({
    comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare,
  });

  // TypeScript support is available from [v2.0.0]
```

## Benchmark

Five different benchmarks have been created to get better insight of how fast-sort perform under different scenarios.
Each benchmark is run with different array sizes raging from small 100 items to large 100 000 items.

Every run of benchmark outputs different results but the results are constantly showing better scores compared to similar popular sorting libraries.

#### Benchmark scores

Benchmark has been run on:

  * 16 GB Ram
  * Intel® Core™ i5-4570 CPU @ 3.20GHz × 4
  * Ubuntu 16.04
  * Node 8.9.1

![benchmark results](https://github.com/snovakovic/fast-sort/raw/master/benchmark.jpg)

#### Running benchmark

To run benchmark on your PC follow steps from below

1) git clone https://github.com/snovakovic/fast-sort.git
2) cd fast-sort/benchmark
3) npm install
4) npm start

In case you notice any irregularities in benchmark or you want to add sort library to benchmark score
please open issue [here](https://github.com/snovakovic/fast-sort)
