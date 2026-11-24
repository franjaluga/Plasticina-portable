(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.dateRangeForm = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const isoDate = UI.today();
    const monthPrefix = isoDate.slice(0, 7);
    const lastDay = new Date(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)), 0).getDate();
    const dateFrom = query.date_from === undefined || query.date_from === '' ? monthPrefix + '-01' : query.date_from;
    const dateTo = query.date_to === undefined || query.date_to === '' ? monthPrefix + '-' + String(lastDay).padStart(2, '0') : query.date_to;
    const start = Store.ownerStartPeriod();
    const startIso = start.year + '-' + String(start.month).padStart(2, '0') + '-01';

    return `
    <div class="max-w-md w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.journal_context'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver
            </a>
        </div>

        <div class="text-center mb-6">
            <h1 class="text-xl font-extrabold text-slate-800">Libro Diario</h1>
            <p class="text-xs text-slate-500 mt-1">Selecciona el rango de fechas para generar el registro</p>
            <p class="text-[11px] text-slate-400 mt-1">Inicio de actividades: ${UI.h(String(start.month).padStart(2, '0'))}/${UI.h(start.year)}</p>
        </div>

        <form data-action="vc_documents.journal_book.generate" class="space-y-4">
            <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">
            <div>
                <label for="date_from" class="block text-xs font-semibold text-slate-600 mb-1">Fecha de Inicio</label>
                <input type="date" name="date_from" id="date_from" value="${UI.h(dateFrom)}" min="${UI.h(startIso)}" required class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2.5 bg-white border focus:border-emerald-500 focus:ring-emerald-500">
            </div>

            <div>
                <label for="date_to" class="block text-xs font-semibold text-slate-600 mb-1">Fecha de Término</label>
                <input type="date" name="date_to" id="date_to" value="${UI.h(dateTo)}" required class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2.5 bg-white border focus:border-emerald-500 focus:ring-emerald-500">
            </div>

            <div class="pt-4">
                <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center">
                    Generar Libro Diario &rarr;
                </button>
            </div>
        </form>
    </div>
    `;
  };
})();
