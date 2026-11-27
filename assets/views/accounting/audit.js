(function () {
  'use strict';

  window.Views = window.Views || {};

  const { dataset, format0 } = window.Plasticina.views.helpers;

  window.Views.auditIndex = function (ctx) {
    const owner = Store.activeOwner();
    const workingYear = Store.workingYear();
    const options = { year: workingYear };
    if (owner) options.owner_id = owner.id;
    const journals = dataset(ctx, 'journals.audit', function () { return Store.journals(options) || []; });

    const rows = journals.length
      ? journals.map(function (journal) {
          const doc = journal.document || null;
          const docBlock = doc
            ? `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">Folio: ${UI.h(doc.folio)} (Tipo: ${UI.h(doc.type_vc)})</span>`
            : '<span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">Manual (Sin Doc)</span>';
          const rutBlock = doc && doc.entity ? UI.h(doc.entity.rut) : '<span class="text-slate-400">-</span>';
          const actions = doc
            ? `
                                        <form data-action="journals.delete-only" class="inline">
                                            <input type="hidden" name="id" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="journal" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="_method" value="DELETE">
                                            <button type="submit" data-confirm="${UI.h('¿Desea quitar el documento del asiento? El documento asociado volverá a estar pendiente de contabilizar.')}" class="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-600 hover:text-white transition shadow-sm" title="Quitar documento (El documento vuelve a pendientes)">Quitar documento</button>
                                        </form>

                                        <form data-action="journals.delete-with-document" class="inline">
                                            <input type="hidden" name="id" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="journal" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="_method" value="DELETE">
                                            <button type="submit" data-confirm="${UI.h('¡ADVERTENCIA! Está a punto de borrar el documento y su asiento definitivamente. Esta acción no se puede deshacer y el documento NO volverá a pendientes. ¿Continuar?')}" class="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-600 hover:text-white transition shadow-sm" title="Borrar documento y asiento definitivamente">Borrar documento y asiento</button>
                                        </form>`
            : `
                                        <form data-action="journals.delete-only" class="inline">
                                            <input type="hidden" name="id" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="journal" value="${UI.h(journal.id)}">
                                            <input type="hidden" name="_method" value="DELETE">
                                            <button type="submit" data-confirm="${UI.h('¿Estás seguro de eliminar este asiento manual?')}" class="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-600 hover:text-white transition shadow-sm">Eliminar</button>
                                        </form>`;

          return `
                        <tr class="hover:bg-slate-50 transition">
                            <td class="p-3 font-bold text-indigo-600">#${UI.h(journal.entry_number)}</td>
                            <td class="p-3 whitespace-nowrap">${UI.h(journal.date)}</td>
                            <td class="p-3 max-w-xs truncate" title="${UI.h(journal.description)}">${UI.h(journal.description)}</td>
                            <td class="p-3">${docBlock}</td>
                            <td class="p-3 whitespace-nowrap">${rutBlock}</td>
                            <td class="p-3 text-right font-mono">$ ${format0(journal.total_debit)}</td>
                            <td class="p-3 text-right font-mono">$ ${format0(journal.total_credit)}</td>
                            <td class="p-3 text-center whitespace-nowrap">
                                <div class="flex items-center justify-center space-x-1.5">${actions}</div>
                            </td>
                        </tr>`;
        }).join('')
      : `
                        <tr>
                            <td colspan="8" class="p-6 text-center text-slate-400">No hay asientos contables registrados para este periodo.</td>
                        </tr>`;

    return `
    <div class="max-w-7xl mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Auditoría de Documentos y Asientos</h1>
                <p class="text-sm text-slate-500 mt-1">Periodo: <span class="font-bold text-slate-700">${UI.h(workingYear)}</span> | Empresa: <span class="font-bold text-slate-700">${UI.h(owner ? owner.name : 'N/A')}</span></p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">&larr; Volver</a>
            </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="bg-slate-100 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                        <th class="p-3">N° Asiento</th>
                        <th class="p-3">Fecha</th>
                        <th class="p-3">Glosa / Descripción</th>
                        <th class="p-3">Documento Ref. (Folio)</th>
                        <th class="p-3">RUT Referencia</th>
                        <th class="p-3 text-right">Debe</th>
                        <th class="p-3 text-right">Haber</th>
                        <th class="p-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 text-slate-700">
                    ${rows}
                </tbody>
            </table>
        </div>

    </div>
    `;
  };
  window.Views.auditIndex.resources = ['journals.audit'];
})();
