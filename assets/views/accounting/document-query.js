(function () {
  'use strict';

  window.Views = window.Views || {};

  const { dataset, format0, num, pad, queryMonth, queryYear } = window.Plasticina.views.helpers;

  window.Views.documentQueryResults = function (ctx) {
    const query = ctx.query || {};
    const typeVc = query.type_vc === undefined || query.type_vc === '' ? 'V' : query.type_vc;
    const month = queryMonth(query);
    const year = queryYear(query);
    const documents = dataset(ctx, 'documents.query', function () {
      return Store.queryDocuments(typeVc, month, year) || [];
    });
    const sumField = function (field) {
      return documents.reduce(function (sum, doc) { return sum + num(doc[field]); }, 0);
    };

    const rows = documents.length
      ? documents.map(function (doc) {
          const docType = doc.documentType || {};
          return `
                    <tr>
                        <td class="py-2 px-3 font-bold"><a href="${UI.h(UI.route('accounting.documents.detail', doc.id))}" class="underline">${UI.h(doc.folio)}</a></td>
                        <td class="py-2 px-3 text-gray-600 font-sans whitespace-nowrap">${UI.h(doc.date)}</td>
                        <td class="py-2 px-3 text-gray-800">
                            <span class="font-bold">${UI.h(doc.entity ? doc.entity.rut : 'N/A')}</span>
                            <span class="block text-[10px] text-gray-500 font-sans truncate max-w-[160px]">${UI.h(doc.entity ? doc.entity.name : 'Sin nombre')}</span>
                        </td>
                        <td class="py-2 px-3 text-gray-800 font-sans">
                            <span class="font-bold">${UI.h(doc.document_type_id)}</span>
                            <span class="text-gray-500 text-[10px] truncate block max-w-[130px]">${UI.h(docType.name || docType.description || '')}</span>
                        </td>
                        <td class="py-2 px-3 text-right">${format0(doc.net)}</td>
                        <td class="py-2 px-3 text-right text-gray-500">${format0(doc.exempt)}</td>
                        <td class="py-2 px-3 text-right">${format0(doc.vat_rec)}</td>
                        <td class="py-2 px-3 text-right text-gray-500">${format0(doc.plus_oth_tax)}</td>
                        <td class="py-2 px-3 text-right text-gray-500">${format0(doc.minus_oth_tax)}</td>
                        <td class="py-2 px-3 text-right font-bold">${format0(doc.total)}</td>
                    </tr>`;
        }).join('')
      : `
                    <tr>
                        <td colspan="10" class="text-center py-8 text-gray-400 font-sans">No se encontraron registros para este periodo.</td>
                    </tr>`;

    const footer = documents.length
      ? `
                <tfoot>
                    <tr class="border-t-2 border-black font-bold font-mono text-[11px] text-black">
                        <td colspan="4" class="py-3 px-3 text-right uppercase font-sans">TOTALES:</td>
                        <td class="py-3 px-3 text-right">${format0(sumField('net'))}</td>
                        <td class="py-3 px-3 text-right text-gray-600">${format0(sumField('exempt'))}</td>
                        <td class="py-3 px-3 text-right">${format0(sumField('vat_rec'))}</td>
                        <td class="py-3 px-3 text-right text-gray-600">${format0(sumField('plus_oth_tax'))}</td>
                        <td class="py-3 px-3 text-right text-gray-600">${format0(sumField('minus_oth_tax'))}</td>
                        <td class="py-3 px-3 text-right">${format0(sumField('total'))}</td>
                    </tr>
                </tfoot>`
      : '';

    return `
    <div class="bg-white text-black font-sans p-6 max-w-[95%] mx-auto">

    <div class="flex justify-between items-baseline pb-3 mb-4 border-b border-gray-300">
        <div>
            <h1 class="text-base font-bold uppercase tracking-wider">Registro de ${UI.h(String(typeVc).toUpperCase() === 'V' ? 'Ventas' : 'Compras')}</h1>
            <p class="text-xs text-gray-600 font-mono mt-0.5">Periodo: ${UI.h(pad(month))} / ${UI.h(year)}</p>
        </div>
        <div>
            <a href="javascript:history.back()" class="text-xs font-medium text-black border border-gray-300 px-2.5 py-1 rounded">&larr; Volver</a>
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="border-b-2 border-black text-[11px] font-bold uppercase text-gray-700">
                    <th class="py-2.5 px-3">Folio</th>
                    <th class="py-2.5 px-3">Fecha</th>
                    <th class="py-2.5 px-3">RUT / Entidad</th>
                    <th class="py-2.5 px-3">Documento</th>
                    <th class="py-2.5 px-3 text-right">Neto</th>
                    <th class="py-2.5 px-3 text-right">Exento</th>
                    <th class="py-2.5 px-3 text-right">IVA</th>
                    <th class="py-2.5 px-3 text-right">Imp. (+)</th>
                    <th class="py-2.5 px-3 text-right">Imp. (-)</th>
                    <th class="py-2.5 px-3 text-right">Total</th>
                </tr>
            </thead>
            <tbody class="font-mono text-[11px] divide-y divide-gray-200">
                ${rows}
            </tbody>
            ${footer}
        </table>
    </div>

    </div>
    `;
  };
  window.Views.documentQueryResults.resources = ['documents.query'];
})();
