import NodeCache from "node-cache";

/**
 * Simple in-memory cache layer.
 * Keys are normalized location strings; values are report JSON.
 */
class CacheService {
  constructor(ttlSeconds = 3600) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: 120 });
  }

  /** Generate a stable cache key from a location string. */
  _key(location) {
    return `report:${location.toLowerCase().replace(/\s+/g, "_")}`;
  }

  get(location) {
    return this.cache.get(this._key(location)) || null;
  }

  set(location, report) {
    this.cache.set(this._key(location), report);
  }

  stats() {
    return this.cache.getStats();
  }
}

export default CacheService;
