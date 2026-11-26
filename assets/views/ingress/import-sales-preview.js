(function () {
  'use strict';

  window.Views = window.Views || {};

  function emptyState() {
    const target = UI.h(UI.route('ingress.import.sales'));
    return `
    <div class="max-w-2xl mx-auto mt-16 p-8 bg-white shadow-xl rounded-2xl border border-slate-100 text-center">
        <h1 class="text-lg font-bold text-slate-800 mb-2">No hay una revisión pendiente</h1>
        <p class="text-xs text-slate-500 mb-6">Carga un CSV de ventas para verlo en la grilla editable.</p>
        <a href="${target}" class="inline-block text-xs font-semibold bg-emerald-600 text-white px-5 py-2.5 rounded-lg">Ir a importar ventas</a>
    </div>`;
  }

  window.Views.ingressImportSalesPreview = function (ctx) {
    const state = UI.old();
    if (!state || state.kind !== 'sales' || !Array.isArray(state.headers) || !Array.isArray(state.rows) || state.rows.length === 0) {
      return emptyState();
    }
    const format = Store.SALES_FORMATS[state.sale_format] ? state.sale_format : 'factura';
    const config = Store.SALES_FORMATS[format];
    const required = config.required;
    const requiredKeys = required.map(function (header) { return String(header).trim().toLowerCase(); });
    const derivedFields = [{ key: 'document_type_name', label: 'Nombre documento' }];
    if (format === 'boleta') derivedFields.push({ key: 'entity_name', label: 'Razón social' });
    const headers = state.headers;
    const rows = state.rows;
    const month = state.month_register === undefined || state.month_register === '' ? new Date().getMonth() + 1 : state.month_register;
    const year = state.year_register === undefined || state.year_register === '' ? Store.workingYear() : state.year_register;
    const period = { month_register: month, year_register: year, sale_format: format, type_vc: 'V' };
    const validation = Store.validateSales(Object.assign({ headers: headers, rows: rows }, period));
    const fileName = state.fileName || 'documentos.csv';
    const invalidRows = validation.rowIssues.filter(function (issue) { return issue.count > 0; }).length;
    const periodLabel = String(month).padStart(2, '0') + '/' + year;
    const backHref = UI.h(UI.route('ingress.import.sales', period));
    const periodErrors = validation.periodErrors || [];
    const rowErrorCount = validation.errorCount - periodErrors.length;
    const initialStatus = validation.ok
      ? 'Sin errores: puedes procesar el archivo.'
      : (periodErrors.length ? periodErrors.join(' ') + (rowErrorCount ? ' ' : '') : '') +
        (rowErrorCount ? rowErrorCount + ' dato(s) requieren corrección. Las celdas marcadas en rojo contienen el detalle.' : '');

    const headerCells = headers.map(function (header, column) {
      const isRequired = requiredKeys.indexOf(String(header).trim().toLowerCase()) !== -1;
      return '<th class="sheet-th"><span class="font-semibold">' + UI.h(header) + '</span>' +
        (isRequired ? '<span class="text-rose-600 ml-0.5" title="Columna obligatoria">*</span>' : '') +
        '<span class="sheet-th-index">' + column + '</span></th>';
    }).join('');
    const derivedHeaders = derivedFields.map(function (field) {
      return '<th class="sheet-th sheet-derived"><span class="font-semibold">' + UI.h(field.label) + '</span>' +
        '<span class="sheet-th-index">auto</span></th>';
    }).join('');

    const bodyRows = rows.map(function (row, index) {
      const issue = validation.rowIssues[index] || { cells: {}, count: 0, messages: [] };
      const cells = headers.map(function (header, column) {
        const key = 'c' + column;
        const messages = issue.cells[key] || [];
        const value = row.cells && row.cells[key] !== undefined ? row.cells[key] : '';
        return '<td><input type="text" class="sheet-input' + (messages.length ? ' is-invalid' : '') + '"' +
          ' data-cell="' + key + '" data-row="' + index + '"' +
          ' name="rows[' + index + '][' + key + ']" value="' + UI.h(value) + '"' +
          (messages.length ? ' aria-invalid="true" title="' + UI.h(messages.join('\n')) + '"' : '') + '></td>';
      }).join('');
      const derived = row.derived || {};
      const derivedCells = derivedFields.map(function (field) {
        const messages = issue.cells[field.key] || [];
        const value = derived[field.key] === null || derived[field.key] === undefined ? '' : derived[field.key];
        return '<td><input type="text" class="sheet-input sheet-derived-input' + (messages.length ? ' is-invalid' : '') + '"' +
          ' data-cell="' + field.key + '" data-row="' + index + '"' +
          ' name="rows[' + index + '][' + field.key + ']" value="' + UI.h(value) + '"' +
          (messages.length ? ' aria-invalid="true" title="' + UI.h(messages.join('\n')) + '"' : '') + '></td>';
      }).join('');
      const badge = issue.count > 0
        ? '<span class="sheet-badge invalid" title="' + UI.h(issue.messages.join('\n')) + '">' + issue.count + ' error' + (issue.count === 1 ? '' : 'es') + '</span>'
        : '<span class="sheet-badge valid" title="Fila lista para importar">Lista</span>';
      return '<tr class="sheet-row' + (issue.count > 0 ? ' row-invalid' : '') + '" data-row="' + index + '">' +
        '<td class="sheet-row-head"><div class="flex items-center justify-between gap-1">' +
        '<span class="sheet-row-number font-mono text-[11px] font-bold text-slate-500">' + (index + 1) + '</span>' +
        '<button type="button" class="sheet-remove" data-remove-row="' + index + '" title="Eliminar fila" aria-label="Eliminar fila ' + (index + 1) + '">&times;</button>' +
        '</div>' + badge + '</td>' + cells + derivedCells + '</tr>';
    }).join('');

    return `
    <div class="max-w-[95%] mx-auto">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
                <a href="${backHref}" class="text-xs font-semibold text-emerald-600 transition">&larr; Cargar otro CSV</a>
                <h1 class="text-xl font-extrabold text-slate-800 tracking-tight mt-2">Revisar ventas importadas</h1>
                <p class="text-xs text-slate-500 mt-1"><span class="font-semibold text-slate-700">${UI.h(fileName)}</span> · ${UI.h(config.label)} · ${rows.length} fila${rows.length === 1 ? '' : 's'} · edita cualquier celda antes de procesar.</p>
            </div>
            <div class="flex items-center gap-2">
                <a href="${backHref}" class="text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition">Descartar</a>
                <button type="button" data-link-action="imports.sales_cancel" data-sale-format="${UI.h(format)}" data-month-register="${UI.h(month)}" data-year-register="${UI.h(year)}" class="text-xs font-semibold bg-white text-rose-600 border border-rose-200 px-4 py-2 rounded-lg hover:bg-rose-50 transition">Cancelar revisión</button>
            </div>
        </div>

        <div class="mb-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Libro de ventas seleccionado</span>
            <span class="font-mono text-xs font-bold text-emerald-800">${UI.h(periodLabel)}</span>
            <span class="text-[10px] font-semibold text-emerald-700">${UI.h(config.label)}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div class="sheet-total-card"><span>Filas válidas</span><strong id="sheet-valid-rows">${validation.validRows}</strong></div>
            <div class="sheet-total-card"><span>Filas con errores</span><strong id="sheet-invalid-rows" class="text-rose-600">${invalidRows}</strong></div>
            <div class="sheet-total-card"><span>Total documentos</span><strong id="sheet-total-amount">0</strong></div>
            <div class="sheet-total-card"><span>IVA venta</span><strong id="sheet-vat-amount">0</strong></div>
        </div>

        <form data-action="imports.sales_confirm" data-confirm="¿Procesar los documentos de venta revisados? Se guardarán en la base de datos." id="sales-preview-form">
            <input type="hidden" name="file_name" value="${UI.h(fileName)}">
            <input type="hidden" name="sale_format" value="${UI.h(format)}">
            <input type="hidden" name="month_register" value="${UI.h(month)}">
            <input type="hidden" name="year_register" value="${UI.h(year)}">
            <input type="hidden" name="type_vc" value="V">
            ${headers.map(function (header) { return '<input type="hidden" name="headers[]" value="' + UI.h(header) + '">'; }).join('')}

            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div id="sheet-status" class="text-xs font-semibold ${validation.ok ? 'text-emerald-700' : 'text-rose-600'}">
                    ${UI.h(initialStatus)}
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" id="sheet-add-row" class="text-xs font-semibold bg-white text-emerald-700 border border-emerald-300 px-3 py-2 rounded-lg hover:bg-emerald-50 transition">+ Agregar fila</button>
                    <button type="submit" id="sheet-process" class="text-xs font-semibold bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"${validation.ok ? '' : ' disabled'}>Procesar ${rows.length} documento${rows.length === 1 ? '' : 's'}</button>
                </div>
            </div>

            <div class="sheet-wrap">
                <table class="sheet-table">
                    <thead><tr><th class="sheet-th sheet-corner">N°</th>${headerCells}${derivedHeaders}</tr></thead>
                    <tbody id="sheet-body">${bodyRows}</tbody>
                </table>
            </div>
            <p class="text-[11px] text-slate-400 mt-3">Usa Tab para avanzar y las flechas arriba/abajo para moverte en la misma columna. El nombre del documento se deriva del tipo y el libro de ventas se mantiene fijo.</p>
        </form>
    </div>
    <script>
      (function () {
        var form = document.getElementById('sales-preview-form');
        var body = document.getElementById('sheet-body');
        var button = document.getElementById('sheet-process');
        var status = document.getElementById('sheet-status');
        var validRows = document.getElementById('sheet-valid-rows');
        var invalidRows = document.getElementById('sheet-invalid-rows');
        var totalAmount = document.getElementById('sheet-total-amount');
        var vatAmount = document.getElementById('sheet-vat-amount');
        var headers = ${UI.json(headers || [])};
        var derived = ${UI.json(derivedFields.map(function (field) { return field.key; }))};
        var formatInput = form ? form.querySelector('input[name="sale_format"]') : null;
        var monthInput = form ? form.querySelector('input[name="month_register"]') : null;
        var yearInput = form ? form.querySelector('input[name="year_register"]') : null;
        if (!form || !body || !button) return;

        function collect() {
          var grouped = {};
          var inputs = body.querySelectorAll('input[data-cell]');
          Array.prototype.forEach.call(inputs, function (input) {
            var index = input.getAttribute('data-row');
            var key = input.getAttribute('data-cell');
            if (!grouped[index]) grouped[index] = { line: Number(index) + 2, cells: {}, derived: {} };
            if (key.charAt(0) === 'c' && /^\\d+$/.test(key.substring(1))) grouped[index].cells[key] = input.value;
            else grouped[index].derived[key] = input.value;
          });
          return {
            sale_format: formatInput ? formatInput.value : 'factura',
            month_register: monthInput ? monthInput.value : '',
            year_register: yearInput ? yearInput.value : '',
            type_vc: 'V',
            headers: headers,
            rows: Object.keys(grouped).sort(function (a, b) { return Number(a) - Number(b); })
              .map(function (index) { return grouped[index]; })
          };
        }

        function refresh() {
          var payload = collect();
          var result = Store.validateSales(payload);
          var inputs = body.querySelectorAll('input[data-cell]');
          Array.prototype.forEach.call(inputs, function (input) {
            input.classList.remove('is-invalid');
            input.removeAttribute('aria-invalid');
            input.removeAttribute('title');
          });
          var tableRows = body.querySelectorAll('tr.sheet-row');
          Array.prototype.forEach.call(tableRows, function (row) { row.classList.remove('row-invalid'); });

          result.rowIssues.forEach(function (issue) {
            Object.keys(issue.cells).forEach(function (key) {
              var cell = body.querySelector('tr[data-row="' + issue.row + '"] input[data-cell="' + key + '"]');
              if (cell) {
                cell.classList.add('is-invalid');
                cell.setAttribute('aria-invalid', 'true');
                cell.setAttribute('title', issue.cells[key].join('\\n'));
              }
            });
            var row = body.querySelector('tr.sheet-row[data-row="' + issue.row + '"]');
            var badge = row ? row.querySelector('.sheet-badge') : null;
            if (row && issue.count > 0) row.classList.add('row-invalid');
            if (badge) {
              badge.className = 'sheet-badge ' + (issue.count > 0 ? 'invalid' : 'valid');
              badge.textContent = issue.count > 0 ? issue.count + ' error' + (issue.count === 1 ? '' : 'es') : 'Lista';
              badge.setAttribute('title', issue.messages.length ? issue.messages.join('\\n') : 'Fila lista para importar');
            }
          });

          var totals = { total: 0, vat: 0 };
          payload.rows.forEach(function (row) {
            var data = Store.mapSaleRow(payload, row);
            totals.total += Number(data.total) || 0;
            totals.vat += Number(data.vat_rec) || 0;
          });
          var format = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
          if (validRows) validRows.textContent = result.validRows;
          if (invalidRows) invalidRows.textContent = result.totalRows - result.validRows;
          if (totalAmount) totalAmount.textContent = format.format(totals.total);
          if (vatAmount) vatAmount.textContent = format.format(totals.vat);
          if (status) {
            var periodErrors = result.periodErrors || [];
            var rowErrors = result.errorCount - periodErrors.length;
            status.textContent = result.ok
              ? 'Sin errores: puedes procesar el archivo.'
              : (periodErrors.length ? periodErrors.join(' ') + (rowErrors ? ' ' : '') : '') +
                (rowErrors ? rowErrors + ' dato(s) requieren corrección. Las celdas marcadas en rojo contienen el detalle.' : '');
            status.className = 'text-xs font-semibold ' + (result.ok ? 'text-emerald-700' : 'text-rose-600');
          }
          if (button) {
            button.disabled = !result.ok || payload.rows.length === 0;
            button.textContent = 'Procesar ' + payload.rows.length + ' documento' + (payload.rows.length === 1 ? '' : 's');
          }
        }

        function renumber() {
          var index = 0;
          Array.prototype.forEach.call(body.querySelectorAll('tr.sheet-row'), function (row) {
            row.setAttribute('data-row', index);
            var remove = row.querySelector('[data-remove-row]');
            if (remove) remove.setAttribute('data-remove-row', index);
            var number = row.querySelector('.sheet-row-number');
            if (number) number.textContent = index + 1;
            Array.prototype.forEach.call(row.querySelectorAll('input[data-cell]'), function (input) {
              var key = input.getAttribute('data-cell');
              input.setAttribute('data-row', index);
              input.setAttribute('name', 'rows[' + index + '][' + key + ']');
            });
            index += 1;
          });
        }

        body.addEventListener('click', function (event) {
          var remove = event.target.closest ? event.target.closest('[data-remove-row]') : null;
          if (!remove) return;
          var row = remove.closest('tr.sheet-row');
          if (row && body.querySelectorAll('tr.sheet-row').length > 1) {
            row.parentNode.removeChild(row);
            renumber();
            refresh();
          }
        });

        document.getElementById('sheet-add-row').addEventListener('click', function () {
          var index = body.querySelectorAll('tr.sheet-row').length;
          var cells = headers.map(function (header, column) {
            return '<td><input type="text" class="sheet-input" data-cell="c' + column + '" data-row="' + index + '" name="rows[' + index + '][c' + column + ']" value=""></td>';
          }).join('');
          var extra = derived.map(function (key) {
            return '<td><input type="text" class="sheet-input sheet-derived-input" data-cell="' + key + '" data-row="' + index + '" name="rows[' + index + '][' + key + ']" value=""></td>';
          }).join('');
          body.insertAdjacentHTML('beforeend', '<tr class="sheet-row" data-row="' + index + '">' +
            '<td class="sheet-row-head"><div class="flex items-center justify-between gap-1">' +
            '<span class="sheet-row-number font-mono text-[11px] font-bold text-slate-500">' + (index + 1) + '</span>' +
            '<button type="button" class="sheet-remove" data-remove-row="' + index + '" title="Eliminar fila" aria-label="Eliminar fila ' + (index + 1) + '">&times;</button>' +
            '</div><span class="sheet-badge valid">Lista</span></td>' + cells + extra + '</tr>');
          refresh();
          var first = body.querySelector('tr[data-row="' + index + '"] input[data-cell]');
          if (first) first.focus();
        });

        body.addEventListener('keydown', function (event) {
          var input = event.target;
          if (!input || input.tagName !== 'INPUT' || !input.getAttribute('data-cell')) return;
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Enter') return;
          var step = event.key === 'ArrowUp' ? -1 : 1;
          var targetRow = Number(input.getAttribute('data-row')) + step;
          var next = body.querySelector('tr[data-row="' + targetRow + '"] input[data-cell="' + input.getAttribute('data-cell') + '"]');
          if (next) {
            event.preventDefault();
            next.focus();
            next.select();
          }
        });

        form.addEventListener('input', refresh);
        refresh();
      })();
    </script>
    `;
  };
})();
