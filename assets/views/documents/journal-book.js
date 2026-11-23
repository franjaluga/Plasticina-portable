(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.journalBook = function (ctx) {
    const owner = Store.activeOwner();
    const query = ctx.query || {};
    const workingYear = Store.workingYear();
    const dateFrom = query.date_from === undefined ? '' : query.date_from;
    const dateTo = query.date_to === undefined ? '' : query.date_to;
    const options = { year: workingYear };
    if (owner) options.owner_id = owner.id;
    if (dateFrom !== '' && dateTo !== '') {
      options.date_from = dateFrom;
      options.date_to = dateTo;
    }
    const journals = Store.journals(options);
    const exportHref = UI.route('vc_documents.export_csv', { date_from: dateFrom, date_to: dateTo });
    const generateHref = UI.route('vc_documents.journal_book.generate', { date_from: dateFrom, date_to: dateTo });
    const rangeLabel = dateFrom !== '' && dateTo !== ''
      ? `<span class="ml-2 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">Desde: ${UI.h(dateFrom)} hasta ${UI.h(dateTo)}</span>`
      : '';

    const rows = journals.length
      ? journals.map(function (journal) {
          const doc = journal.document || null;
          const docTypeName = doc ? (doc.documentType && doc.documentType.name ? doc.documentType.name : doc.document_type_id) : '';
          const docRut = doc && doc.entity ? doc.entity.rut : 'N/A';
          const balanceClass = journal.is_balanced ? 'text-green-600' : 'text-red-600';
          const balanceText = journal.is_balanced ? '● Cuadrado' : '● Descuadrado';
          const docBlock = doc
            ? `
                                        <span class="text-gray-500 font-normal ml-2">
                                            (Doc: <span class="font-semibold text-gray-700">${UI.h(docTypeName)}</span>
                                            | RUT: <span class="font-semibold text-gray-700">${UI.h(docRut)}</span>
                                            | Folio:
                                            <a href="${UI.h(UI.route('accounting.documents.detail', doc.id))}" class="text-indigo-600 hover:underline font-bold">
                                                ${UI.h(doc.folio)}
                                            </a>)
                                        </span>`
            : '';
          const descriptionBlock = journal.description
            ? `<span class="text-gray-600 font-normal ml-2">— ${UI.h(journal.description)}</span>`
            : '';
          const entries = (journal.entries || []).map(function (entry) {
            const accountName = entry.account && entry.account.name ? entry.account.name : 'Sin nombre';
            return `
                                <tr class="hover:bg-gray-50/80 transition">
                                    <td class="py-2 px-4 font-mono text-gray-600 font-medium">${UI.h(entry.account_code)}</td>
                                    <td class="py-2 px-4 text-gray-900 font-sans">${UI.h(accountName)}</td>
                                    <td class="py-2 px-4 text-right font-mono text-gray-800">${UI.h(entry.debit ? UI.number(entry.debit) : '-')}</td>
                                    <td class="py-2 px-4 text-right font-mono text-gray-800">${UI.h(entry.credit ? UI.number(entry.credit) : '-')}</td>
                                </tr>`;
          }).join('');

          return `
                            <tr class="bg-gray-100 font-semibold text-gray-800">
                                <td colspan="4" class="py-2.5 px-4 text-xs">
                                    Asiento N° <span class="font-bold text-indigo-700">${UI.h(journal.entry_number)}</span>
                                    <span class="mx-1 text-gray-400">|</span> Fecha: <span class="font-normal">${UI.h(journal.date)}</span>
                                    ${docBlock}
                                    ${descriptionBlock}
                                    <span class="float-right font-bold ${balanceClass}">
                                        ${UI.h(balanceText)}
                                    </span>
                                </td>
                            </tr>
                            ${entries}
                            <tr class="bg-gray-50/50 border-b border-gray-200 text-gray-600 font-mono text-[11px]">
                                <td class="py-2 px-4"></td>
                                <td class="py-2 px-4 italic font-sans font-medium text-gray-500">Total Asiento N° ${UI.h(journal.entry_number)}:</td>
                                <td class="py-2 px-4 text-right font-bold text-indigo-600">${UI.h(UI.number(journal.total_debit))}</td>
                                <td class="py-2 px-4 text-right font-bold text-indigo-600">${UI.h(UI.number(journal.total_credit))}</td>
                            </tr>`;
        }).join('')
      : `
                            <tr>
                                <td colspan="4" class="text-center py-12 text-gray-400 text-sm">
                                    No hay registros en el libro diario para el periodo o rango seleccionado.
                                </td>
                            </tr>`;

    return `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Libro Diario Contable</h1>
                <p class="text-xs text-gray-500 mt-1">
                    Periodo año: <span class="font-bold text-indigo-600">${UI.h(workingYear)}</span>
                    ${rangeLabel}
                </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <a href="${UI.h(exportHref)}" class="inline-flex items-center text-xs font-semibold bg-green-600 text-white px-3.5 py-2 rounded-lg shadow-sm hover:bg-green-700 transition">
                    Exportar a CSV
                </a>
                <a href="${UI.h(generateHref)}" class="inline-flex items-center text-xs font-semibold bg-indigo-600 text-white px-3.5 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition">
                    Generar Libro
                </a>
                <a href="${UI.h(UI.route('vc_documents.pending'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    Pendientes
                </a>
                <a href="${UI.h(UI.route('vc_documents.journal_book.form'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Cambiar Rango
                </a>
            </div>
        </div>

        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs table-auto">
                    <thead>
                        <tr class="bg-gray-800 text-white uppercase tracking-wider text-[11px]">
                            <th class="py-3 px-4 w-32">Código</th>
                            <th class="py-3 px-4">Nombre de Cuenta</th>
                            <th class="py-3 px-4 text-right w-28">Debe</th>
                            <th class="py-3 px-4 text-right w-28">Haber</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
  };
})();
