(function () {
  'use strict';

  window.Views = window.Views || {};

  const { accountSearchField, dataset, selectField } = window.Plasticina.views.helpers;

  window.Views.documentPending = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const documentTypes = dataset(ctx, 'catalogs.documentTypes', function () { return Store.documentTypes(); });
    const accounts = dataset(ctx, 'catalogs.accounts', function () {
      return { accounts: Store.activeOwnerAccounts() };
    }).accounts;
    const filters = {};
    if (query.rut !== undefined && query.rut !== '') filters.rut = query.rut;
    if (query.document_type_id !== undefined && query.document_type_id !== '') filters.document_type_id = query.document_type_id;
    if (query.date !== undefined && query.date !== '') filters.date = query.date;
    if (query.folio !== undefined && query.folio !== '') filters.folio = query.folio;
    const documents = dataset(ctx, 'documents.pending', function () { return Store.pendingDocuments(filters); });
    const oldValues = UI.old() || {};
    const glosa = oldValues.glosa === undefined || oldValues.glosa === null || oldValues.glosa === ''
      ? 'Contabilización de documentos V/C'
      : oldValues.glosa;
    function oldAccountCode(id) {
      const key = 'custom_net_account[' + id + '][code]';
      return oldValues[key] === undefined || oldValues[key] === null ? '' : oldValues[key];
    }

    const rows = documents.length
      ? documents.map(function (doc) {
          const entity = doc.entity || {};
          const typeClass = doc.type_vc === 'V' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
          return `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-4 py-3 text-center">
                                    <input type="checkbox" name="document_ids[]" value="${UI.h(doc.id)}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 doc-checkbox">
                                </td>
                                <td class="px-6 py-3 font-bold text-gray-900">${UI.h(doc.folio)}</td>
                                <td class="px-6 py-3 text-gray-700">
                                    <span class="font-semibold">${UI.h(entity.name || 'S/N')}</span>
                                    <span class="block text-[11px] text-gray-400">${UI.h(entity.rut || '')}</span>
                                </td>
                                <td class="px-6 py-3">
                                    <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${typeClass}">
                                        ${UI.h(doc.type_vc === 'V' ? 'Venta' : 'Compra')}
                                    </span>
                                </td>
                                <td class="px-6 py-3 text-gray-600">${UI.h(doc.date)}</td>
                                <td class="px-6 py-3 text-right text-gray-600">${UI.h(UI.number(doc.net))}</td>
                                <td class="px-6 py-3 text-right text-gray-600">${UI.h(UI.number(doc.vat_rec))}</td>
                                <td class="px-6 py-3 text-right font-bold text-gray-900">${UI.h(UI.number(doc.total))}</td>
                                <td class="px-4 py-3" style="min-width:12rem">
                                    ${accountSearchField('custom_net_account[' + doc.id + '][code]', oldAccountCode(doc.id), {
                                      id: 'custom_net_account_' + doc.id,
                                      accounts: accounts,
                                      picker: 'code',
                                      source: 'catalogs.accounts',
                                      ownerId: owner ? owner.id : '',
                                      workingYear: Store.workingYear(),
                                      placeholder: 'Código',
                                      emptyLabel: 'Escriba el código',
                                      required: false,
                                      wrapperClass: 'account-search-wrap flex flex-col items-stretch gap-1',
                                      inputClass: 'w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white',
                                      labelClass: 'account-name-label truncate text-[10px] text-gray-400 italic'
                                    })}
                                </td>
                            </tr>`;
        }).join('')
      : `
                            <tr>
                                <td colspan="9" class="px-6 py-10 text-center text-sm text-gray-500">
                                    No hay documentos pendientes que coincidan con los filtros aplicados.
                                </td>
                            </tr>`;

    return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Documentos V/C Pendientes de Contabilización</h2>
                <p class="text-sm text-gray-500 mt-1">Periodo tributario año: <span class="font-bold text-blue-600">${UI.h(Store.workingYear())}</span></p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
            <form data-action="vc_documents.pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                    <label for="rut" class="block text-xs font-bold uppercase text-gray-600 mb-1">RUT Entidad</label>
                    <input type="text" name="rut" id="rut" value="${UI.h(query.rut || '')}" placeholder="Ej: 12345678" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div>
                    <label for="document_type_id" class="block text-xs font-bold uppercase text-gray-600 mb-1">Tipo de Documento</label>
                    ${selectField('document_type_id', [{ value: '', label: 'Todos los tipos' }].concat(documentTypes.map(function (dt) {
                      return { value: dt.doctype, label: dt.doctype + ' - ' + dt.name };
                    })), {
                      id: 'document_type_id',
                      value: query.document_type_id || '',
                      className: 'w-full text-xs border border-gray-300 rounded-lg p-2 bg-white',
                      required: false,
                      emptyLabel: 'Todos los tipos'
                    })}
                </div>
                <div>
                    <label for="date" class="block text-xs font-bold uppercase text-gray-600 mb-1">Fecha</label>
                    <input type="date" name="date" id="date" value="${UI.h(query.date || '')}" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                </div>
                <div>
                    <label for="folio" class="block text-xs font-bold uppercase text-gray-600 mb-1">Folio</label>
                    <input type="number" name="folio" id="folio" value="${UI.h(query.folio || '')}" placeholder="N° Folio" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                </div>
                <div class="flex space-x-2">
                    <button type="submit" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg shadow transition">
                        Filtrar
                    </button>
                    <a href="${UI.h(UI.route('vc_documents.pending'))}" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center">
                        Limpiar
                    </a>
                </div>
            </form>
        </div>

        <form data-action="documents.batch">
            <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
                <div>
                    <label for="glosa" class="block text-xs font-bold uppercase text-gray-700 mb-1">
                        Glosa / Descripción General para los Asientos
                    </label>
                    <input type="text" name="glosa" id="glosa" value="${UI.h(glosa)}" class="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" required placeholder="Ej: Facturas recibidas del periodo">
                    <p class="text-[10px] text-gray-400 mt-1">Ingrese el código de la cuenta contable del neto en cada documento de la tabla.</p>
                </div>

                <div class="flex justify-end pt-2 border-t border-gray-100">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition uppercase tracking-wider">
                        Contabilizar Seleccionados
                    </button>
                </div>
            </div>

            <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-left text-xs" style="min-width:1080px">
                        <thead class="bg-gray-800 text-white">
                            <tr>
                                <th scope="col" class="w-12 px-4 py-3 text-center">
                                    <input type="checkbox" id="select-all" data-select-all=".doc-checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 doc-checkbox">
                                </th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Folio</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Entidad / RUT</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Tipo V/C</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider">Fecha Doc.</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">Neto</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">IVA Rec.</th>
                                <th scope="col" class="px-6 py-3 font-bold uppercase tracking-wider text-right">Total</th>
                                <th scope="col" class="px-4 py-3 font-bold uppercase tracking-wider">Cuenta Neto</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>

        </form>
    </div>

    `;
  };
  window.Views.documentPending.resources = ['catalogs.documentTypes', 'catalogs.accounts', 'documents.pending'];
})();
