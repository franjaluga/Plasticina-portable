(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.ingressImportPurchases = function (ctx) {
    const required = (Store.PURCHASE_HEADERS || []).filter(function (header) {
      return ['Tipo Doc', 'RUT Proveedor', 'Razon Social', 'Folio', 'Fecha Docto', 'Monto Total'].indexOf(header) !== -1;
    });
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6 flex items-center justify-between">
            <a href="${UI.h(UI.route('ingress.import'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver al importador
            </a>
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded">Formato SII compras</span>
        </div>

        <div class="mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Importar compras</h1>
            <p class="text-sm text-slate-500 mt-1">Carga el CSV de compras. Revisarás cada documento en una grilla editable antes de guardarlo.</p>
        </div>

        <form data-action="imports.purchases_upload" enctype="multipart/form-data">
            <label for="purchase_csv" class="block text-xs font-bold uppercase text-slate-600 mb-2">Archivo CSV</label>
            <div class="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 text-center">
                <div class="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <p id="purchase-file-name" class="text-xs font-semibold text-slate-600 mb-4">Ningún archivo seleccionado</p>
                <input type="file" name="csv_file" id="purchase_csv" accept=".csv,.txt" required
                       class="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 cursor-pointer">
            </div>

            <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-xs font-bold text-slate-700 mb-2">Columnas imprescindibles del CSV</p>
                <p class="text-xs text-slate-500 leading-relaxed">${UI.h(required.join(' · '))}</p>
                <p class="text-[11px] text-slate-400 mt-2">Separador: coma · Codificación: UTF-8 · Fechas: DD/MM/AAAA (adicionalmente se acepta hora).</p>
            </div>

            <div class="mt-8 pt-5 border-t border-slate-200 flex justify-between items-center">
                <a href="${UI.h(UI.route('ingress.import'))}" class="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 transition">Cancelar</a>
                <button type="submit" id="purchase-upload-button" class="text-xs font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm">Validar y revisar &rarr;</button>
            </div>
        </form>
    </div>
    <script>
      (function () {
        var input = document.getElementById('purchase_csv');
        var label = document.getElementById('purchase-file-name');
        var button = document.getElementById('purchase-upload-button');
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
