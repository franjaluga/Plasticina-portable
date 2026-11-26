(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const {
    createDocument,
    parseDate,
    transaction,
    validateDocument,
  } = s;

  function asBytes(value) {
    if (value === null || value === undefined) return new Uint8Array(0);
    if (typeof value === 'string') return null;
    if (value instanceof Uint8Array) return value;
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return new Uint8Array(value);
    return null;
  }

  function decodeText(value) {
    if (value === null || value === undefined) return '';
    const bytes = asBytes(value);
    if (!bytes) return String(value);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (error) {
      try {
        return new TextDecoder('windows-1252').decode(bytes);
      } catch (fallbackError) {
        let result = '';
        for (let index = 0; index < bytes.length; index++) result += String.fromCharCode(bytes[index]);
        return result;
      }
    }
  }

  function detectDelimiter(text) {
    const source = String(text === null || text === undefined ? '' : text).replace(/^\uFEFF/, '');
    const candidates = [',', ';', '\t', '|'];
    const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
    let quoted = false;
    for (let index = 0; index < source.length; index++) {
      const character = source[index];
      if (quoted) {
        if (character === '"') {
          if (source[index + 1] === '"') index++;
          else quoted = false;
        }
        continue;
      }
      if (character === '"') {
        quoted = true;
      } else if (character === '\n' || character === '\r') {
        break;
      } else if (Object.prototype.hasOwnProperty.call(counts, character)) {
        counts[character] += 1;
      }
    }
    let best = ',';
    candidates.forEach(function (candidate) {
      if (counts[candidate] > counts[best]) best = candidate;
    });
    return best;
  }

  function parseCsv(text, delimiter) {
    const source = decodeText(text).replace(/^\uFEFF/, '');
    const separator = delimiter === undefined || delimiter === null || delimiter === ''
      ? detectDelimiter(source)
      : String(delimiter).charAt(0);
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
      const rows = parseCsv(text);
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
    decodeText,
    detectDelimiter,
    parseCsv,
    importCsv,
  });
})();
