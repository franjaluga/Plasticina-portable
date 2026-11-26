(function () {
  'use strict';

  const q = window.Plasticina.db.queries;

  function direction(filters) {
    return filters && filters.order === 'desc' ? 'DESC' : 'ASC';
  }

  function monthEnd(dateExpression) {
    return "date(substr(" + dateExpression + ", 1, 7) || '-01', '+1 month', '-1 day')";
  }

  function systemConditions(ownerId, year, filters) {
    const registeredPeriod = "substr('0000' || CAST(d.year_register AS TEXT), -4) || '-' || " +
      "substr('00' || CAST(d.month_register AS TEXT), -2) || '-01'";
    const centralizeDate = "COALESCE(NULLIF(d.date_centralize, ''), j.date)";
    const effectiveDate = "CASE WHEN d.id IS NOT NULL THEN COALESCE(" +
      monthEnd(registeredPeriod) + ', ' + monthEnd(centralizeDate) + ', j.date) ELSE j.date END';
    const clauses = [
      'j.owner_id = ?',
      '(j.year = ? OR (j.vc_document_id IS NOT NULL AND substr(' + effectiveDate + ', 1, 4) = CAST(? AS TEXT)))'
    ];
    const params = [ownerId, year, year];
    if (filters.entry_from !== undefined && filters.entry_from !== null) {
      clauses.push('j.entry_number >= ?');
      params.push(filters.entry_from);
    }
    if (filters.entry_to !== undefined && filters.entry_to !== null) {
      clauses.push('j.entry_number <= ?');
      params.push(filters.entry_to);
    }
    if (filters.date_from !== undefined && filters.date_from !== null) {
      clauses.push(effectiveDate + ' >= ?');
      params.push(String(filters.date_from));
    }
    if (filters.date_to !== undefined && filters.date_to !== null) {
      clauses.push(effectiveDate + ' <= ?');
      params.push(String(filters.date_to));
    }
    if (filters.folio_from !== undefined && filters.folio_from !== null) {
      clauses.push('d.folio >= ?');
      params.push(filters.folio_from);
    }
    if (filters.folio_to !== undefined && filters.folio_to !== null) {
      clauses.push('d.folio <= ?');
      params.push(filters.folio_to);
    }
    if (filters.rut !== undefined && filters.rut !== null) {
      clauses.push('INSTR(LOWER(COALESCE(e.rut, \'\')), LOWER(?)) > 0');
      params.push(String(filters.rut));
    }
    if (filters.document_type_id !== undefined && filters.document_type_id !== null) {
      clauses.push('d.document_type_id = ?');
      params.push(filters.document_type_id);
    }
    if (filters.folio_ref !== undefined && filters.folio_ref !== null) {
      clauses.push('INSTR(LOWER(COALESCE(d.folio_ref, \'\')), LOWER(?)) > 0');
      params.push(String(filters.folio_ref));
    }
    return { clauses: clauses, params: params };
  }

  q.journals = {
    list: function (filters) {
      const clauses = [];
      const params = [];
      if (filters.owner_id !== undefined && filters.owner_id !== null) {
        clauses.push('owner_id = ?');
        params.push(filters.owner_id);
      }
      if (filters.year !== undefined && filters.year !== null) {
        clauses.push('year = ?');
        params.push(filters.year);
      }
      if (filters.date_from !== undefined && filters.date_from !== null) {
        clauses.push('date >= ?');
        params.push(String(filters.date_from));
      }
      if (filters.date_to !== undefined && filters.date_to !== null) {
        clauses.push('date <= ?');
        params.push(String(filters.date_to));
      }
      const sql = 'SELECT * FROM journals' + (clauses.length ? ' WHERE ' + clauses.join(' AND ') : '') +
        ' ORDER BY date ' + direction(filters) + ', entry_number ' + direction(filters) + ', id ' + direction(filters);
      return { sql: sql, params: params };
    },
    system: function (ownerId, year, filters) {
      const built = systemConditions(ownerId, year, filters || {});
      return {
        sql: 'SELECT j.* FROM journals j LEFT JOIN vc_documents d ON d.id = j.vc_document_id ' +
          'LEFT JOIN entities e ON e.id = d.entity_id WHERE ' + built.clauses.join(' AND ') +
          ' ORDER BY j.date ASC, j.entry_number ASC, j.id ASC',
        params: built.params
      };
    },
    ledger: 'SELECT DISTINCT j.* FROM journals j JOIN journal_entries e ON e.journal_id = j.id ' +
      'WHERE j.owner_id = ? AND substr(j.date, 1, 4) = ? AND substr(j.date, 6, 2) = ? AND e.account_code = ? ' +
      'ORDER BY j.date ASC, j.entry_number ASC, j.id ASC',
    taxTotals: function (filters) {
      const clauses = ['j.owner_id = ?', 'j.year = ?'];
      const params = [];
      if (filters.date_from !== undefined && filters.date_from !== null) {
        clauses.push('j.date >= ?');
        params.push(String(filters.date_from));
      }
      if (filters.date_to !== undefined && filters.date_to !== null) {
        clauses.push('j.date <= ?');
        params.push(String(filters.date_to));
      }
      return {
        sql: 'SELECT e.account_code AS code, COALESCE(a.name, \'Cuenta Sin Nombre\') AS name, ' +
          'COALESCE(a.category, \'\') AS category, SUM(e.debit) AS sum_debit, SUM(e.credit) AS sum_credit ' +
          'FROM journal_entries e JOIN journals j ON j.id = e.journal_id ' +
          'LEFT JOIN accounts a ON a.code = e.account_code AND a.owner_id = j.owner_id ' +
          'WHERE ' + clauses.join(' AND ') + ' GROUP BY e.account_code ORDER BY e.account_code ASC',
        params: params
      };
    },
    paidAmount: function (column) {
      const safeColumn = column === 'debit' ? 'debit' : 'credit';
      return 'SELECT COALESCE(SUM(e.' + safeColumn + '), 0) AS paid FROM journal_entries e ' +
        'JOIN journals j ON j.id = e.journal_id WHERE j.owner_id = ? AND j.ref_doc_payed = ? AND e.account_code = ?';
    },
    byId: 'SELECT * FROM journals WHERE id = ?',
    nextEntryNumber: 'SELECT COALESCE(MAX(entry_number), 0) + 1 AS entry_number FROM journals WHERE owner_id = ? AND year = ?',
    hasJournal: 'SELECT 1 AS found FROM journals WHERE vc_document_id = ? LIMIT 1',
    insert: 'INSERT INTO journals (' +
      'vc_document_id, ref_doc_payed, owner_id, year, entry_number, date, description,' +
      'total_debit, total_credit, is_balanced, created_at, updated_at' +
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    update: 'UPDATE journals SET year = ?, date = ?, description = ?, total_debit = ?, total_credit = ?, ' +
      'is_balanced = ?, updated_at = ? WHERE id = ?',
    remove: 'DELETE FROM journals WHERE id = ?',
    removeMany: function (ids) {
      return 'DELETE FROM journals WHERE id IN (' + ids.map(function () { return '?'; }).join(',') + ')';
    }
  };
})();
