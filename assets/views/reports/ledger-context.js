(function () {
  'use strict';

  window.Views = window.Views || {};

  const { accountSearchField } = window.Plasticina.views.helpers;

  window.Views.ledgerContext = function (ctx) {
    const owner = Store.activeOwner();
    const accounts = owner ? Store.accounts(owner.id) : Store.activeOwnerAccounts();
    const query = ctx.query || {};
    const accountCode = query.account_code === undefined ? '' : query.account_code;
    const month = query.month === undefined || query.month === '' ? Number(UI.today().slice(5, 7)) : Number(query.month);
    const year = query.year === undefined || query.year === '' ? Store.workingYear() : query.year;
    const start = Store.ownerStartPeriod();
    const monthOptions = [];
    for (let value = 1; value <= 12; value++) {
      monthOptions.push(`<option value="${UI.h(value)}"${value === month ? ' selected' : ''}>${UI.h(value)}</option>`);
    }

    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">
        <div class="mb-6">
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">&larr; Volver</a>
        </div>
        <div class="text-center mb-8">
            <h1 class="text-2xl font-extrabold text-slate-800">Contexto: Libro Mayor</h1>
            <p class="text-sm text-slate-500 mt-1">Consulta de movimientos por cuenta contable</p>
            <p class="text-xs text-slate-400 mt-1">Inicio de actividades: ${UI.h(String(start.month).padStart(2, '0'))}/${UI.h(start.year)}</p>
        </div>

        <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <form data-action="accounting.ledger" class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">
                <div class="sm:col-span-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <label for="account_code" class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Cuenta Contable</label>
                    ${accountSearchField('account_code', accountCode, {
                      id: 'account_code',
                      accounts: accounts,
                      wrapperClass: 'account-search-wrap flex items-center gap-3',
                      labelClass: 'account-name-label truncate text-xs text-slate-600 font-semibold',
                      inputClass: 'w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border',
                      placeholder: 'Código o nombre'
                    })}
                </div>
                <div>
                    <label for="ledger_month" class="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                    <select name="month" id="ledger_month" class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border" required>
                        ${monthOptions.join('')}
                    </select>
                </div>
                <div>
                    <label for="ledger_year" class="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                    <input type="number" name="year" id="ledger_year" value="${UI.h(year)}" min="${UI.h(start.year)}" class="w-full text-xs rounded-lg border-slate-300 shadow-sm p-2 bg-white border" required>
                </div>
                <div class="flex items-end sm:col-span-2">
                    <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition">
                        Generar Mayor &rarr;
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
    (function () {
      var viewHelpers = window.Plasticina.views.helpers;
      var accountsData = ${UI.json(accounts)};
      var form = document.querySelector('form[data-action="accounting.ledger"]');
      if (form) viewHelpers.bindAccountSearchForm(form, accountsData, {});
    })();
    </script>
    `;
  };
})();
