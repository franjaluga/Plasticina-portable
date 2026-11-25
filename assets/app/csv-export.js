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

  function journalOptions(query) {
    const options = { year: Store.workingYear() };
    const owner = Store.activeOwner();
    if (owner) options.owner_id = owner.id;
    if (query.date_from && query.date_to) {
      options.date_from = query.date_from;
      options.date_to = query.date_to;
    }
    return options;
  }

  function exportJournalCsv(query) {
    const journals = Store.journals(journalOptions(query || {}));
    const filename = 'libro_diario_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv';
    UI.download(filename, toCsv(buildRows(journals)), 'text/csv;charset=utf-8');
    UI.flash('success', 'Libro diario exportado en CSV.');
    const route = UI.route('vc_documents.journal_book');
    const filters = query && query.date_from && query.date_to
      ? '?' + encodeURIComponent('date_from') + '=' + encodeURIComponent(query.date_from) +
        '&' + encodeURIComponent('date_to') + '=' + encodeURIComponent(query.date_to)
      : '';
    const target = '#' + route.replace(/^#/, '') + filters;
    if (window.location.hash === target) {
      if (window.App) window.App.render();
    } else {
      window.location.hash = target;
    }
  }

  window.Plasticina.app.exportJournalCsv = exportJournalCsv;
})();
