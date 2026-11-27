(function () {
  'use strict';

  const db = window.Plasticina.db;
  const resolvers = Object.create(null);
  const cache = new Map();
  const pending = new Map();
  const counters = { hits: 0, misses: 0, invalidations: 0, resolutions: 0 };
  let epoch = 0;

  function define(name, resolver, options) {
    if (typeof name !== 'string' || !name || typeof resolver !== 'function') {
      throw new Error('Dataset inválido: ' + String(name));
    }
    const settings = options || {};
    resolvers[name] = {
      resolver: resolver,
      tags: Array.isArray(settings.tags) ? settings.tags.slice() : [],
      required: Array.isArray(settings.required) ? settings.required.slice() : []
    };
  }

  function normalizeContext(context) {
    const source = context || {};
    const params = source.params && typeof source.params === 'object' ? source.params : {};
    const query = source.query && typeof source.query === 'object' ? source.query : {};
    const include = Array.isArray(source.include) ? source.include.slice().sort() : [];
    return {
      ownerId: source.ownerId === undefined || source.ownerId === null ? null : Number(source.ownerId),
      workingYear: source.workingYear === undefined || source.workingYear === null ? null : Number(source.workingYear),
      year: source.year === undefined || source.year === null ? null : Number(source.year),
      month: source.month === undefined || source.month === null ? null : Number(source.month),
      params: params,
      query: query,
      include: include
    };
  }

  function cacheKey(name, context) {
    return JSON.stringify([
      name,
      db.version(),
      epoch,
      context.ownerId,
      context.workingYear,
      context.year,
      context.month,
      context.params,
      context.query,
      context.include
    ]);
  }

  function validate(name, context) {
    const definition = resolvers[name];
    if (!definition) throw new Error('Dataset no registrado: ' + name);
    definition.required.forEach(function (field) {
      const value = context[field];
      if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) {
        throw new Error('El dataset ' + name + ' requiere ' + field + ' en el contexto.');
      }
    });
  }

  function resolve(name, context) {
    const normalized = normalizeContext(context);
    validate(name, normalized);
    const key = cacheKey(name, normalized);
    if (cache.has(key)) {
      counters.hits += 1;
      return Promise.resolve(cache.get(key));
    }
    if (pending.has(key)) return pending.get(key);

    const task = Promise.resolve()
      .then(function () { return db.ensureFresh ? db.ensureFresh() : null; })
      .then(function () { return resolvers[name].resolver(normalized); })
      .then(function (data) {
        const result = {
          data: data,
          meta: {
            resource: name,
            key: key,
            version: db.version(),
            epoch: epoch,
            ownerId: normalized.ownerId,
            workingYear: normalized.workingYear
          }
        };
        cache.set(key, result);
        counters.misses += 1;
        counters.resolutions += 1;
        return result;
      })
      .finally(function () { pending.delete(key); });

    pending.set(key, task);
    return task;
  }

  function resolveMany(names, context) {
    const resources = Array.isArray(names) ? names.slice() : [];
    return Promise.all(resources.map(function (name) { return resolve(name, context); }))
      .then(function (results) {
        const data = Object.create(null);
        results.forEach(function (result) { data[result.meta.resource] = result.data; });
        return data;
      });
  }

  function invalidate(tags) {
    epoch += 1;
    const requested = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const wanted = requested.length ? requested : null;
    cache.forEach(function (value, key) {
      const name = value.meta.resource;
      const definition = resolvers[name];
      const resourceTags = definition ? definition.tags : [];
      if (!wanted || resourceTags.some(function (tag) { return wanted.indexOf(tag) !== -1; })) cache.delete(key);
    });
    counters.invalidations += 1;
    return epoch;
  }

  function clear() {
    cache.clear();
    pending.clear();
    epoch += 1;
  }

  function stats() {
    return {
      hits: counters.hits,
      misses: counters.misses,
      invalidations: counters.invalidations,
      resolutions: counters.resolutions,
      cached: cache.size,
      epoch: epoch
    };
  }

  db.access = {
    define: define,
    resolve: resolve,
    resolveMany: resolveMany,
    invalidate: invalidate,
    clear: clear,
    stats: stats
  };
  window.Data = window.Data || db.access;
})();
