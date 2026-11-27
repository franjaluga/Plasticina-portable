(function () {
  'use strict';

  window.Views = window.Views || {};

  const { pad, queryMonth, queryYear, balancePeriodHelp, selectField } = window.Plasticina.views.helpers;
  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  window.Views.balanceContext = function (ctx) {
    const query = ctx.query || {};
    const rawMonth = Number(queryMonth(query));
    const month = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
      ? rawMonth : Number(UI.today().slice(5, 7));
    const rawYear = Number(queryYear(query));
    const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : Store.workingYear();
    const status = Store.balancePeriodStatus(year, month);
    const help = balancePeriodHelp(status);
    const monthOptions = MONTH_NAMES.map(function (name, index) {
      const value = index + 1;
      return { value: pad(value), label: pad(value) + ' - ' + name };
    });
    const buttonClass = help.valid
      ? 'text-xs font-semibold text-indigo-600 mt-6 flex items-center group-hover:text-indigo-800'
      : 'text-xs font-semibold text-slate-400 mt-6 flex items-center cursor-not-allowed opacity-60';

    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
                &larr; Volver
            </a>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Contexto: Balance</h1>
            <p class="text-sm text-slate-500 mt-1">Estados financieros y balance tributario</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-xl mx-auto">
            <form id="balanceContextForm" data-action="vc_documents.tax_balance" class="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base mb-1">Balance Tributario (8 Columnas)</h2>
                    <p class="text-xs text-slate-500 leading-relaxed">Genera el resumen de sumas, saldos, inventario y resultados a una fecha determinada.</p>
                    <div class="mt-5 grid grid-cols-2 gap-3">
                        <div>
                            <label for="balanceMonth" class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mes</label>
                            ${selectField('month', monthOptions, {
                              id: 'balanceMonth',
                              value: pad(month),
                              className: 'w-full text-xs border-slate-300 rounded-lg shadow-sm p-2 bg-white border'
                            })}
                        </div>
                        <div>
                            <label for="balanceYear" class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Año</label>
                            <input type="number" name="year" id="balanceYear" min="2000" step="1" value="${UI.h(year)}" class="w-full text-xs border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                    </div>
                    <p id="balancePeriodHelp" class="${help.className}">${UI.h(help.text)}</p>
                </div>
                <button id="balanceGenerateBtn" type="submit" class="${buttonClass}"${help.valid ? '' : ' disabled aria-disabled="true"'}>
                    Generar &rarr;
                </button>
            </form>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
            <p>Sistema Contable v1.0</p>
        </div>
    </div>

    <script>
    (function () {
      var form = document.getElementById('balanceContextForm');
      var monthInput = document.getElementById('balanceMonth');
      var yearInput = document.getElementById('balanceYear');
      var help = document.getElementById('balancePeriodHelp');
      var button = document.getElementById('balanceGenerateBtn');
      if (!form || !monthInput || !yearInput || !help || !button) return;

      function evaluate() {
        var status = Store.balancePeriodStatus(Number(yearInput.value), Number(monthInput.value));
        return window.Plasticina.views.helpers.balancePeriodHelp(status);
      }

      function apply() {
        var state = evaluate();
        help.textContent = state.text;
        help.className = state.className;
        button.disabled = !state.valid;
        button.setAttribute('aria-disabled', state.valid ? 'false' : 'true');
        button.className = state.valid
          ? 'text-xs font-semibold text-indigo-600 mt-6 flex items-center group-hover:text-indigo-800'
          : 'text-xs font-semibold text-slate-400 mt-6 flex items-center cursor-not-allowed opacity-60';
        return state.valid;
      }

      monthInput.addEventListener('change', apply);
      yearInput.addEventListener('input', apply);
      yearInput.addEventListener('change', apply);
      form.addEventListener('submit', function (event) {
        if (!apply()) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      apply();
    })();
    </script>
    `;
  };
})();
