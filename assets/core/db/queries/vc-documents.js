(function () {
  'use strict';

  const q = window.Plasticina.db.queries;

  function conditions(filters) {
    const clauses = [];
    const params = [];
    if (filters.owner_id !== undefined && filters.owner_id !== null) {
      clauses.push('d.owner_id = ?');
      params.push(filters.owner_id);
    }
    const year = filters.year_register !== undefined ? filters.year_register : filters.year;
    if (year !== undefined && year !== null) {
      clauses.push('d.year_register = ?');
      params.push(year);
    }
    const month = filters.month_register !== undefined ? filters.month_register : filters.month;
    if (month !== undefined && month !== null) {
      clauses.push('d.month_register = ?');
      params.push(month);
    }
    if (filters.type_vc !== undefined && filters.type_vc !== null) {
      clauses.push('UPPER(TRIM(d.type_vc)) = ?');
      params.push(String(filters.type_vc).trim().toUpperCase());
    }
    if (filters.entity_id !== undefined && filters.entity_id !== null) {
      clauses.push('d.entity_id = ?');
      params.push(filters.entity_id);
    }
    if (filters.document_type_id !== undefined && filters.document_type_id !== null) {
      clauses.push('d.document_type_id = ?');
      params.push(filters.document_type_id);
    }
    if (filters.folio !== undefined && filters.folio !== null) {
      clauses.push('d.folio = ?');
      params.push(filters.folio);
    }
    if (filters.rut !== undefined && filters.rut !== null) {
      clauses.push('INSTR(LOWER(e.rut), LOWER(?)) > 0');
      params.push(String(filters.rut));
    }
    if (filters.date !== undefined && filters.date !== null) {
      clauses.push('d.date = ?');
      params.push(String(filters.date));
    }
    if (filters.date_from !== undefined && filters.date_from !== null) {
      clauses.push('d.date >= ?');
      params.push(String(filters.date_from));
    }
    if (filters.date_to !== undefined && filters.date_to !== null) {
      clauses.push('d.date <= ?');
      params.push(String(filters.date_to));
    }
    if (filters.pending) {
      clauses.push('NOT EXISTS (SELECT 1 FROM journals j WHERE j.vc_document_id = d.id)');
    }
    return { clauses: clauses, params: params };
  }

  function direction(filters) {
    return filters.order === 'desc' ? 'DESC' : 'ASC';
  }

  const FROM = 'FROM vc_documents d JOIN entities e ON e.id = d.entity_id';

  q.vcDocuments = {
    all: 'SELECT * FROM vc_documents ORDER BY id ASC',
    from: FROM,
    list: function (filters) {
      const built = conditions(filters || {});
      const sql = 'SELECT d.* ' + FROM +
        (built.clauses.length ? ' WHERE ' + built.clauses.join(' AND ') : '') +
        ' ORDER BY d.month_register ' + direction(filters || {}) + ', d.date ' + direction(filters || {}) +
        ', d.folio ' + direction(filters || {}) + ', d.id ' + direction(filters || {});
      return { sql: sql, params: built.params };
    },
    pending: function (ownerId, year, filters) {
      const source = Object.assign({}, filters || {}, { owner_id: ownerId, year_register: year, pending: true });
      const built = conditions(source);
      const sql = 'SELECT d.* ' + FROM +
        ' WHERE ' + built.clauses.join(' AND ') +
        ' ORDER BY d.month_register ASC, d.date ASC, d.folio ASC, d.id ASC';
      return { sql: sql, params: built.params };
    },
    query: 'SELECT d.* ' + FROM +
      ' WHERE d.owner_id = ? AND UPPER(TRIM(d.type_vc)) = ? AND d.month_register = ? AND d.year_register = ?' +
      ' ORDER BY d.folio ASC, d.id ASC',
    byId: 'SELECT * FROM vc_documents WHERE id = ?',
    duplicate: 'SELECT * FROM vc_documents WHERE entity_id = ? AND document_type_id = ? AND folio = ? LIMIT 1',
    hasJournal: 'SELECT 1 AS found FROM journals WHERE vc_document_id = ? LIMIT 1',
    insert: 'INSERT INTO vc_documents (' +
      'month_register, year_register, type_vc, entity_id, document_type_id, folio, date, rut_ref, folio_ref,' +
      'td_ref, date_centralize, net, exempt, vat_rec, vat_no_rec, plus_oth_tax, minus_oth_tax, total, owner_id' +
      ') VALUES (' + Array.from({ length: 19 }, function () { return '?'; }).join(',') + ')',
    remove: 'DELETE FROM vc_documents WHERE id = ?',
    nextId: 'SELECT COALESCE(MAX(id), 0) + 1 AS id FROM vc_documents'
  };
})();
