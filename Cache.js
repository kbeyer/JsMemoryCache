/*global Util*/     // for Util.IsNullOrUndefined
/*global Hash*/     // used as base data structure
/*global Logger*/   // used to capture info/errors

// use var Cache to create Cache object in global scope
// use self-invoking annonymous function to encapsulate local scope
;(function(global, Util, Hash, Logger) {
  
  // this function scope is in strict mode
  "use strict";

  // local function try invoke
  function tryInvoke(callback, value) {
    if (typeof (callback) === 'function') {
      callback.call(null, value);
    }
  }
  
  // CacheObj stores the meta-data used by Cache for understanding
  // the current state of a cached object. Only used by Cache.
  // @key         - key used to access the object
  // @obj         - the object being cached
  // @born        - timestamp when object was added to cache
  // @ttl         - number of milliseconds before object needs refreshed
  // @refreshFn   - function that will be called when object needs updated 
  var CacheObj = global.CacheObj = function(key, obj, born, ttl, refreshFn) {
    this.key = key;
    this.val = obj;
    this.born = born;
    this.ttl = ttl;
    this.refresh = refreshFn;
  };

  var Cache = global.Cache = function() {
    // data cache
    this.dataHash = new Hash();
  };

  //Cache.version = 0.1; // initial version
  Cache.version = 0.2; // merged changes from bruslim/patch-1, reformatting, more docs

  // adds an item to the cache
  // @k - the key for the item
  // @o - the value of the item to add
  // @t - number of seconds until item expires
  // @r - the function to call when the item needs refreshed
  Cache.prototype.add = function (k, o, t, r) {
    if (t <= 0 || Util.IsNullOrUndefined(k)) { return false; }
    // add to data hash
    this.dataHash[k] = new CacheObj(k, o, new Date(), t * 1000, r);
    //Logger.Log("Cache ADD. key: " + k);
    return true;
  };

  // updates an existing item in the cache
  // @k - the key for the item
  // @o - the new value for the item
  // @t - (optional) update to seconds object should live in cache
  Cache.prototype.update = function (k, o, t) {
    if (Util.IsNullOrUndefined(k) ||
      Util.IsNullOrUndefined(this.dataHash[k])) {
      return false;
    }
    // update value
    this.dataHash[k].val = o;
    // update born on date
    this.dataHash[k].born = new Date();
    // check if ttl should be updated
    if (t !== undefined && t > 0) {
      this.dataHash[k].ttl = t * 1000;
    }
    //Logger.Log("Cache UPDATE. key: " + k);
    return true;
  };

  /**
   * Interal try get
   * @param k {string} - Key for the item
   * @param [c] {function} - callback to call with value
   */
  Cache.prototype._tryGet = function(k, c) {
    if (Util.IsNullOrUndefined(k)) {
      tryInvoke(c, undefined);
      return false;
    }
    var cObj = this.dataHash[k];
    tryInvoke(c, cObj);
    return Util.IsNullOrUndefined(cObj) && cObj.val !== null;
  };

  // tries to get an object directly from cache w/o going through expiration and auto-refresh checks
  // @k - the key for the item
  // @c - the callback function to use for returning values
  // returns true if found else false
  Cache.prototype.tryGet = function (k, c) {
    return this._tryGet(k, function(cObj) {
      if (typeof (c) === 'function') {
        c.call(null, cObj.val);
      }
    });
  };

  // gets an item from the cache
  // if the item has expired and it has an associated refresh delegate then it will be called
  // @k - the key for the item
  // @c - the callback function to use for returning values
  // @r - flag to indicate if refresh should be called on item expiration
  Cache.prototype.get = function (k, c, r) {
    if (typeof (c) !== 'function') {
      return false;
    }
    return this._tryGet(k, function(cObj) {
      // if cObj is undefined or null
      if (!cObj) {
        c.call(null, null);
      }

      // if value is null or no auto-refresh or if item expired
      if (!Util.IsNullOrUndefined(cObj.val) || 
          !r || 
          (new Date()).getTime() < (cObj.born.getTime() + cObj.ttl)) {
        // return existing
        c.call(null, cObj.val);
        //Logger.Log("Cache Hit! key: " + k);
        return; // exit callback
      } 

      if (typeof (cObj.refresh) === 'function') {
        // refresh & let refresh function return value via callback
        cObj.refresh.call(null, cObj.val, c);
        //Logger.Log("Cache Hit! But expired.  Auto-refreshing. key: " + k);
      } else {
        // remove object completely
        delete(this.dataHash[k]);
        // return null
        c.call(null, null);
        Logger.Log("Cache Hit! But expired. Can't refresh. Returning NULL. key: " + k);
      }
    });
  };

  // removes an item from cache
  Cache.prototype.remove = function (k, c) {
    return this._tryGet(k, function(cObj){
      if (cObj !== undefined) {
        // remove the key with delete
        delete(this.dataHash[k]); 
        // although this causes a lookup of the property k, 
        // in js we assume this is an O(1) operation since its 
        // the same as this.dataHash.whateverKIs
      }
      // if callback was provided, call it with the value
      tryInvoke(c, cObj.val);
      //Logger.Log("Cache ADD. key: " + k);
    });
  };
  
})(this, Util, Hash, Logger);
// this is window or global object when not in strict mode