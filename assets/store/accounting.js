(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const db = window.Plasticina.db;
  const {
    activeOwnerRaw,
    hydrateDocument,
    isSaleDocument,
    num,
    rawAccountByCode,
    round2,
    typeOf,
    workingYear,
  } = s;
  const CATEGORY_BY_FIRST_DIGIT = { '1': 'activo', '2': 'pasivo', '3': 'patrimonio', '4': 'ganancia' };

  function collectAccountTotals(ownerId, year, filters) {
    const grouped = {};
    db.repositories.journals.taxTotals(ownerId, year, filters).forEach(function (row) {
      grouped[row.code] = row;
    });
    return grouped;
  }

  function createAccountRow(code, linkedAccount) {
    return {
      code: code,
      name: linkedAccount && linkedAccount.name ? linkedAccount.name : 'Cuenta Sin Nombre',
      category: linkedAccount ? String(linkedAccount.category || '').trim().toLowerCase() : '',
      sum_debit: 0,
      sum_credit: 0
    };
  }

  function inferCategory(code, declaredCategory) {
    if (declaredCategory) return declaredCategory;
    return CATEGORY_BY_FIRST_DIGIT[String(code).slice(0, 1)] || 'perdida';
  }

  function allocateBalances(category, balanceDebit, balanceCredit) {
    const values = { activo: 0, pasivo: 0, perdida: 0, ganancia: 0 };
    if (category === 'activo') {
      values.activo = balanceDebit - balanceCredit;
      transferNegative(values, 'activo', 'pasivo');
    } else if (category === 'pasivo' || category === 'patrimonio') {
      values.pasivo = balanceCredit - balanceDebit;
      transferNegative(values, 'pasivo', 'activo');
    } else if (category === 'ganancia') {
      values.ganancia = balanceCredit - balanceDebit;
      transferNegative(values, 'ganancia', 'perdida');
    } else {
      values.perdida = balanceDebit - balanceCredit;
      transferNegative(values, 'perdida', 'ganancia');
    }
    return values;
  }

  function transferNegative(values, from, to) {
    if (values[from] >= 0) return;
    values[to] = Math.abs(values[from]);
    values[from] = 0;
  }

  function buildTaxBalanceRow(row) {
    const difference = row.sum_debit - row.sum_credit;
    const balanceDebit = difference > 0 ? difference : 0;
    const balanceCredit = difference < 0 ? Math.abs(difference) : 0;
    const category = inferCategory(row.code, row.category);
    const values = allocateBalances(category, balanceDebit, balanceCredit);
    return {
      code: row.code,
      name: row.name,
      sum_debit: round2(row.sum_debit),
      sum_credit: round2(row.sum_credit),
      balance_debit: round2(balanceDebit),
      balance_credit: round2(balanceCredit),
      activo: Math.max(0, round2(values.activo)),
      pasivo: Math.max(0, round2(values.pasivo)),
      perdida: Math.max(0, round2(values.perdida)),
      ganancia: Math.max(0, round2(values.ganancia))
    };
  }

  function taxBalance(year, filters) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const grouped = collectAccountTotals(ownerRecord.id, year, filters);
    const rows = Object.keys(grouped).map(function (code) { return buildTaxBalanceRow(grouped[code]); });
    rows.sort(function (a, b) { return a.code < b.code ? -1 : (a.code > b.code ? 1 : 0); });
    return rows;
  }

  function paymentAccount(document) {
    const sale = isSaleDocument(document) && typeOf(document) === 'V';
    return { account: sale ? '1010401' : '2010201', column: sale ? 'credit' : 'debit' };
  }

  function paidAmount(documentId, ownerId, account, column) {
    return db.repositories.journals.paidAmount(ownerId, documentId, account, column);
  }

  function pendingBalanceDocuments(year) {
    const ownerRecord = activeOwnerRaw();
    if (!ownerRecord) return [];
    const targetYear = year === undefined || year === null ? workingYear() : Number(year);
    const result = [];
    s.state.documents.forEach(function (item) {
      if (Number(item.owner_id) !== Number(ownerRecord.id)) return;
      if (Number(item.year_register) !== targetYear) return;
      const posted = s.state.journals.some(function (journalRecord) {
        return Number(journalRecord.vc_document_id) === Number(item.id);
      });
      if (!posted) return;
      const target = paymentAccount(item);
      const document = hydrateDocument(item, true);
      document.calculated_paid = round2(paidAmount(item.id, ownerRecord.id, target.account, target.column));
      document.calculated_balance = round2(num(document.total) - document.calculated_paid);
      if (document.calculated_balance !== 0) result.push(document);
    });
    result.sort(function (a, b) { return Number(a.folio) - Number(b.folio); });
    return result;
  }

  Object.assign(s, {
    taxBalance,
    pendingBalanceDocuments,
  });
})();
