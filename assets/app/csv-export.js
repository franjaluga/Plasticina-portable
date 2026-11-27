(function () {
  'use strict';

  function csvCell(value) {
    const text = String(value === null || value === undefined ? '' : value);
    return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function journalRow(journal, entry) {
    return [
      journal.id,
      journal.closing_date || journal.date,
      journal.description || 'Sin descripción',
      journal.vc_document_id || '',
      journal.is_balanced ? 'Cuadrado' : 'Descuadrado',
      entry.account_code,
      entry.account ? entry.account.name : 'Sin nombre',
      entry.debit,
      entry.credit
    ];
  }

  function journalSeparator() {
    return ['---', '---', '---', '---', '---', '---', '---', '---', '---'];
  }

  function buildRows(journals) {
    const rows = [['Asiento ID', 'Fecha', 'Glosa', 'Doc V/C ID', 'Estado', 'Codigo Cuenta', 'Componente', 'Debe', 'Haber']];
    journals.forEach(function (journal, index) {
      journal.entries.forEach(function (entry) {
        rows.push(journalRow(journal, entry));
      });
      if (index < journals.length - 1) rows.push(journalSeparator());
    });
    return rows;
  }

  function toCsv(rows) {
    return '\uFEFF' + rows.map(function (row) {
      return row.map(csvCell).join(';');
    }).join('\r\n');
  }

  const systemFilterKeys = ['entry_from', 'entry_to', 'date_from', 'date_to', 'folio_from', 'folio_to', 'rut', 'document_type_id', 'folio_ref'];

  function systemJournalOptions(query) {
    const source = query || {};
    const year = source.year === undefined || source.year === '' ? Store.workingYear() : source.year;
    const filters = {};
    systemFilterKeys.forEach(function (key) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') filters[key] = source[key];
    });
    return { year: year, filters: filters };
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function csvNumber(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function taxBalancePeriod(query) {
    const source = query || {};
    const rawMonth = Number(source.month);
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth : Number(UI.today().slice(5, 7));
    const rawYear = Number(source.year);
    const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : Store.workingYear();
    const lastDay = new Date(year, month, 0).getDate();
    return {
      month: month,
      year: year,
      lastDay: lastDay,
      dateFrom: year + '-01-01',
      dateTo: year + '-' + pad(month) + '-' + pad(lastDay)
    };
  }

  const taxBalanceNote = 'Art. 100 del Código Tributario, los antecedentes fueron presentados ante mí como fidedignos.';

  function taxBalanceRows(balanceRows, period, owner) {
    const figures = window.Plasticina.views.helpers.taxBalanceFigures(balanceRows);
    const periodLabel = '01/01/' + period.year + ' al ' + pad(period.lastDay) + '/' + pad(period.month) + '/' + period.year;
    const rows = [
      ['Empresa', owner ? owner.name : 'Sin Empresa'],
      ['RUT', owner ? owner.rut : 'N/A'],
      ['Periodo Comercial', periodLabel],
      [
        'Código', 'Cuenta Contable', 'Sumas Débito', 'Sumas Crédito',
        'Saldos Deudor', 'Saldos Acreedor', 'Inventario Activo', 'Inventario Pasivo',
        'Resultados Pérdida', 'Resultados Ganancia'
      ]
    ];
    (balanceRows || []).forEach(function (row) {
      rows.push([
        row.code, row.name,
        csvNumber(row.sum_debit), csvNumber(row.sum_credit),
        csvNumber(row.balance_debit), csvNumber(row.balance_credit),
        csvNumber(row.activo), csvNumber(row.pasivo),
        csvNumber(row.perdida), csvNumber(row.ganancia)
      ]);
    });
    if (balanceRows && balanceRows.length) {
      rows.push([
        'Sumas', '',
        csvNumber(figures.sumSd), csvNumber(figures.sumSc),
        csvNumber(figures.sumBd), csvNumber(figures.sumBc),
        csvNumber(figures.sumAct), csvNumber(figures.sumPas),
        csvNumber(figures.sumPer), csvNumber(figures.sumGan)
      ]);
      rows.push([
        'Resultado del Ejercicio (' + (figures.sumGan > figures.sumPer ? 'Utilidad' : 'Pérdida') + ')',
        '', '', '', '', '',
        csvNumber(figures.resActivo), csvNumber(figures.resPasivo),
        csvNumber(figures.resPerdida), csvNumber(figures.resGanancia)
      ]);
      rows.push([
        'Sumas Iguales', '',
        csvNumber(figures.sumSd), csvNumber(figures.sumSc),
        csvNumber(figures.sumBd), csvNumber(figures.sumBc),
        csvNumber(figures.totalInvActivo), csvNumber(figures.totalInvPasivo),
        csvNumber(figures.totalResPerdida), csvNumber(figures.totalResGanancia)
      ]);
    }
    rows.push([taxBalanceNote]);
    return rows;
  }

  function exportSystemJournalsCsv(query) {
    const options = systemJournalOptions(query);
    const journals = Store.systemJournals(options.year, options.filters);
    const filename = 'asientos_sistema_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv';
    UI.download(filename, toCsv(buildRows(journals)), 'text/csv;charset=utf-8');
    UI.flash('success', 'Asientos del sistema exportados en CSV.');
    const target = UI.route('accounting.system_journals', query || {});
    if (window.location.hash === target) {
      if (window.App) window.App.render();
    } else {
      window.location.hash = target;
    }
  }

  function exportTaxBalanceCsv(query) {
    const period = taxBalancePeriod(query);
    const balanceRows = Store.taxBalance(period.year, { date_from: period.dateFrom, date_to: period.dateTo }) || [];
    const filename = 'balance_tributario_' + period.year + '-' + pad(period.month) + '_' +
      new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv';
    UI.download(filename, toCsv(taxBalanceRows(balanceRows, period, Store.activeOwner())), 'text/csv;charset=utf-8');
    UI.flash('success', 'Balance tributario exportado en CSV.');
    const target = UI.route('vc_documents.tax_balance', query || {});
    if (window.location.hash === target) {
      if (window.App) window.App.render();
    } else {
      window.location.hash = target;
    }
  }

  window.Plasticina.app.exportSystemJournalsCsv = exportSystemJournalsCsv;
  window.Plasticina.app.exportTaxBalanceCsv = exportTaxBalanceCsv;
})();
