(function () {
  'use strict';

  window.Views = window.Views || {};

  const { capitalize, queryMonth, queryYear, selectField } = window.Plasticina.views.helpers;

  window.Views.accountingAnalytics = function (ctx) {
    const query = ctx.query || {};
    const month = queryMonth(query);
    const year = queryYear(query);
    const typeVc = query.type_vc === 'C' ? 'C' : 'V';
    const start = Store.ownerStartPeriod();
    const monthOptions = [];
    for (let value = 1; value <= 12; value++) {
      monthOptions.push({ value: String(value), label: String(value) + ' - ' + capitalize(UI.monthName(value)) });
    }

    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <div>
                <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">Libro de Compras y Ventas</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Periodo tributario año: <span class="font-bold text-blue-600">${UI.h(Store.workingYear())}</span>
                    <br>Inicio de actividades: <span class="font-bold text-blue-600">${UI.h(String(start.month).padStart(2, '0'))}/${UI.h(start.year)}</span>
                </p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6">

            <div class="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <div class="flex items-center mb-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <div>
                        <h2 class="font-bold text-slate-800 text-base">Consultar libro de compras o ventas</h2>
                        <p class="text-xs text-slate-500">Selecciona el libro, el mes y el año del registro que deseas revisar.</p>
                    </div>
                </div>

                <form data-action="vc_documents.query" class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                        <label for="type_vc" class="block text-xs font-semibold text-slate-600 mb-1">Libro</label>
                        ${selectField('type_vc', [
                          { value: 'V', label: 'Libro de ventas' },
                          { value: 'C', label: 'Libro de compras' }
                        ], {
                          id: 'type_vc',
                          value: typeVc,
                          className: 'w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border'
                        })}
                    </div>
                    <div>
                        <label for="month" class="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                        ${selectField('month', monthOptions, {
                          id: 'month',
                          value: String(month),
                          className: 'w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border'
                        })}
                    </div>
                    <div>
                        <label for="year" class="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                        <input type="number" name="year" id="year" value="${UI.h(year)}" min="${UI.h(start.year)}" class="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white border" required>
                    </div>
                    <div class="flex items-end">
                        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center">
                            Consultar &rarr;
                        </button>
                    </div>
                </form>
            </div>

        </div>

    </div>
    `;
  };
})();
