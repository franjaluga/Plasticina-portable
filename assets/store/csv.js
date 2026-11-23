(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const {
    createDocument,
    parseDate,
    transaction,
    validateDocument,
  } = s;

  function parseCsv(text, delimiter) {
    const source = String(text === null || text === undefined ? '' : text).replace(/^\uFEFF/, '');
    const separator = delimiter === undefined || delimiter === null || delimiter === '' ? ',' : String(delimiter).charAt(0);
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < source.length; i++) {
      const character = source[i];
      if (quoted) {
        if (character === '"') {
          if (source[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"' && field === '') {
        quoted = true;
      } else if (character === separator) {
        row.push(field);
        field = '';
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && source[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += character;
      }
    }
    if (quoted) throw new Error('CSV inválido: comilla sin cerrar.');
    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function importCsv(text) {
    return transaction(function () {
      const rows = parseCsv(text, ',');
      let headers = null;
      let processed = 0;
      const errors = [];
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const line = index + 1;
        if (headers === null) {
          headers = row.map(function (header) { return String(header).trim(); });
          continue;
        }
        if (row.every(function (value) { return String(value).trim() === ''; })) continue;
        if (headers.length !== row.length) {
          errors.push('Línea ' + line + ': Las columnas no coinciden con los encabezados.');
          continue;
        }
        const data = {};
        headers.forEach(function (header, position) { data[header] = row[position]; });
        ['date', 'date_centralize'].forEach(function (field) {
          if (data[field] !== undefined && data[field] !== null && String(data[field]).trim() !== '') {
            const parsed = parseDate(String(data[field]).trim());
            data[field] = parsed || data[field];
          }
        });
        if (data.td_ref !== undefined && data.td_ref !== null && String(data.td_ref).trim() !== '') {
          data.td_ref = String(data.td_ref).trim().slice(0, 2);
        }
        ['rut_ref', 'folio_ref', 'net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax'].forEach(function (field) {
          if (data[field] !== undefined && String(data[field]).trim() === '') data[field] = null;
        });
        const validation = validateDocument(data);
        const messages = [];
        Object.keys(validation).forEach(function (field) {
          validation[field].forEach(function (message) { messages.push(message); });
        });
        if (messages.length > 0) {
          errors.push('Línea ' + line + ': ' + messages.join(', '));
          continue;
        }
        try {
          createDocument(data);
          processed++;
        } catch (error) {
          errors.push('Línea ' + line + ': ' + error.message);
        }
      }
      if (errors.length > 0) throw new Error('Errores en el CSV: ' + errors.join(' | '));
      if (processed === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
      return processed;
    });
  }

  Object.assign(s, {
    parseCsv,
    importCsv,
  });
})();
