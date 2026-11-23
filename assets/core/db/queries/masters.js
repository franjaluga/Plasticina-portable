(function () {
  'use strict';

  window.Plasticina.db.queries.entities = {
    all: 'SELECT * FROM entities ORDER BY id',
    byId: 'SELECT * FROM entities WHERE id = ?',
    byRut: 'SELECT * FROM entities WHERE rut = ? ORDER BY id LIMIT 1',
    insert: 'INSERT INTO entities (rut, name) VALUES (?, ?)',
    nextId: 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM entities'
  };

  window.Plasticina.db.queries.documentTypes = {
    all: 'SELECT * FROM document_types ORDER BY doctype, id',
    byId: 'SELECT * FROM document_types WHERE id = ?',
    byDoctype: 'SELECT * FROM document_types WHERE doctype = ? ORDER BY id LIMIT 1',
    insert: 'INSERT INTO document_types (doctype, name) VALUES (?, ?)',
    nextId: 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM document_types'
  };
})();
