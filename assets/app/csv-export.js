(function () {
  'use strict';

  function csvCell(value) {
    const text = String(value === null || value === undefined ? '' : value);
    return /[;"\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function journalRow(journal, entry) {
    return [
      journal.id,
      journal.date,
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

  window.Plasticina.app.exportSystemJournalsCsv = exportSystemJournalsCsv;
})();
