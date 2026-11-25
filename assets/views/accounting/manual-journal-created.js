(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.manualJournalCreated = function (ctx) {
    const query = ctx && ctx.query ? ctx.query : {};
    const journalId = Number(query.journal_id);
    const journal = Number.isInteger(journalId) && journalId > 0 ? Store.journal(journalId) : null;
    const journalBlock = journal
      ? `
        <div class="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
            <div>
                <span class="block text-xs font-semibold uppercase tracking-wider text-emerald-700">Asiento contable manual creado exitosamente.</span>
                <span class="block text-xl font-extrabold text-slate-800 mt-1">Asiento N° <span class="font-mono">${UI.h(journal.entry_number)}</span></span>
            </div>
            <a href="${UI.h(UI.route('accounting.journals.detail', journal.id))}" class="inline-block text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-center">Ver asiento &rarr;</a>
        </div>`
      : '';

    return `
    <div class="max-w-3xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Asiento contable creado</h1>
            <p class="text-sm text-slate-500 mt-1">Selecciona una opción para continuar</p>
        </div>
        ${journalBlock}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="${UI.h(UI.route('accounting.manual_journals.create'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">Crear otro asiento</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Registra un nuevo comprobante directo para el periodo actual.</p>
                </div>
                <span class="text-xs font-semibold text-indigo-600 mt-6 flex items-center">
                    Continuar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('welcome'))}" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base mb-1">Volver al inicio</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Retorna al menú principal del sistema contable.</p>
                </div>
                <span class="text-xs font-semibold text-emerald-600 mt-6 flex items-center">
                    Continuar &rarr;
                </span>
            </a>
        </div>
    </div>
    `;
  };
})();
