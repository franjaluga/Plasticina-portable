(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.ingressImportSales = function (ctx) {
    const query = ctx.query || {};
    const format = Store.SALES_FORMATS[query.sale_format] ? query.sale_format : 'factura';
    const config = Store.SALES_FORMATS[format];
    const required = config.required;
    const month = query.month_register === undefined || query.month_register === '' ? new Date().getMonth() + 1 : query.month_register;
    const year = query.year_register === undefined || query.year_register === '' ? Store.workingYear() : query.year_register;
    const periodLabel = String(month).padStart(2, '0') + '/' + year;
    const formatLabel = config.label;
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6 flex items-center justify-between">
            <a href="${UI.h(UI.route('ingress.import'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver al importador
            </a>
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Formato SII ventas · ${UI.h(formatLabel)}</span>
        </div>

        <div class="mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Importar ventas</h1>
            <p class="text-sm text-slate-500 mt-1">Carga el CSV de ${UI.h(formatLabel.toLowerCase())}. Revisarás cada documento en una grilla editable antes de guardarlo.</p>
        </div>

        <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Libro de ventas seleccionado</p>
                <p class="font-mono text-base font-bold text-emerald-800 mt-1">${UI.h(periodLabel)}</p>
                <p class="text-[11px] text-emerald-700 mt-1">Tipo de documento: Venta (V) · ${UI.h(formatLabel)}. El periodo se definió al ingresar y no se modifica con las fechas del CSV.</p>
            </div>
            <a href="${UI.h(UI.route('ingress.import'))}" class="text-xs font-semibold bg-white text-emerald-700 border border-emerald-300 px-3 py-2 rounded-lg hover:bg-emerald-50 transition">Cambiar periodo</a>
        </div>

        <form data-action="imports.sales_upload" enctype="multipart/form-data">
            <input type="hidden" name="sale_format" value="${UI.h(format)}">
            <input type="hidden" name="month_register" value="${UI.h(month)}">
            <input type="hidden" name="year_register" value="${UI.h(year)}">
            <input type="hidden" name="type_vc" value="V">
            <label for="sales_csv" class="block text-xs font-bold uppercase text-slate-600 mb-2">Archivo CSV</label>
            <div class="border border-emerald-200 bg-emerald-50 rounded-2xl p-6 text-center">
                <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <p id="sales-file-name" class="text-xs font-semibold text-slate-600 mb-4">Ningún archivo seleccionado</p>
                <input type="file" name="csv_file" id="sales_csv" accept=".csv,.txt" required
                       class="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 cursor-pointer">
            </div>

            <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-xs font-bold text-slate-700 mb-2">Columnas imprescindibles del CSV</p>
                <p class="text-xs text-slate-500 leading-relaxed">${UI.h(required.join(' · '))}</p>
                <p class="text-[11px] text-slate-400 mt-2">Separador: se detecta automáticamente (coma, punto y coma o tabulador) · Codificación: UTF-8 o Windows-1252 · Fechas: DD/MM/AAAA (adicionalmente se acepta hora).</p>
            </div>

            <div class="mt-8 pt-5 border-t border-slate-200 flex justify-between items-center">
                <a href="${UI.h(UI.route('ingress.import'))}" class="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 transition">Cancelar</a>
                <button type="submit" id="sales-upload-button" class="text-xs font-semibold bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-sm">Validar y revisar &rarr;</button>
            </div>
        </form>
    </div>
    <script>
      (function () {
        var input = document.getElementById('sales_csv');
        var label = document.getElementById('sales-file-name');
        var button = document.getElementById('sales-upload-button');
        if (!input || !label || !button) return;
        input.addEventListener('change', function () {
          var file = input.files && input.files[0];
          label.textContent = file ? file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)' : 'Ningún archivo seleccionado';
          button.textContent = file ? 'Validar ' + file.name + ' y revisar →' : 'Validar y revisar →';
        });
      })();
    </script>
    `;
  };
})();
