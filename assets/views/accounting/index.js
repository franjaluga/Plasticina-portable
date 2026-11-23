(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.accountingIndex = function (ctx) {
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <div>
                <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">Reportes Contables</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Periodo tributario año: <span class="font-bold text-indigo-600">${UI.h(Store.workingYear())}</span>
                </p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <a href="${UI.h(UI.route('vc_documents.journal_book'))}" class="group p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base">Libro Diario</h2>
                    <p class="text-xs text-slate-500 mt-1">Registro histórico de asientos contables del periodo.</p>
                </div>
                <span class="text-xs font-semibold text-emerald-600 mt-4 flex items-center">
                    Consultar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('vc_documents.tax_balance'))}" class="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base">Balance 8 Columnas</h2>
                    <p class="text-xs text-slate-500 mt-1">Resumen contable de sumas, saldos, inventario y resultados.</p>
                </div>
                <span class="text-xs font-semibold text-indigo-600 mt-4 flex items-center">
                    Generar &rarr;
                </span>
            </a>

        </div>

    </div>
    `;
  };
})();
