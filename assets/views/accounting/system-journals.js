(function () {
  'use strict';

  window.Views = window.Views || {};

  const { queryYear } = window.Plasticina.views.helpers;

  window.Views.systemJournals = function (ctx) {
    const query = ctx.query || {};
    const year = queryYear(query);
    const filterKeys = ['entry_from', 'entry_to', 'date_from', 'date_to', 'folio_from', 'folio_to', 'rut', 'document_type_id', 'folio_ref'];
    const filters = {};
    filterKeys.forEach(function (key) {
      if (query[key] !== undefined && query[key] !== '') filters[key] = query[key];
    });
    const journals = Store.systemJournals(year, filters) || [];
    const documentTypes = Store.documentTypes();
    const start = Store.ownerStartPeriod();
    const startIso = start.year + '-' + String(start.month).padStart(2, '0') + '-01';

    const documentTypeOptions = documentTypes.map(function (dtype) {
      const selected = filters.document_type_id !== undefined && String(filters.document_type_id) === String(dtype.doctype) ? ' selected' : '';
      return `<option value="${UI.h(dtype.doctype)}"${selected}>${UI.h(dtype.name)}</option>`;
    }).join('');

    const rows = journals.length
      ? journals.map(function (journal) {
          const doc = journal.document || null;
          const paidDocument = journal.paidDocument || null;
          const isPayment = Boolean(journal.ref_doc_payed && paidDocument);
          const folio = isPayment ? '-' : (doc ? (doc.folio || 'N/A (Manual)') : 'N/A (Manual)');
          const rut = isPayment ? (paidDocument.entity ? paidDocument.entity.rut : 'N/A') : (doc && doc.entity ? doc.entity.rut : 'N/A');
          const typeName = isPayment
            ? (paidDocument.documentType ? paidDocument.documentType.name : 'Documento Pagado')
            : (doc && doc.documentType ? doc.documentType.name : 'Asiento Manual');
          const folioRef = isPayment
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-800" title="Pago/Cobro aplicado al documento con Folio">Pago Doc. Folio: ${UI.h(paidDocument.folio)}</span>`
            : `<span class="text-gray-500">${UI.h(doc ? (doc.folio_ref || '-') : '-')}</span>`;
          const editHref = journal.vc_document_id
            ? UI.route('accounting.journals.edit', journal.id)
            : UI.route('accounting.manual_journals.edit', journal.id);

          return `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="py-3 px-4 font-bold text-center bg-gray-50">
                                <a href="${UI.h(UI.route('accounting.journals.detail', journal.id))}" class="text-blue-600 hover:underline" title="Ver comprobante del asiento">
                                    ${UI.h(journal.entry_number)} &rarr;
                                </a>
                            </td>
                            <td class="py-3 px-4 text-gray-600">${UI.h(journal.closing_date || journal.date)}</td>

                            <td class="py-3 px-4 font-bold text-gray-900">${UI.h(folio)}</td>

                            <td class="py-3 px-4 text-gray-800">${UI.h(journal.description || 'Asiento automatizado')}</td>

                            <td class="py-3 px-4 text-gray-600 font-mono">${UI.h(rut)}</td>

                            <td class="py-3 px-4 text-gray-600">${UI.h(typeName)}</td>

                            <td class="py-3 px-4">${folioRef}</td>

                            <td class="py-3 px-4 text-center">
                                <div class="flex items-center justify-center space-x-1.5">
                                    <a href="${UI.h(editHref)}" class="${journal.vc_document_id ? 'bg-blue-50 hover:bg-blue-100 text-blue-600' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'} font-bold px-2 py-1 rounded transition text-xs" title="${journal.vc_document_id ? 'Editar Asiento V/C' : 'Editar Asiento Manual'}">
                                        Editar
                                    </a>

                                    <form data-action="journals.delete-with-document" class="inline">
                                        <input type="hidden" name="id" value="${UI.h(journal.id)}">
                                        <input type="hidden" name="journal" value="${UI.h(journal.id)}">
                                        <input type="hidden" name="_method" value="DELETE">
                                        <button type="submit" data-confirm="${UI.h('¿Estás seguro de eliminar este asiento y su documento asociado?')}" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded transition text-sm" title="Eliminar Asiento">
                                            &times;
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>`;
        }).join('')
      : `
                        <tr>
                            <td colspan="8" class="py-8 text-center text-gray-500 text-sm">
                                No se encontraron asientos contables con los filtros seleccionados.
                            </td>
                        </tr>`;

    return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Asientos Contables del Sistema</h2>
                <p class="text-sm text-gray-500 mt-1">Periodo tributario año: <span class="font-bold text-blue-600">${UI.h(year)}</span></p>
            </div>
            <div class="flex items-center gap-2">
                <a href="${UI.h(UI.route('accounting.system_journals.export_csv', query))}" class="inline-flex items-center text-xs font-semibold bg-green-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-700 transition">
                    Exportar CSV
                </a>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 class="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">Filtros de Búsqueda</h3>
            <form data-action="accounting.system_journals">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">N° Asiento (Desde - Hasta)</label>
                        <div class="flex space-x-2">
                            <input type="number" name="entry_from" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Desde" value="${UI.h(query.entry_from || '')}">
                            <input type="number" name="entry_to" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Hasta" value="${UI.h(query.entry_to || '')}">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Fecha Centralización (Desde - Hasta)</label>
                        <div class="flex space-x-2">
                            <input type="date" name="date_from" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value="${UI.h(query.date_from || '')}" min="${UI.h(startIso)}">
                            <input type="date" name="date_to" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value="${UI.h(query.date_to || '')}">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Folio Doc. (Desde - Hasta)</label>
                        <div class="flex space-x-2">
                            <input type="number" name="folio_from" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Desde" value="${UI.h(query.folio_from || '')}">
                            <input type="number" name="folio_to" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Hasta" value="${UI.h(query.folio_to || '')}">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">RUT Entidad</label>
                        <input type="text" name="rut" class="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: 12.345.678-9" value="${UI.h(query.rut || '')}">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Tipo Documento</label>
                        <select name="document_type_id" class="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="">-- Todos --</option>
                            ${documentTypeOptions}
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">Folio de Referencia</label>
                        <input type="text" name="folio_ref" class="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ref..." value="${UI.h(query.folio_ref || '')}">
                    </div>

                    <div class="sm:col-span-2 flex items-end justify-end space-x-2 pt-2">
                        <a href="${UI.h(UI.route('accounting.system_journals'))}" class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm">
                            Limpiar
                        </a>
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow">
                            Filtrar
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead class="bg-gray-800 text-white font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                        <th class="py-3 px-4 w-24 text-center">N° Asiento</th>
                        <th class="py-3 px-4">Fecha Centralización</th>
                        <th class="py-3 px-4">Folio</th>
                        <th class="py-3 px-4">Glosa / Descripción</th>
                        <th class="py-3 px-4">RUT</th>
                        <th class="py-3 px-4">Tipo Documento</th>
                        <th class="py-3 px-4">Folio Ref.</th>
                        <th class="py-3 px-4 w-28 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    ${rows}
                </tbody>
            </table>
        </div>

    </div>
    `;
  };
})();
