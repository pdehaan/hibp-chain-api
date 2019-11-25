# hibp-chain-api

Chain API for Have I Been Pwned breaches.

## INSTALLATION

This module isn't currently on npm, so you need to install directly from GitHub:

```sh
npm install pdehaan/hibp-chain-api -S
```

## USAGE

Usage is a bit weird, since it uses method chaining and promises.

The following example will fetch the ten largest breaches (sorted by `breach.PwnCount` descending):

```js
// npm i pdehaan/hibp-chain-api -S
const HIBP = require("hibp-chain-api");

const breaches = (await new HIBP().getBreaches())
  .sort("-PwnCount")
  .breaches(10);
console.log(breaches);
```

Here you can see that the `new HIBP().getBreaches()` needs to be wrapped in an `await`. Next, we can chain the `.sort()` method to sort by a specific column/order. Finally we call `.breaches()` which can trim the results to a certain length (or omit the number to return all records), but most importantly, the `.breaches()` method will return the array of breaches and break the method chain (and let you append array methods, if you want to do any additional custom `Array#filter()` or `Array#map()` or any other Array methods).

## EXAMPLES

### Fetch largest non-sensitive breaches

The following example will fetch the ten largest, verified, non-sensitive breaches with a non-empty `breach.Domain`:

```js
const breaches = (await new HIBP().getBreaches())
  .isVerified()
  .isSensitive(false)
  .hasDomain()
  .sort("-PwnCount")
  .pluck(["Name", "AddedDate", "PwnCount", "Domain"])
  .breaches(10);
console.log(breaches);
```

### Fetch all breaches for a specific domain

The following example will fetch the latest 3 breaches for the "bell.ca" domain:

```js
const breaches = (await new HIBP().getBreaches())
  .hasDomain("bell.ca")
  .sort("-AddedDate")
  .pluck(["Name", "AddedDate", "PwnCount", "Domain"])
  .breaches(3);
console.log(breaches);
```

### Fetch all breaches with no domain

To get an array of all breaches with _no_ domain, simply pass an empty string to the `.hasDomain()` method:

```js
const breaches = (await new HIBP().getBreaches())
  .hasDomain("")
  .sort("-AddedDate")
  .pluck(["Name", "AddedDate", "PwnCount", "Domain"]);
console.log(breaches);
```

### Fetch all retired breaches

The following example will fetch all breaches where `breach.IsRetired` is `true`:

```js
const breaches = (await new HIBP().getBreaches())
  .isRetired(true)
  .sort("-AddedDate")
  .pluck(["Name", "AddedDate", "PwnCount", "Domain"])
  .breaches();
console.log(breaches);
```

### Filtering by breach names and data classes

The following example filters three breaches by `breach.Name`, then further filters by empty `breach.Domain`, non-sensitive and verified breaches, then finally breaches which have both the "names" and "job-titles" in `breach.DataClasses`. Finally the breaches are reverse sorted by `breach.PwnCount` and only the `breach.Name` values are returned.

```js
const breaches = (await new HIBP().getBreaches())
  .name("MasterDeeds", "Estonia", "WienerBuchereien")
  .hasDomain("")
  .isSensitive(false)
  .isVerified()
  .hasDataClass("names", "job-titles")
  .sort("-PwnCount")
  .pluck(["Name"])
  .breaches();
console.log(breaches);
```
