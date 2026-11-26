(function () {
  'use strict';

  const s = window.Plasticina.store.internals;
  const {
    parseCsv, parseDate, num, round2, validateDocument,
    createDocument, transaction, documentTypeByDoctype, entityByRut,
    workingYear, reportPeriodStatus
  } = s;

  const SALES_INVOICE_HEADERS = [
    'Nro', 'Tipo Doc', 'Tipo Venta', 'Rut cliente', 'Razon Social', 'Folio', 'Fecha Docto',
    'Fecha Recepcion', 'Fecha Acuse Recibo', 'Fecha Reclamo', 'Monto Exento', 'Monto Neto',
    'Monto IVA', 'Monto total', 'IVA Retenido Total', 'IVA Retenido Parcial', 'IVA no retenido',
    'IVA propio', 'IVA Terceros', 'RUT Emisor Liquid. Factura', 'Neto Comision Liquid. Factura',
    'Exento Comision Liquid. Factura', 'IVA Comision Liquid. Factura', 'IVA fuera de plazo',
    'Tipo Docto. Referencia', 'Folio Docto. Referencia', 'Num. Ident. Receptor Extranjero',
    'Nacionalidad Receptor Extranjero', 'Credito empresa constructora', 'Impto. Zona Franca (Ley 18211)',
    'Garantia Dep. Envases', 'Indicador Venta sin Costo', 'Indicador Servicio Periodico',
    'Monto No facturable', 'Total Monto Periodo', 'Venta Pasajes Transporte Nacional',
    'Venta Pasajes Transporte Internacional', 'Numero Interno', 'Codigo Sucursal',
    'NCE o NDE sobre Fact. de Compra', 'Codigo Otro Imp.', 'Valor Otro Imp.', 'Tasa Otro Imp.'
  ];

  const SALES_BOLETA_HEADERS = [
    'Tipo Doc', 'RUT Receptor', 'Fecha Docto', 'Fecha Venc.', 'Indicador Servicio', 'Folio',
    'Monto Neto', 'Monto IVA', ' Monto Exento', 'Monto Total'
  ];

  const SALES_FORMATS = {
    factura: {
      key: 'factura',
      label: 'Ventas facturas',
      headers: SALES_INVOICE_HEADERS,
      required: [
        'Tipo Doc', 'Rut cliente', 'Razon Social', 'Folio', 'Fecha Docto',
        'Monto Exento', 'Monto Neto', 'Monto IVA', 'Monto total'
      ]
    },
    boleta: {
      key: 'boleta',
      label: 'Ventas boletas',
      headers: SALES_BOLETA_HEADERS,
      required: [
        'Tipo Doc', 'RUT Receptor', 'Folio', 'Fecha Docto',
        'Monto Exento', 'Monto Neto', 'Monto IVA', 'Monto Total'
      ]
    }
  };

  const SALES_HEADERS = {
    factura: SALES_INVOICE_HEADERS,
    boleta: SALES_BOLETA_HEADERS
  };

  const FIELD_HEADERS = {
    factura: {
      rut: 'Rut cliente',
      entity_name: 'Razon Social',
      doctype: 'Tipo Doc',
      folio: 'Folio',
      date: 'Fecha Docto',
      date_centralize: 'Fecha Recepcion',
      net: 'Monto Neto',
      exempt: 'Monto Exento',
      vat_rec: 'Monto IVA',
      plus_oth_tax: 'Valor Otro Imp.',
      minus_oth_tax: 'IVA Retenido Total',
      folio_ref: 'Folio Docto. Referencia',
      td_ref: 'Tipo Docto. Referencia',
      total: 'Monto total'
    },
    boleta: {
      rut: 'RUT Receptor',
      doctype: 'Tipo Doc',
      folio: 'Folio',
      date: 'Fecha Docto',
      net: 'Monto Neto',
      exempt: 'Monto Exento',
      vat_rec: 'Monto IVA',
      total: 'Monto Total'
    }
  };

  const DERIVED_FIELDS = ['month_register', 'year_register', 'document_type_name', 'entity_name'];
  const GENERIC_CUSTOMER = 'cliente con boletas';
  const GENERIC_RUT = '66666666-6';
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
    return String(header === null || undefined === header ? '' : header)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function formatKey(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().toLowerCase();
    if (text === 'factura' || text === 'facturas' || text === 'invoice') return 'factura';
    if (text === 'boleta' || text === 'boletas') return 'boleta';
    throw new Error('Selecciona un formato de ventas válido: facturas o boletas.');
  }

  function formatConfig(value) {
    return SALES_FORMATS[formatKey(value)];
  }

  function buildIndex(headers) {
    const result = {};
    headers.forEach(function (header, position) {
      const key = canonical(header);
      if (key && result[key] === undefined) result[key] = position;
    });
    return result;
  }

  function detectFormat(headers) {
    const index = buildIndex(headers);
    if (index.rutreceptor !== undefined || index.indicadorservicio !== undefined) return 'boleta';
    if (index.rutcliente !== undefined) return 'factura';
    return 'factura';
  }

  function indexFor(payload, header) {
    if (!payload.index) payload.index = buildIndex(payload.headers || []);
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
      return ['El periodo del libro de ventas (' + String(period.month_register).padStart(2, '0') + '/' +
        period.year_register + ') es anterior al inicio de actividades (' + String(status.startMonth).padStart(2, '0') + '/' +
        status.startYear + ').'];
    }
    return ['Debe indicar un mes (1-12) y un año válidos para el libro de ventas.'];
  }

  function parseAmount(value) {
    const text = String(value === null || undefined === value ? '' : value).trim().replace(/\s/g, '');
    if (text === '') return 0;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) return Number(text.replace(/\./g, '').replace(',', '.'));
    if (/^-?\d+,\d+$/.test(text)) return Number(text.replace(',', '.'));
    return Number(text);
  }

  function documentTypeName(doctype) {
    const knownType = documentTypeByDoctype(doctype);
    return knownType ? knownType.name : (DOC_TYPE_NAMES[Number(doctype)] || 'Documento de venta');
  }

  function customerName(payload, row, key) {
    if (key === 'factura') return valueAt(payload, row, 'Razon Social');
    const rut = valueAt(payload, row, 'RUT Receptor');
    if (canonical(rut) === canonical(GENERIC_RUT)) return GENERIC_CUSTOMER;
    const known = entityByRut(rut);
    return known && known.name ? String(known.name) : GENERIC_CUSTOMER;
  }

  function derive(payload, row, key) {
    const documentDate = parseDate(valueAt(payload, row, 'Fecha Docto'));
    const centralizeDate = key === 'factura' ? parseDate(valueAt(payload, row, 'Fecha Recepcion')) : null;
    const registration = centralizeDate || documentDate;
    return {
      month_register: registration ? Number(registration.slice(5, 7)) : null,
      year_register: registration ? Number(registration.slice(0, 4)) : null,
      document_type_name: documentTypeName(valueAt(payload, row, 'Tipo Doc')),
      entity_name: customerName(payload, row, key)
    };
  }

  function preparePayload(payload) {
    const source = payload && typeof payload === 'object' ? payload : {};
    const key = source.sale_format ? formatKey(source.sale_format) : detectFormat(source.headers || []);
    source.sale_format = key;
    source.headers = Array.isArray(source.headers) && source.headers.length
      ? source.headers.slice()
      : SALES_FORMATS[key].headers.slice();
    source.rows = Array.isArray(source.rows) ? source.rows : [];
    source.index = buildIndex(source.headers);
    const period = periodFrom(source);
    if (period.month_register !== undefined) source.month_register = period.month_register;
    if (period.year_register !== undefined) source.year_register = period.year_register;
    source.type_vc = 'V';
    source.rows.forEach(function (row) {
      row.cells = row.cells && typeof row.cells === 'object' ? row.cells : {};
      if (!row.derived || typeof row.derived !== 'object') row.derived = derive(source, row, key);
    });
    return source;
  }

  function parseSales(text, format) {
    const rows = parseCsv(text);
    if (rows.length === 0) throw new Error('El archivo CSV está vacío.');
    const headers = rows[0].map(function (header) { return String(header === null || undefined === header ? '' : header).trim(); });
    const key = format ? formatKey(format) : detectFormat(headers);
    const config = SALES_FORMATS[key];
    const index = buildIndex(headers);
    const missing = config.required.filter(function (header) { return index[canonical(header)] === undefined; });
    if (missing.length > 0) {
      throw new Error('Faltan columnas obligatorias en el CSV de ventas ' + key + ': ' + missing.join(', ') + '.');
    }
    const dataRows = rows.slice(1).filter(function (row) {
      return row.some(function (value) { return String(value === null || undefined === value ? '' : value).trim() !== ''; });
    });
    if (dataRows.length === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
    if (dataRows.length > MAX_ROWS) throw new Error('El CSV supera el límite de ' + MAX_ROWS + ' filas por importación.');
    const payload = { sale_format: key, headers: headers, index: index, rows: [] };
    dataRows.slice(0, MAX_ROWS).forEach(function (cells, position) {
      const cellMap = {};
      headers.forEach(function (header, column) {
        const value = cells[column];
        cellMap['c' + column] = value === null || undefined === value ? '' : String(value).trim();
      });
      const row = { line: position + 2, cells: cellMap, derived: null };
      row.derived = derive(payload, row, key);
      payload.rows.push(row);
    });
    return payload;
  }

  function mapSaleRow(payload, row) {
    const source = preparePayload(payload);
    const key = source.sale_format;
    const isInvoice = key === 'factura';
    const documentRaw = valueAt(source, row, 'Fecha Docto');
    const centralizeRaw = isInvoice ? valueAt(source, row, 'Fecha Recepcion') : '';
    const documentDate = parseDate(documentRaw);
    const centralizeDate = parseDate(centralizeRaw);
    const derived = row.derived || {};
    const period = periodFrom(source);
    const otherTaxCode = isInvoice ? valueAt(source, row, 'Codigo Otro Imp.') : '';
    const otherTaxValue = isInvoice ? valueAt(source, row, 'Valor Otro Imp.') : '';
    const folioRef = isInvoice ? valueAt(source, row, 'Folio Docto. Referencia') : '';
    const tdRef = isInvoice ? valueAt(source, row, 'Tipo Docto. Referencia') : '';
    return {
      month_register: periodValue(period, 'month_register',
        derived.month_register === undefined || derived.month_register === null || derived.month_register === ''
          ? (documentDate ? Number(documentDate.slice(5, 7)) : null)
          : derived.month_register),
      year_register: periodValue(period, 'year_register',
        derived.year_register === undefined || derived.year_register === null || derived.year_register === ''
          ? (documentDate ? Number(documentDate.slice(0, 4)) : null)
          : derived.year_register),
      type_vc: 'V',
      sale_format: key,
      rut: valueAt(source, row, isInvoice ? 'Rut cliente' : 'RUT Receptor'),
      entity_name: isInvoice
        ? valueAt(source, row, 'Razon Social')
        : (derived.entity_name || GENERIC_CUSTOMER),
      doctype: valueAt(source, row, 'Tipo Doc'),
      document_type_name: derived.document_type_name === undefined || derived.document_type_name === ''
        ? 'Documento de venta'
        : derived.document_type_name,
      folio: valueAt(source, row, 'Folio'),
      date: documentDate || documentRaw,
      date_centralize: isInvoice ? (centralizeRaw === '' ? null : (centralizeDate || centralizeRaw)) : null,
      net: parseAmount(valueAt(source, row, 'Monto Neto')),
      exempt: parseAmount(valueAt(source, row, 'Monto Exento')),
      vat_rec: parseAmount(valueAt(source, row, 'Monto IVA')),
      vat_no_rec: 0,
      plus_oth_tax: otherTaxCode && otherTaxValue ? parseAmount(otherTaxValue) : 0,
      minus_oth_tax: isInvoice ? parseAmount(valueAt(source, row, 'IVA Retenido Total')) : 0,
      folio_ref: folioRef === '' ? null : folioRef,
      td_ref: tdRef === '' ? null : tdRef,
      total: parseAmount(valueAt(source, row, isInvoice ? 'Monto total' : 'Monto Total'))
    };
  }

  function addIssue(cells, key, message) {
    const target = cells[key || 'general'] || (cells[key || 'general'] = []);
    if (target.indexOf(message) === -1) target.push(message);
  }

  function issueKey(payload, field) {
    const key = payload.sale_format || detectFormat(payload.headers || []);
    if (DERIVED_FIELDS.indexOf(field) !== -1) {
      if (field === 'entity_name' && key === 'factura') return cellKey(payload, FIELD_HEADERS.factura.entity_name);
      return field;
    }
    const header = FIELD_HEADERS[key] && FIELD_HEADERS[key][field];
    return header ? cellKey(payload, header) : 'general';
  }

  function duplicateInDatabase(data) {
    if (!data.rut || !data.doctype || !data.folio) return false;
    return s.state.documents.some(function (document) {
      return Number(document.folio) === Number(data.folio) &&
        Number(document.document_type_id) === Number(data.doctype) &&
        String(s.entityRut(document)) === String(data.rut);
    });
  }

  function validateSales(payload) {
    const source = preparePayload(payload);
    const period = periodFrom(source);
    const explicitPeriod = hasPeriod(period);
    const periodErrors = periodMessages(source);
    const seen = {};
    const rowIssues = [];
    let errorCount = periodErrors.length;
    let validRows = 0;

    source.rows.forEach(function (row, index) {
      const data = mapSaleRow(source, row);
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
        addIssue(cells, cellKey(source, source.sale_format === 'factura' ? 'Monto total' : 'Monto Total'),
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

  function importSales(payload) {
    const source = preparePayload(payload);
    const validation = validateSales(source);
    if (!validation.ok) {
      const first = validation.rowIssues.filter(function (issue) { return issue.count > 0; })[0];
      const detail = first ? 'fila ' + (first.row + 1) + ': ' + first.messages[0] :
        (validation.periodErrors && validation.periodErrors[0]);
      throw new Error('Corrige los datos marcados antes de importar' + (detail ? ': ' + detail : '') + '.');
    }
    return transaction(function () {
      let processed = 0;
      source.rows.forEach(function (row) {
        createDocument(mapSaleRow(source, row));
        processed += 1;
      });
      if (processed === 0) throw new Error('El archivo CSV no contiene filas de datos para procesar.');
      return processed;
    });
  }

  Object.assign(s, {
    SALES_INVOICE_HEADERS,
    SALES_BOLETA_HEADERS,
    SALES_FORMATS,
    SALES_HEADERS,
    DERIVED_FIELDS,
    parseSales,
    validateSales,
    mapSaleRow,
    importSales
  });
})();
