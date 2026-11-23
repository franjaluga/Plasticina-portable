(function () {
  'use strict';

  const db = window.Plasticina.db;
  const q = db.queries;

  function mapEntity(row) {
    if (!row) return null;
    return { id: Number(row.id), rut: String(row.rut), name: String(row.name) };
  }

  function mapDocumentType(row) {
    if (!row) return null;
    return { id: Number(row.id), doctype: Number(row.doctype), name: String(row.name) };
  }

  function mapTemplate(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: row.description === null || row.description === undefined ? '' : String(row.description)
    };
  }

  function mapItem(row) {
    if (!row) return null;
    return {
      id: Number(row.id),
      account_template_id: Number(row.account_template_id),
      code: String(row.code),
      name: String(row.name),
      category: String(row.category)
    };
  }

  const entities = {
    all: function () { return db.all(q.entities.all).map(mapEntity); },
    find: function (id) { return mapEntity(db.get(q.entities.byId, [id])); },
    byRut: function (rut) { return mapEntity(db.get(q.entities.byRut, [rut])); },
    create: function (data) {
      const result = db.run(q.entities.insert, [data.rut, data.name]);
      return entities.find(result.lastInsertRowid);
    }
  };

  const documentTypes = {
    all: function () { return db.all(q.documentTypes.all).map(mapDocumentType); },
    byDoctype: function (doctype) { return mapDocumentType(db.get(q.documentTypes.byDoctype, [doctype])); },
    find: function (id) { return mapDocumentType(db.get(q.documentTypes.byId, [id])); },
    create: function (data) {
      const result = db.run(q.documentTypes.insert, [data.doctype, data.name]);
      return documentTypes.find(result.lastInsertRowid);
    }
  };

  const templates = {
    all: function () {
      return db.all(q.templates.all).map(function (row) {
        const item = mapTemplate(row);
        item.items_count = Number(db.get(q.templates.countItems, [item.id]).count);
        return item;
      });
    },
    find: function (id) {
      let row = db.get(q.templates.byId, [id]);
      if (!row) row = db.get(q.templates.bySlug, [id]);
      return mapTemplate(row);
    },
    create: function (data) {
      const result = db.run(q.templates.insert, [data.slug, data.name, data.description || '']);
      return templates.find(result.lastInsertRowid);
    },
    update: function (id, data) {
      db.run(q.templates.update, [data.name, data.description || '', id]);
      return templates.find(id);
    },
    remove: function (id) {
      db.run(q.templates.remove, [id]);
      return true;
    },
    items: function (templateId) { return db.all(q.templates.items, [templateId]).map(mapItem); },
    item: function (templateId, itemId) { return mapItem(db.get(q.templates.itemById, [itemId, templateId])); },
    insertItem: function (templateId, data) {
      const result = db.run(q.templates.insertItem, [templateId, data.code, data.name, data.category || 'activo']);
      return mapItem(db.get(q.templates.itemById, [result.lastInsertRowid, templateId]));
    },
    updateItem: function (templateId, data) {
      db.run(q.templates.updateItem, [data.code, data.name, data.category || 'activo', data.id, templateId]);
      return mapItem(db.get(q.templates.itemById, [data.id, templateId]));
    },
    removeItem: function (templateId, itemId) {
      db.run(q.templates.removeItem, [itemId, templateId]);
      return true;
    },
    removeItems: function (templateId) {
      db.run(q.templates.removeItems, [templateId]);
      return true;
    }
  };

  db.repositories.entities = entities;
  db.repositories.documentTypes = documentTypes;
  db.repositories.templates = templates;
})();
