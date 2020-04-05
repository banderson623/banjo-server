require('dotenv').config();

const redis = require('redis');

class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    return new Promise(resolve => {
      resolve(this.store.get(key));
    });
  }

  set(key, data) {
    return new Promise(resolve => {
      resolve(this.store.set(key, data));
    });
  }
}

class RedisStore {
  constructor() {
    this.client = redis.createClient((url = process.env.REDIS_URL));
  }

  get(key) {
    return new Promise(resolve => {
      this.client.get(key, value => {
        resolve(value);
      });
    });
  }

  set(key) {
    return new Promise(resolve => {
      // Purposefully ignoring any set return values
      this.client.set(key, value);
      resolve();
    });
  }
}

module.exports = {
  memStore: new MemoryStore(),
  redisStore: new RedisStore(),
};
