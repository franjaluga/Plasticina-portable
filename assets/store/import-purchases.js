(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const {
    parseCsv, parseDate, num, round2, validateDocument,
    createDocument, transaction, documentTypeByDoctype, workingYear, reportPeriodStatus
  } = s;

  const PURCHASE_HEADERS = [
    'Nro', 'Tipo Doc', 'Tipo Compra', 'RUT Proveedor', 'Razon Social', 'Folio', 'Fecha Docto',
    'Fecha Recepcion', 'Fecha Acuse', 'Monto Exento', 'Monto Neto', 'Monto IVA Recuperable',
    'Monto Iva No Recuperable', 'Codigo IVA No Rec.', 'Monto Total', 'Monto Neto Activo Fijo',
    'IVA Activo Fijo', 'IVA uso Comun', 'Impto. Sin Derecho a Credito', 'IVA No Retenido',
    'Tabacos Puros', 'Tabacos Cigarrillos', 'Tabacos Elaborados', 'NCE o NDE sobre Fact. de Compra',
    'Codigo Otro Impuesto', 'Valor Otro Impuesto', 'Tasa Otro Impuesto'
  ];

  const REQUIRED_HEADERS = [
    'Tipo Doc', 'RUT Proveedor', 'Razon Social', 'Folio', 'Fecha Docto', 'Monto Total'
  ];

  const FIELD_HEADERS = {
    rut: 'RUT Proveedor',
    entity_name: 'Razon Social',
    doctype: 'Tipo Doc',
    folio: 'Folio',
    date: 'Fecha Docto',
    date_centralize: 'Fecha Recepcion',
    net: 'Monto Neto',
    exempt: 'Monto Exento',
    vat_rec: 'Monto IVA Recuperable',
    vat_no_rec: 'Monto Iva No Recuperable',
    plus_oth_tax: 'Valor Otro Impuesto',
    total: 'Monto Total'
  };

  const DERIVED_FIELDS = ['month_register', 'year_register', 'document_type_name'];

  const DOC_TYPE_NAMES = {
    33: 'Factura Electrónica',
    34: 'Factura Exenta',
    39: 'Boleta Electrónica',
    41: 'Boleta Exenta',
    52: 'Guía de Despacho',
    56: 'Nota de Crédito',
    61: 'Nota de Débito',
    110: 'Factura de Exportación',
    111: 'Nota de Crédito de Exportación'
  };

  const MAX_ROWS = 2000;

  function canonical(header) {
    return String(header === null || header === undefined ? '' : header)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function buildIndex(headers) {
    const result = {};
    headers.forEach(function (header, position) {
      const key = canonical(header);
      if (key && result[key] === undefined) result[key] = position;
    });
    return result;
  }

  function indexFor(payload, header) {
    if (!payload.index) payload.index = buildIndex(payload.headers || PURCHASE_HEADERS);
    const position = payload.index[canonical(header)];
    return typeof position === 'number' ? position : -1;
  }

  function cellKey(payload, header) {
    const position = indexFor(payload, header);
    return position < 0 ? 'general' : 'c' + position;
  }

  function valueAt(payload, row, header) {
    const position = indexFor(payload, header);
    if (position < 0) return '';
    const value = row.cells && row.cells['c' + position];
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function periodFrom(payload) {
    const source = payload && typeof payload === 'object' ? payload : {};
    return {
      month_register: source.month_register !== undefined ? source.month_register : source.month,
      year_register: source.year_register !== undefined ? source.year_register : source.year
    };
  }

  function hasPeriod(period) {
    return period.month_register !== undefined || period.year_register !== undefined;
  }

  function periodValue(period, key, fallback) {
    const value = period[key];
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  function periodMessages(payload) {
    const period = periodFrom(payload);
    if (!hasPeriod(period)) return [];
    const status = reportPeriodStatus(period.year_register, period.month_register);
    if (status.allowed) return [];
    if (status.reason === 'before-start') {
      return ['El periodo del libro de compras (' + String(period.month_register).padStart(2, '0') + '/' +
        period.year_register + ') es anterior al inicio de actividades (' + String(status.startMonth).padStart(2, '0') + '/' +
        status.startYear + ').'];
    }
    return ['Debe indicar un mes (1-12) y un año válidos para el libro de compras.'];
  }

  function parseAmount(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/\s/g, '');
    if (text === '') return 0;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) return Number(text.replace(/\./g, '').replace(',', '.'));
    if (/^-?\d+,\d+$/.test(text)) return Number(text.replace(',', '.'));
    return Number(text);
  }

  function derive(payload, row) {
    const documentDate = parseDate(valueAt(payload, row, 'Fecha Docto'));
    const receptionDate = parseDate(valueAt(payload, row, 'Fecha Recepcion'));
    const registration = receptionDate || documentDate;
    const doctype = valueAt(payload, row, 'Tipo Doc');
    const knownType = documentTypeByDoctype(doctype);
    return {
      month_register: registration ? Number(registration.slice(5, 7)) : null,
      year_register: registration ? Number(registration.slice(0, 4)) : null,
      document_type_name: knownType ? knownType.name : (DOC_TYPE_NAMES[Number(doctype)] || 'Documento de compra')
    };
  }

  function preparePayload(payload) {
    const source = payload && typeof payload === 'object' ? payload : {};
    source.headers = Array.isArray(source.headers) && source.headers.length ? source.headers.slice() : PURCHASE_HEADERS.slice();
    source.rows = Array.isArray(source.rows) ? source.rows : [];
    source.index = buildIndex(source.headers);
    const period = periodFrom(source);
    if (period.month_register !== undefined) source.month_register = period.month_register;
    if (period.year_register !== undefined) source.year_register = period.year_register;
    source.rows.forEach(function (row) {
      row.cells = row.cells && typeof row.cells === 'object' ? row.cells : {};
      if (!row.derived || typeof row.derived !== 'object') row.derived = derive(source, row);
    });
    return source;
  }

  function parsePurchases(text) {
    const rows = parseCsv(text, ',');
    if (rows.length === 0) throw new Error('El archivo CSV está vacío.');
    const headers = rows[0].map(function (header) { return String(header === null || header === undefined ? '' : header).trim(); });
    const index = buildIndex(headers);
    const missing = REQUIRED_HEADERS.filter(function (header) { return index[canonical(header)] === undefined; });
    if (missing.length > 0) {
      throw new Error('Faltan columnas obligatorias en el CSV: ' + missing.join(', ') + '.');
    }
    const dataRows = rows.slice(1).filter(function (row) {
      return row.some(function (value) { return String(value === null || value === undefined ? '' : value).trim() !== ''; });
    });
    if (dataRows.length === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
    if (dataRows.length > MAX_ROWS) throw new Error('El CSV supera el límite de ' + MAX_ROWS + ' filas por importación.');
    const payload = { headers: headers, index: index, rows: [] };
    dataRows.slice(0, MAX_ROWS).forEach(function (cells, position) {
      const cellMap = {};
      headers.forEach(function (header, column) {
        const value = cells[column];
        cellMap['c' + column] = value === null || value === undefined ? '' : String(value).trim();
      });
      const row = { line: position + 2, cells: cellMap, derived: null };
      row.derived = derive(payload, row);
      payload.rows.push(row);
    });
    return payload;
  }

  function mapPurchaseRow(payload, row) {
    const source = preparePayload(payload);
    const centralizeRaw = valueAt(source, row, 'Fecha Recepcion');
    const documentRaw = valueAt(source, row, 'Fecha Docto');
    const derived = row.derived || {};
    const documentDate = parseDate(documentRaw);
    const centralizeDate = parseDate(centralizeRaw);
    const otherTaxCode = valueAt(source, row, 'Codigo Otro Impuesto');
    const otherTaxValue = valueAt(source, row, 'Valor Otro Impuesto');
    const period = periodFrom(source);
    return {
      month_register: periodValue(period, 'month_register',
        derived.month_register === undefined || derived.month_register === null || derived.month_register === ''
          ? (centralizeDate || documentDate ? Number((centralizeDate || documentDate).slice(5, 7)) : null)
          : derived.month_register),
      year_register: periodValue(period, 'year_register',
        derived.year_register === undefined || derived.year_register === null || derived.year_register === ''
          ? (centralizeDate || documentDate ? Number((centralizeDate || documentDate).slice(0, 4)) : null)
          : derived.year_register),
      type_vc: 'C',
      rut: valueAt(source, row, 'RUT Proveedor'),
      entity_name: valueAt(source, row, 'Razon Social'),
      doctype: valueAt(source, row, 'Tipo Doc'),
      document_type_name: derived.document_type_name === undefined || derived.document_type_name === ''
        ? 'Documento de compra'
        : derived.document_type_name,
      folio: valueAt(source, row, 'Folio'),
      date: documentDate || documentRaw,
      date_centralize: centralizeRaw === '' ? null : (centralizeDate || centralizeRaw),
      net: parseAmount(valueAt(source, row, 'Monto Neto')),
      exempt: parseAmount(valueAt(source, row, 'Monto Exento')),
      vat_rec: parseAmount(valueAt(source, row, 'Monto IVA Recuperable')),
      vat_no_rec: parseAmount(valueAt(source, row, 'Monto Iva No Recuperable')),
      plus_oth_tax: otherTaxCode && otherTaxValue ? parseAmount(otherTaxValue) : 0,
      minus_oth_tax: 0,
      total: parseAmount(valueAt(source, row, 'Monto Total'))
    };
  }

  function addIssue(cells, key, message) {
    const target = cells[key || 'general'] || (cells[key || 'general'] = []);
    if (target.indexOf(message) === -1) target.push(message);
  }

  function issueKey(payload, field) {
    if (DERIVED_FIELDS.indexOf(field) !== -1) return field;
    return FIELD_HEADERS[field] ? cellKey(payload, FIELD_HEADERS[field]) : 'general';
  }

  function duplicateInDatabase(data) {
    if (!data.rut || !data.doctype || !data.folio) return false;
    return s.state.documents.some(function (document) {
      return Number(document.folio) === Number(data.folio) &&
        Number(document.document_type_id) === Number(data.doctype) &&
        String(s.entityRut(document)) === String(data.rut);
    });
  }

  function validatePurchases(payload) {
    const source = preparePayload(payload);
    const period = periodFrom(source);
    const explicitPeriod = hasPeriod(period);
    const periodErrors = periodMessages(source);
    const seen = {};
    const rowIssues = [];
    let errorCount = periodErrors.length;
    let validRows = 0;

    source.rows.forEach(function (row, index) {
      const data = mapPurchaseRow(source, row);
      const cells = {};
      const validation = validateDocument(data);
      Object.keys(validation).forEach(function (field) {
        if (explicitPeriod && (field === 'month_register' || field === 'year_register')) return;
        validation[field].forEach(function (message) { addIssue(cells, issueKey(source, field), message); });
      });

      const components = round2(num(data.net) + num(data.exempt) + num(data.vat_rec) +
        num(data.vat_no_rec) + num(data.plus_oth_tax) - num(data.minus_oth_tax));
      const total = round2(data.total);
      if (Number.isFinite(total) && components !== total) {
        addIssue(cells, cellKey(source, 'Monto Total'),
          'El total no cuadra con los componentes (diferencia: ' + round2(total - components) + ').');
      }

      const centralizeIso = parseDate(data.date_centralize);
      if (centralizeIso && Number(centralizeIso.slice(0, 4)) !== workingYear()) {
        addIssue(cells, cellKey(source, 'Fecha Recepcion'),
          'El año de recepción (' + centralizeIso.slice(0, 4) + ') no corresponde al año de trabajo activo (' + workingYear() + ').');
      }

      const key = [String(data.rut).toLowerCase(), String(data.doctype), String(data.folio)].join('|');
      if (seen[key] !== undefined) {
        const message = 'Documento duplicado en el CSV (fila ' + (seen[key] + 1) + ').';
        addIssue(cells, cellKey(source, 'Folio'), message);
        const previous = rowIssues[seen[key]];
        if (previous) {
          addIssue(previous.cells, cellKey(source, 'Folio'), 'Documento duplicado en el CSV (fila ' + (index + 1) + ').');
          previous.messages.push('Documento duplicado en el CSV (fila ' + (index + 1) + ').');
          previous.count += 1;
          errorCount += 1;
        }
      } else {
        seen[key] = index;
      }
      if (duplicateInDatabase(data)) {
        addIssue(cells, cellKey(source, 'Folio'), 'El documento ya se encuentra registrado en la base de datos.');
      }

      const messages = [];
      Object.keys(cells).forEach(function (cell) {
        cells[cell].forEach(function (message) { if (messages.indexOf(message) === -1) messages.push(message); });
      });
      const count = messages.length;
      errorCount += count;
      if (count === 0) validRows += 1;
      rowIssues.push({ row: index, line: row.line, cells: cells, messages: messages, count: count });
    });

    return {
      ok: errorCount === 0,
      errorCount: errorCount,
      validRows: validRows,
      totalRows: source.rows.length,
      rowIssues: rowIssues,
      period: period,
      periodErrors: periodErrors
    };
  }

  function importPurchases(payload) {
    const source = preparePayload(payload);
    const validation = validatePurchases(source);
    if (!validation.ok) {
      const first = validation.rowIssues.filter(function (issue) { return issue.count > 0; })[0];
      const detail = first ? 'fila ' + (first.row + 1) + ': ' + first.messages[0] :
        (validation.periodErrors && validation.periodErrors[0]);
      throw new Error('Corrige los datos marcados antes de importar' + (detail ? ': ' + detail : '') + '.');
    }
    return transaction(function () {
      let processed = 0;
      source.rows.forEach(function (row) {
        createDocument(mapPurchaseRow(source, row));
        processed += 1;
      });
      if (processed === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
      return processed;
    });
  }

  Object.assign(s, {
    PURCHASE_HEADERS,
    REQUIRED_HEADERS,
    DERIVED_FIELDS,
    parsePurchases,
    validatePurchases,
    mapPurchaseRow,
    importPurchases
  });
})();
