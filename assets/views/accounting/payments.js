(function () {
  'use strict';

  window.Views = window.Views || {};

  const { accountSearchField, dataset } = window.Plasticina.views.helpers;

  window.Views.paymentsIndex = function (ctx) {
    const owner = Store.activeOwner();
    const pendingDocuments = dataset(ctx, 'reports.paymentsPending', function () {
      return Store.pendingBalanceDocuments() || [];
    });
    const accounts = dataset(ctx, 'catalogs.accounts', function () {
      return { accounts: Store.activeOwnerAccounts() };
    }).accounts;
    const defaultAccountCode = accounts.length ? accounts[0].code : '';

    const rows = pendingDocuments.length
      ? pendingDocuments.map(function (doc) {
          const isSale = String(doc.type_vc) === 'V';
          return `
                        <tr class="hover:bg-slate-50 transition">
                            <td class="p-3 font-bold">
                                <span class="px-2 py-1 rounded text-xs ${isSale ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}">${UI.h(isSale ? 'Venta' : 'Compra')}</span>
                            </td>
                            <td class="p-3 font-semibold">#${UI.h(doc.folio)}</td>
                            <td class="p-3">${UI.h(doc.date)}</td>
                            <td class="p-3 text-right font-mono">$ ${UI.h(UI.number(doc.total, 2))}</td>
                            <td class="p-3 text-right font-mono text-emerald-600">$ ${UI.h(UI.number(doc.calculated_paid, 2))}</td>
                            <td class="p-3 text-right font-mono font-bold text-rose-600">$ ${UI.h(UI.number(doc.calculated_balance, 2))}</td>
                            <td class="p-3 text-center">
                                <form data-action="payments.store" class="flex items-center justify-center space-x-2">
                                    <input type="hidden" name="document_id" value="${UI.h(doc.id)}">
                                    <input type="date" name="date" value="${UI.h(UI.today())}" class="text-xs border border-slate-300 rounded px-2 py-1">
                                    <input type="number" name="amount" step="0.01" max="${UI.h(doc.calculated_balance)}" value="${UI.h(doc.calculated_balance)}" placeholder="Monto" class="w-24 text-xs border border-slate-300 rounded px-2 py-1 font-mono">
                                    ${accountSearchField('bank_account_code', defaultAccountCode, {
                                      accounts: accounts,
                                      inputClass: 'w-32 text-xs border border-slate-300 rounded px-2 py-1 bg-white',
                                      placeholder: 'Código o nombre'
                                    })}
                                    <button type="submit" class="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap">${UI.h(isSale ? 'Cobrar' : 'Pagar')}</button>
                                </form>
                            </td>
                        </tr>`;
        }).join('')
      : `
                        <tr>
                            <td colspan="7" class="p-6 text-center text-slate-400">No hay documentos con saldos pendientes de pago o cobro en este periodo.</td>
                        </tr>`;

    return `
    <div class="max-w-7xl mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Gestión de Cobros y Pagos (Pendientes)</h1>
                <p class="text-sm text-slate-500 mt-1">Empresa: <span class="font-bold text-slate-700">${UI.h(owner ? owner.name : 'N/A')}</span></p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">&larr; Volver</a>
            </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="bg-slate-100 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                        <th class="p-3">Tipo (C/V)</th>
                        <th class="p-3">Folio</th>
                        <th class="p-3">Fecha</th>
                        <th class="p-3 text-right">Total Documento</th>
                        <th class="p-3 text-right">Pagado / Cobrado</th>
                        <th class="p-3 text-right">Saldo Pendiente</th>
                        <th class="p-3 text-center">Acción de Pago / Cobro</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 text-slate-700">
                    ${rows}
                </tbody>
            </table>
        </div>

    </div>

    <script>
    (function () {
      var viewHelpers = window.Plasticina.views.helpers;
      var accountsData = ${UI.json(accounts)};
      Array.prototype.forEach.call(document.querySelectorAll('form[data-action="payments.store"]'), function (form) {
        viewHelpers.bindAccountSearchForm(form, accountsData, {});
      });
    })();
    </script>
    `;
  };
  window.Views.paymentsIndex.resources = ['reports.paymentsPending', 'catalogs.accounts'];
})();
