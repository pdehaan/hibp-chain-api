const axios = require("axios");
const Joi = require("@hapi/joi");

const { array, boolean, date, number, object, string } = Joi.types();

class HIBP {
  static SERVER = "https://monitor.firefox.com/";

  static get schema() {
    return array.items(
      object.keys({
        Name: string,
        Title: string,
        Domain: string.hostname().allow(""),
        AddedDate: date,
        BreachDate: date,
        ModifiedDate: date,
        PwnCount: number.integer(),
        Description: string,
        LogoPath: string,
        DataClasses: array.items(string),
        IsVerified: boolean,
        IsFabricated: boolean,
        IsSensitive: boolean,
        IsRetired: boolean,
        IsSpamList: boolean
      })
    );
  }

  /**
   * Lookup map of columns-to-datatypes. Mainly used for determining how to sort breach results.
   */
  static get types() {
    return new Map(
      Object.entries({
        AddedDate: "date",
        BreachDate: "date",
        Domain: "string",
        IsFabricated: "boolean",
        IsRetired: "boolean",
        IsSensitive: "boolean",
        IsSpamList: "boolean",
        IsVerified: "boolean",
        ModifiedDate: "date",
        Name: "string",
        PwnCount: "number"
      })
    );
  }

  /**
   * Fetch the breaches from the server endpoint. Do some light datatype converting.
   * @param {string} endpoint URI path for the breaches API. This is slightly different depending on whether you are pinging Monitor or HIBP directly. Defaults to a Firefox Monitor friendly path.
   */
  async getBreaches(endpoint = "/hibp/breaches") {
    const href = new URL(endpoint, HIBP.SERVER).href;
    // Validate and cast the breach data, according to the schema.
    this._breaches = await axios.get(href).then(res => this.validate(res.data));
    this._origBreaches = [...this._breaches];
    return this;
  }

  /**
   * Reset the breach array.
   */
  reset() {
    this._breaches = [...this._origBreaches];
    return this;
  }

  /**
   * End the method chaining and return the array of breaches.
   * @param {number} limit The maximum number of breaches to return.
   */
  breaches(limit) {
    if (limit) {
      return this._breaches.slice(0, Number(limit));
    }
    return this._breaches;
  }

  /**
   * @private
   * @param {string} name The Boolean property to filter on.
   * @param {boolean} bool The Boolean value to compare.
   */
  _boolProp(name, bool = true) {
    const fn = breach => breach[name] === !!bool;
    this.filter(fn);
    return this;
  }

  /**
   * Filter breaches by `breach.IsFabricated`.
   * @param {boolean} bool Whether `.IsFabricated` is `true` or `false`. Default: `true`.
   */
  isFabricated(bool = true) {
    this._boolProp("IsFabricated", bool);
    return this;
  }

  /**
   * Filter breaches by `breach.IsRetired`.
   * @param {boolean} bool Whether `.IsRetired` is `true` or `false`. Default: `true`.
   */
  isRetired(bool = true) {
    this._boolProp("IsRetired", bool);
    return this;
  }

  /**
   * Filter breaches by `breach.IsSensitive`.
   * @param {boolean} bool Whether `.IsSensitive` is `true` or `false`. Default: `true`.
   */
  isSensitive(bool = true) {
    this._boolProp("IsSensitive", bool);
    return this;
  }

  /**
   * Filter breaches by `breach.IsSpamList`.
   * @param {boolean} bool Whether `.IsSpamList` is `true` or `false`. Default: `true`.
   */
  isSpamList(bool = true) {
    this._boolProp("IsSpamList", bool);
    return this;
  }

  /**
   * Filter breaches by `breach.IsVerified`.
   * @param {boolean} bool Whether `.IsVerified` is `true` or `false`. Default: `true`.
   */
  isVerified(bool = true) {
    this._boolProp("IsVerified", bool);
    return this;
  }

  /**
   * Filter the breaches using a custom function.
   * @param {function} fn An arbitrary sort function to apply to the breach chain. By default should be a noop.
   */
  filter(fn = () => true) {
    this._breaches = this._breaches.filter(fn);
    return this;
  }

  /**
   * Filter the breaches by one or more data classes.
   * @param {string|array} dataClass Filter all breaches by a specific data class. NOTE: Data classes are slightly different between Monitor (hypenated, lowercase) and HIBP (Sentence case and space delimited).
   */
  hasDataClass(...dataClasses) {
    for (const dataClass of dataClasses.flat()) {
      const fn = breach => breach.DataClasses.includes(dataClass);
      this.filter(fn);
    }
    return this;
  }

  /**
   * Filter the breaches by domain name.
   * @param {string} domain A domain filter. Relatively useless, but potentially useful if a site has multiple breaches and you want to quickly filter by both breaches.
   */
  hasDomain(domain) {
    let fn = breach => breach.Domain === domain;
    if (domain === undefined) {
      fn = breach => breach.Domain !== "";
    }
    this.filter(fn);
    return this;
  }

  /**
   * Filter breaches by one or more `breach.Name`s.
   * @param {string|array} bool A rest parameter of name(s) to filter.
   */
  name(...names) {
    names = names.flat();
    let fn = breach => names.includes(breach.Name);
    this.filter(fn);
    return this;
  }

  /**
   * Filter the properties in the breach object.
   * @param {array} arr Properties to "pluck" from the `breach` object.
   */
  pluck(...props) {
    props = props.flat();
    this._breaches = this._breaches.map(breach => {
      const obj = {};
      for (const prop of props) {
        obj[prop] = breach[prop];
      }
      return obj;
    });
    return this;
  }

  /**
   * Sort breaches using the specified property and direction.
   * @param {string} key The object key to sort by. We "try our best"(tm) to sort intelligently by data types, using a lookup map. NOTE: Instead of specifying a sort direction, you can prefix the key with a minus ("-"), such as "-AddedDate" to sort by `breach.AddedDate` in descending order.
   * @param {number | string} direction Sort direction. Can be "1" or "asc" for ascending, or "-1" or "desc" for descending sort order.
   */
  sort(key = "AddedDate", direction = 1) {
    switch (String(direction).toLowerCase()) {
      case "asc":
        direction = 1;
        break;

      case "desc":
        direction = -1;
        break;
    }

    if (key.startsWith("-")) {
      key = key.replace(/\-/, "");
      direction = -1;
    }

    const sortType = HIBP.types.get(key);

    const fn = (a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      switch (sortType) {
        case "date":
          aValue = aValue.getTime();
          bValue = bValue.getTime();
        // fall through

        case "boolean":
        case "number":
          return (aValue - bValue) * direction;

        case "string":
          return String(aValue).localeCompare(bValue) * direction;

        default:
          return true;
      }
    };

    this._breaches = this._breaches.sort(fn);
    return this;
  }

  async validate(data = [], options = {}) {
    options = Object.assign(
      { presence: "required", abortEarly: true },
      options
    );
    return HIBP.schema.validateAsync(data, options);
  }
}

module.exports = HIBP;
