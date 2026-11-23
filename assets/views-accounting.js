window.Views = window.Views || {};

(function () {
  'use strict';

  function oldValue(oldValues, key, fallback) {
    if (oldValues && Object.prototype.hasOwnProperty.call(oldValues, key) && oldValues[key] !== null && oldValues[key] !== undefined && oldValues[key] !== '') {
      return oldValues[key];
    }
    return fallback;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function capitalize(value) {
    const text = String(value || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function num(value) {
    return Number(value || 0);
  }

  function accountOptions(accounts, selectedCode) {
    return (accounts || []).map(function (acc) {
      return `<option value="${UI.h(acc.code)}"${String(selectedCode) === String(acc.code) ? ' selected' : ''}>${UI.h(acc.code)} - ${UI.h(acc.name)}</option>`;
    }).join('');
  }

  function format0(value) {
    return UI.h(UI.number(value, 0));
  }

  function format0OrDash(value) {
    return num(value) ? format0(value) : '-';
  }

  function queryYear(query) {
    return query && query.year !== undefined && query.year !== '' ? query.year : Store.workingYear();
  }

  function queryMonth(query) {
    return query && query.month !== undefined && query.month !== '' ? Number(query.month) : Number(UI.today().slice(5, 7));
  }

  function docTypeName(doc) {
    return doc && doc.documentType ? (doc.documentType.name || 'Doc') : 'Doc';
  }

  window.Views.accountingIndex = function (ctx) {
    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <div>
                <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">Reportes Contables</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Periodo tributario año: <span class="font-bold text-indigo-600">${UI.h(Store.workingYear())}</span>
                </p>
            </div>
            <div>
                <a href="${UI.h(UI.route('reports.analytics'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <a href="${UI.h(UI.route('vc_documents.journal_book'))}" class="group p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-emerald-600 transition text-base">Libro Diario</h2>
                    <p class="text-xs text-slate-500 mt-1">Registro histórico de asientos contables del periodo.</p>
                </div>
                <span class="text-xs font-semibold text-emerald-600 mt-4 flex items-center">
                    Consultar &rarr;
                </span>
            </a>

            <a href="${UI.h(UI.route('vc_documents.tax_balance'))}" class="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition text-left flex flex-col justify-between">
                <div>
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <h2 class="font-bold text-slate-800 group-hover:text-indigo-600 transition text-base">Balance 8 Columnas</h2>
                    <p class="text-xs text-slate-500 mt-1">Resumen contable de sumas, saldos, inventario y resultados.</p>
                </div>
                <span class="text-xs font-semibold text-indigo-600 mt-4 flex items-center">
                    Generar &rarr;
                </span>
            </a>

        </div>

    </div>
    `;
  };

  window.Views.accountingAnalytics = function (ctx) {
    const query = ctx.query || {};
    const month = queryMonth(query);
    const year = queryYear(query);
    const typeVc = query.type_vc === 'C' ? 'C' : 'V';
    let monthOptions = '';
    for (let value = 1; value <= 12; value++) {
      monthOptions += `<option value="${UI.h(value)}"${value === month ? ' selected' : ''}>${UI.h(value)} - ${UI.h(capitalize(UI.monthName(value)))}</option>`;
    }

    return `
    <div class="max-w-4xl w-full mx-auto p-8 bg-white shadow-xl rounded-2xl border border-slate-100">

        <div class="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <div>
                <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">Analíticos (V/C)</h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Periodo tributario año: <span class="font-bold text-blue-600">${UI.h(Store.workingYear())}</span>
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
                        <h2 class="font-bold text-slate-800 text-base">Consulta de Compras o Ventas</h2>
                        <p class="text-xs text-slate-500">Filtra los documentos específicos seleccionando tipo, mes y año.</p>
                    </div>
                </div>

                <form data-action="vc_documents.query" class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                        <label for="type_vc" class="block text-xs font-semibold text-slate-600 mb-1">Tipo de Documento</label>
                        <select name="type_vc" id="type_vc" class="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white border" required>
                            <option value="V"${typeVc === 'V' ? ' selected' : ''}>Venta</option>
                            <option value="C"${typeVc === 'C' ? ' selected' : ''}>Compra</option>
                        </select>
                    </div>
                    <div>
                        <label for="month" class="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                        <select name="month" id="month" class="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white border" required>
                            ${monthOptions}
                        </select>
                    </div>
                    <div>
                        <label for="year" class="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                        <input type="number" name="year" id="year" value="${UI.h(year)}" class="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white border" required>
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

  window.Views.taxBalance = function (ctx) {
    const query = ctx.query || {};
    const year = queryYear(query);
    const activeOwner = Store.activeOwner();
    const balanceRows = Store.taxBalance(year) || [];
    let sumSd = 0;
    let sumSc = 0;
    let sumBd = 0;
    let sumBc = 0;
    let sumAct = 0;
    let sumPas = 0;
    let sumPer = 0;
    let sumGan = 0;

    balanceRows.forEach(function (row) {
      sumSd += num(row.sum_debit);
      sumSc += num(row.sum_credit);
      sumBd += num(row.balance_debit);
      sumBc += num(row.balance_credit);
      sumAct += num(row.activo);
      sumPas += num(row.pasivo);
      sumPer += num(row.perdida);
      sumGan += num(row.ganancia);
    });

    const diffResult = Math.abs(sumPer - sumGan);
    let resPerdida = 0;
    let resGanancia = 0;
    let resActivo = 0;
    let resPasivo = 0;
    if (sumGan > sumPer) {
      resPerdida = diffResult;
      resPasivo = diffResult;
    } else if (sumPer > sumGan) {
      resGanancia = diffResult;
      resActivo = diffResult;
    }

    const totalInvActivo = sumAct + resActivo;
    const totalInvPasivo = sumPas + resPasivo;
    const totalResPerdida = sumPer + resPerdida;
    const totalResGanancia = sumGan + resGanancia;

    const rows = balanceRows.length
      ? balanceRows.map(function (row) {
          return `
                    <tr class="font-mono">
                        <td class="py-1.5 px-2 font-bold text-slate-700 font-sans border-r border-slate-200">${UI.h(row.code)}</td>
                        <td class="py-1.5 px-4 font-sans text-slate-800 border-r border-slate-200">${UI.h(row.name)}</td>

                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.sum_debit)}</td>
                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.sum_credit)}</td>

                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.balance_debit)}</td>
                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.balance_credit)}</td>

                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.activo)}</td>
                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.pasivo)}</td>

                        <td class="py-1.5 px-2 text-right border-r border-slate-200">${format0OrDash(row.perdida)}</td>
                        <td class="py-1.5 px-2 text-right">${format0OrDash(row.ganancia)}</td>
                    </tr>`;
        }).join('')
      : `
                    <tr>
                        <td colspan="10" class="text-center py-10 text-slate-400 font-sans">No hay registros contables en los asientos para generar el balance de este año.</td>
                    </tr>`;

    const footer = balanceRows.length
      ? `
                <tfoot class="border-t-2 border-slate-300 font-bold font-mono text-slate-900 bg-white text-xs">
                    <tr class="border-b border-slate-200">
                        <td colspan="2" class="py-2 px-4 text-left font-sans uppercase text-[10px] border-r border-slate-200">Sumas</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumSd)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumSc)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumBd)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumBc)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumAct)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumPas)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0(sumPer)}</td>
                        <td class="py-2 px-2 text-right">${format0(sumGan)}</td>
                    </tr>

                    <tr class="border-b border-slate-200">
                        <td colspan="2" class="py-2 px-4 text-left font-sans uppercase text-[10px] border-r border-slate-200">
                            Resultado del Ejercicio (${UI.h(sumGan > sumPer ? 'Utilidad' : 'Pérdida')})
                        </td>
                        <td colspan="4" class="border-r border-slate-200"></td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0OrDash(resActivo)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0OrDash(resPasivo)}</td>
                        <td class="py-2 px-2 text-right border-r border-slate-200">${format0OrDash(resPerdida)}</td>
                        <td class="py-2 px-2 text-right">${format0OrDash(resGanancia)}</td>
                    </tr>

                    <tr class="border-t border-slate-300">
                        <td colspan="2" class="py-2.5 px-4 text-left font-sans uppercase text-[10px] border-r border-slate-300">Sumas Iguales</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300">${format0(sumSd)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300">${format0(sumSc)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300">${format0(sumBd)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300">${format0(sumBc)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300 font-extrabold">${format0(totalInvActivo)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300 font-extrabold">${format0(totalInvPasivo)}</td>
                        <td class="py-2.5 px-2 text-right border-r border-slate-300 font-extrabold">${format0(totalResPerdida)}</td>
                        <td class="py-2.5 px-2 text-right font-extrabold">${format0(totalResGanancia)}</td>
                    </tr>
                </tfoot>`
      : '';

    return `
    <div class="bg-white text-slate-900 font-sans p-8 max-w-6xl mx-auto">

    <div class="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
        <div>
            <h1 class="text-xl font-semibold tracking-tight">Balance Tributario de 8 Columnas</h1>
            <div class="text-xs text-slate-600 mt-1 space-y-0.5">
                <p><span class="font-bold text-slate-900">Empresa:</span> ${UI.h(activeOwner ? activeOwner.name : 'Sin Empresa')}</p>
                <p><span class="font-bold text-slate-900">RUT:</span> ${UI.h(activeOwner ? activeOwner.rut : 'N/A')}</p>
                <p><span class="font-bold text-slate-900">Periodo Comercial:</span> ${UI.h(year)}</p>
            </div>
        </div>
        <div class="text-sm">
            <a href="${UI.h(UI.route('welcome'))}" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                &larr; Volver
            </a>
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs border border-slate-200">
            <thead>
                <tr class="border-b border-slate-300 text-[10px] text-slate-600 uppercase text-center bg-slate-50">
                    <th rowspan="2" class="py-2 px-2 text-left border-r border-slate-200">Código</th>
                    <th rowspan="2" class="py-2 px-4 text-left border-r border-slate-200">Cuenta Contable</th>
                    <th colspan="2" class="py-1 px-2 border-b border-r border-slate-200">Sumas</th>
                    <th colspan="2" class="py-1 px-2 border-b border-r border-slate-200">Saldos</th>
                    <th colspan="2" class="py-1 px-2 border-b border-r border-slate-200">Inventario</th>
                    <th colspan="2" class="py-1 px-2 border-b border-slate-200">Resultados</th>
                </tr>
                <tr class="border-b border-slate-300 text-[10px] text-slate-500 uppercase text-right bg-slate-50">
                    <th class="py-1 px-2 border-r border-slate-200">Débito</th>
                    <th class="py-1 px-2 border-r border-slate-200">Crédito</th>
                    <th class="py-1 px-2 border-r border-slate-200">Deudor</th>
                    <th class="py-1 px-2 border-r border-slate-200">Acreedor</th>
                    <th class="py-1 px-2 border-r border-slate-200">Activo</th>
                    <th class="py-1 px-2 border-r border-slate-200">Pasivo</th>
                    <th class="py-1 px-2 border-r border-slate-200">Pérdida</th>
                    <th class="py-1 px-2">Ganancia</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-xs">
                ${rows}
            </tbody>
            ${footer}
        </table>
    </div>

    </div>
    `;
  };

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
                            <td class="py-3 px-4 text-gray-600">${UI.h(doc ? (doc.date_centralize || journal.date) : journal.date)}</td>

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
            <div>
                <a href="${UI.h(UI.route('reports.journal_context'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
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
                            <input type="date" name="date_from" class="w-1/2 text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value="${UI.h(query.date_from || '')}">
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

  window.Views.journalDetail = function (ctx) {
    const journal = Store.journal(ctx.params.id) || {};
    const doc = journal.document || null;
    const glosaFinal = journal.description || journal.glosa || (doc ? (doc.description || doc.glosa || doc.obs) : '') || '';
    const glosaBlock = glosaFinal
      ? `
                    <div class="mt-2.5 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-medium">
                        <span class="font-bold uppercase tracking-wider text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Glosa</span>
                        <span>${UI.h(glosaFinal)}</span>
                    </div>`
      : '';
    const entityBlock = doc && doc.entity
      ? `
                <div class="pt-3 border-t border-gray-100">
                    <span class="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Entidad Asociada</span>
                    <span class="text-gray-800 font-medium">${UI.h(doc.entity.name)} (RUT: ${UI.h(doc.entity.rut)})</span>
                </div>`
      : '';
    const entries = (journal.entries || []).map(function (entry) {
      return `
                            <tr class="hover:bg-gray-50/80 transition">
                                <td class="py-2.5 px-4 font-mono font-bold text-gray-700">${UI.h(entry.account_code)}</td>
                                <td class="py-2.5 px-4 text-gray-900">${UI.h(entry.account && entry.account.name ? entry.account.name : 'Cuenta Sin Nombre')}</td>
                                <td class="py-2.5 px-4">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                                        ${UI.h(capitalize(entry.component_name))}
                                    </span>
                                </td>
                                <td class="py-2.5 px-4 text-right font-mono text-gray-800">${format0OrDash(entry.debit)}</td>
                                <td class="py-2.5 px-4 text-right font-mono text-gray-800">${format0OrDash(entry.credit)}</td>
                            </tr>`;
    }).join('');

    return `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">Comprobante de Asiento Contable</h1>
                <p class="text-xs text-gray-500 mt-1">
                    Asiento N°: <span class="font-bold text-indigo-600">${UI.h(journal.entry_number)}</span>
                    <span class="mx-1 text-gray-300">|</span>
                    Año: <span class="font-bold text-gray-800">${UI.h(journal.year)}</span>
                </p>
                ${glosaBlock}
            </div>

            <div class="flex items-center gap-2">
                <a href="${UI.h(UI.route('accounting.system_journals'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Volver al Listado
                </a>

                <form data-action="journals.delete-with-document">
                    <input type="hidden" name="id" value="${UI.h(journal.id)}">
                    <input type="hidden" name="journal" value="${UI.h(journal.id)}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" data-confirm="${UI.h('¿Estás seguro de eliminar este asiento y su documento asociado?')}" class="inline-flex items-center text-xs font-semibold bg-red-600 text-white px-3.5 py-2 rounded-lg shadow-sm hover:bg-red-700 transition">
                        Eliminar Asiento
                    </button>
                </form>
            </div>
        </div>

        <div class="bg-white shadow-sm border border-gray-200 rounded-xl p-5 mb-6 text-xs space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <span class="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Fecha del Asiento</span>
                    <span class="text-gray-800 font-medium text-sm">${UI.h(journal.date)}</span>
                </div>
                <div>
                    <span class="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Tipo de Origen</span>
                    <span class="text-gray-800 font-medium">${UI.h(journal.vc_document_id ? 'Documento V/C (ID: ' + journal.vc_document_id + ')' : 'Asiento Manual / Pago')}</span>
                </div>
                <div>
                    <span class="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Estado</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${journal.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${UI.h(journal.is_balanced ? '● Cuadrado' : '● Descuadrado')}</span>
                </div>
            </div>
            ${entityBlock}
        </div>

        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-gray-800 text-white uppercase tracking-wider text-[11px]">
                            <th class="py-3 px-4 w-36">Código Cuenta</th>
                            <th class="py-3 px-4">Nombre de la Cuenta</th>
                            <th class="py-3 px-4 w-32">Componente</th>
                            <th class="py-3 px-4 text-right w-32">Debe</th>
                            <th class="py-3 px-4 text-right w-32">Haber</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${entries}
                    </tbody>
                    <tfoot>
                        <tr class="bg-gray-50 border-t border-gray-200 font-bold font-mono text-xs text-gray-800">
                            <td colspan="3" class="py-3 px-4 text-right uppercase font-sans text-[11px]">Totales:</td>
                            <td class="py-3 px-4 text-right text-indigo-600">${format0(journal.total_debit)}</td>
                            <td class="py-3 px-4 text-right text-indigo-600">${format0(journal.total_credit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

    </div>
    `;
  };

  window.Views.editJournal = function (ctx) {
    const journal = Store.journal(ctx.params.id) || {};
    const owner = journal.owner || Store.activeOwner();
    const accounts = owner ? Store.accounts(owner.id) : Store.activeOwnerAccounts();
    const oldValues = UI.old() || {};
    const oldEntries = Array.isArray(oldValues.entries) ? oldValues.entries : [];
    const entries = journal.entries || [];
    const editableEntries = entries.filter(function (entry) { return entry.component_name !== 'total'; });
    const devengoEntry = entries.find(function (entry) { return entry.component_name === 'total'; }) || null;
    const doc = journal.document || null;

    function entryValue(entry, index, field) {
      if (oldEntries[index] && oldEntries[index][field] !== undefined && oldEntries[index][field] !== null && oldEntries[index][field] !== '') {
        return oldEntries[index][field];
      }
      return entry[field];
    }

    const editableRows = editableEntries.map(function (entry, index) {
      const componentName = entryValue(entry, index, 'component_name') || 'custom';
      const accountCode = entryValue(entry, index, 'account_code');
      return `
                            <tr class="entry-row bg-white">
                                <td class="py-3 px-4">
                                    <input type="hidden" name="entries[${UI.h(index)}][component_name]" value="${UI.h(componentName)}">
                                    <select name="entries[${UI.h(index)}][account_code]" class="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                        ${accountOptions(accounts, accountCode)}
                                    </select>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[${UI.h(index)}][debit]" value="${UI.h(entryValue(entry, index, 'debit'))}" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[${UI.h(index)}][credit]" value="${UI.h(entryValue(entry, index, 'credit'))}" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-bold text-sm px-2" title="Eliminar fila">&times;</button>
                                </td>
                            </tr>`;
    }).join('');

    const devengoRow = devengoEntry
      ? `
                            <tr class="entry-row bg-gray-100/90 font-semibold" data-fixed="true">
                                <td class="py-3 px-4">
                                    <input type="hidden" name="entries[devengo][component_name]" value="total">
                                    <input type="hidden" name="entries[devengo][account_code]" value="${UI.h(devengoEntry.account_code)}">
                                    <div class="font-mono text-gray-700">${UI.h(devengoEntry.account_code)} - ${UI.h(devengoEntry.account && devengoEntry.account.name ? devengoEntry.account.name : '')}</div>
                                    <span class="text-[10px] text-amber-600 font-semibold">(Devengo - Fijo y no modificable)</span>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[devengo][debit]" value="${UI.h(devengoEntry.debit)}" class="debit-input w-full text-right text-xs bg-gray-100 text-gray-500 border-gray-300 rounded-md shadow-sm cursor-not-allowed" readonly required>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[devengo][credit]" value="${UI.h(devengoEntry.credit)}" class="credit-input w-full text-right text-xs bg-gray-100 text-gray-500 border-gray-300 rounded-md shadow-sm cursor-not-allowed" readonly required>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span class="text-gray-400 text-xs">—</span>
                                </td>
                            </tr>`
      : '';

    const initialDebit = entries.reduce(function (sum, entry) { return sum + num(entry.debit); }, 0);
    const initialCredit = entries.reduce(function (sum, entry) { return sum + num(entry.credit); }, 0);
    const isBalanced = Math.round(initialDebit * 100) === Math.round(initialCredit * 100) && initialDebit > 0;

    return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-gray-200 rounded-xl p-5 shadow-sm gap-4">
            <div>
                <h1 class="text-xl font-bold text-gray-800 tracking-tight">Editar Asiento Contable N° <span class="text-indigo-600">${UI.h(journal.entry_number)}</span></h1>
                <div class="text-xs text-gray-600 mt-1.5 space-y-1">
                    <p>
                        Periodo año: <span class="font-bold text-gray-800">${UI.h(journal.year)}</span> |
                        Tipo Doc: <span class="font-semibold text-gray-800">${UI.h(docTypeName(doc))}</span> |
                        Folio:
                        ${doc ? `<a href="${UI.h(UI.route('accounting.documents.detail', doc.id))}" target="_blank" class="font-bold text-indigo-600 hover:underline inline-flex items-center" title="Ver detalle del documento en nueva pestaña">${UI.h(doc.folio)} &nearr;</a>` : '<span class="font-bold text-gray-800">N/A</span>'}
                    </p>
                    <p>
                        Entidad: <span class="font-bold font-mono text-gray-800">${UI.h(doc && doc.entity ? doc.entity.rut : 'Sin RUT')}</span> — <span class="font-semibold text-gray-800">${UI.h(doc && doc.entity ? doc.entity.name : 'Sin Nombre')}</span>
                    </p>
                </div>
            </div>
            <div>
                <a href="${UI.h(UI.route('accounting.system_journals'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <form data-action="journals.update" class="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <input type="hidden" name="id" value="${UI.h(journal.id)}">
            <input type="hidden" name="journal" value="${UI.h(journal.id)}">
            <input type="hidden" name="_method" value="PUT">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Fecha del Asiento</label>
                    <input type="date" name="date" value="${UI.h(oldValue(oldValues, 'date', journal.date))}" class="w-full text-xs border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Glosa / Descripción</label>
                    <input type="text" name="description" value="${UI.h(oldValue(oldValues, 'description', journal.description))}" class="w-full text-xs border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>

            <div class="flex justify-between items-center mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Líneas del Asiento Contable</h3>
                <button type="button" id="addRowBtn" class="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition shadow-sm">
                    + Agregar Cuenta
                </button>
            </div>

            <div class="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-gray-800 text-white uppercase tracking-wider text-[11px]">
                            <th class="py-2.5 px-4">Cuenta Contable</th>
                            <th class="py-2.5 px-4 w-32 text-right">Debe</th>
                            <th class="py-2.5 px-4 w-32 text-right">Haber</th>
                            <th class="py-2.5 px-4 w-12 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="entriesTableBody" class="divide-y divide-gray-100">
                        ${editableRows}
                        ${devengoRow}
                    </tbody>
                    <tfoot>
                        <tr class="bg-gray-50 font-mono text-xs border-t border-gray-200">
                            <td class="py-3 px-4 text-right font-bold text-gray-700 font-sans">
                                <div class="flex items-center justify-end space-x-2">
                                    <span id="balanceIndicatorDot" class="h-3 w-3 rounded-full ${isBalanced ? 'bg-green-500' : 'bg-red-500'} inline-block"></span>
                                    <span id="balanceIndicatorText" class="text-[11px] font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'} uppercase">${isBalanced ? 'Cuadrado' : 'Descuadrado'}</span>
                                    <span class="ml-2">Totales Provisorios:</span>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-right font-bold text-indigo-600" id="sumDebit">${UI.h(UI.number(initialDebit))}</td>
                            <td class="py-3 px-4 text-right font-bold text-indigo-600" id="sumCredit">${UI.h(UI.number(initialCredit))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="flex justify-end gap-3">
                <a href="${UI.h(UI.route('accounting.system_journals'))}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                    Cancelar
                </a>
                <button type="submit" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-700 transition">
                    Actualizar Asiento
                </button>
            </div>
        </form>

    </div>

    <select id="masterAccountSelect" class="hidden">
        <option value="">-- Seleccione una cuenta --</option>
        ${accountOptions(accounts, '')}
    </select>

    <script>
    (function () {
      var addRowBtn = document.getElementById('addRowBtn');
      var tbody = document.getElementById('entriesTableBody');
      var masterSelect = document.getElementById('masterAccountSelect');
      if (!addRowBtn || !tbody || !masterSelect) { return; }

      addRowBtn.addEventListener('click', function () {
        var fixedRow = tbody.querySelector('tr[data-fixed="true"]');
        var newIndex = 'custom_' + Date.now();
        var newTr = document.createElement('tr');
        newTr.className = 'entry-row bg-white';
        newTr.innerHTML = [
          '<td class="py-3 px-4">',
          '<input type="hidden" name="entries[' + newIndex + '][component_name]" value="custom">',
          '<select name="entries[' + newIndex + '][account_code]" class="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 new-account-select" required></select>',
          '</td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" name="entries[' + newIndex + '][debit]" value="0" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" name="entries[' + newIndex + '][credit]" value="0" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-center"><button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-bold text-sm px-2" title="Eliminar fila">&times;</button></td>'
        ].join('');
        tbody.insertBefore(newTr, fixedRow || null);
        newTr.querySelector('.new-account-select').innerHTML = masterSelect.innerHTML;
        attachEvents();
        calculateTotals();
      });

      function attachEvents() {
        Array.prototype.forEach.call(document.querySelectorAll('.remove-row-btn'), function (btn) {
          btn.onclick = function () {
            var row = this.closest('tr');
            if (!row.dataset.fixed) {
              row.remove();
              calculateTotals();
            }
          };
        });
        Array.prototype.forEach.call(document.querySelectorAll('.debit-input, .credit-input'), function (input) {
          input.oninput = calculateTotals;
        });
      }

      function calculateTotals() {
        var totalDebit = 0;
        var totalCredit = 0;
        Array.prototype.forEach.call(document.querySelectorAll('.debit-input'), function (input) { totalDebit += parseFloat(input.value) || 0; });
        Array.prototype.forEach.call(document.querySelectorAll('.credit-input'), function (input) { totalCredit += parseFloat(input.value) || 0; });
        document.getElementById('sumDebit').innerText = totalDebit.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        document.getElementById('sumCredit').innerText = totalCredit.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        var dot = document.getElementById('balanceIndicatorDot');
        var text = document.getElementById('balanceIndicatorText');
        if (Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0) {
          dot.className = 'h-3 w-3 rounded-full bg-green-500 inline-block';
          text.className = 'text-[11px] font-bold text-green-600 uppercase';
          text.innerText = 'Cuadrado';
        } else {
          dot.className = 'h-3 w-3 rounded-full bg-red-500 inline-block';
          text.className = 'text-[11px] font-bold text-red-600 uppercase';
          text.innerText = 'Descuadrado';
        }
      }

      attachEvents();
      calculateTotals();
    })();
    </script>
    `;
  };

  window.Views.editManualJournal = function (ctx) {
    const journal = Store.journal(ctx.params.id) || {};
    const owner = journal.owner || Store.activeOwner();
    const accounts = owner ? Store.accounts(owner.id) : Store.activeOwnerAccounts();
    const oldValues = UI.old() || {};
    const oldEntries = Array.isArray(oldValues.entries) ? oldValues.entries : [];
    const entries = journal.entries || [];
    const month = journal.month !== undefined && journal.month !== null && journal.month !== '' ? journal.month : String(journal.date || '').slice(5, 7);

    function entryValue(entry, index, field) {
      if (oldEntries[index] && oldEntries[index][field] !== undefined && oldEntries[index][field] !== null && oldEntries[index][field] !== '') {
        return oldEntries[index][field];
      }
      return entry[field];
    }

    const editableRows = entries.map(function (entry, index) {
      const accountCode = entryValue(entry, index, 'account_code');
      return `
                            <tr class="entry-row bg-white">
                                <td class="py-3 px-4">
                                    <input type="hidden" name="entries[${UI.h(index)}][component_name]" value="manual">
                                    <select name="entries[${UI.h(index)}][account_code]" class="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                        ${accountOptions(accounts, accountCode)}
                                    </select>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[${UI.h(index)}][debit]" value="${UI.h(entryValue(entry, index, 'debit'))}" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" name="entries[${UI.h(index)}][credit]" value="${UI.h(entryValue(entry, index, 'credit'))}" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-bold text-sm px-2" title="Eliminar fila">&times;</button>
                                </td>
                            </tr>`;
    }).join('');

    const initialDebit = entries.reduce(function (sum, entry) { return sum + num(entry.debit); }, 0);
    const initialCredit = entries.reduce(function (sum, entry) { return sum + num(entry.credit); }, 0);
    const isBalanced = Math.round(initialDebit * 100) === Math.round(initialCredit * 100) && initialDebit > 0;

    return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="mb-6 flex justify-between items-center bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div>
                <h1 class="text-xl font-bold text-gray-800 tracking-tight">Editar Asiento Manual N° <span class="text-indigo-600">${UI.h(journal.entry_number)}</span></h1>
                <p class="text-xs text-gray-500 mt-1">
                    Periodo año: <span class="font-bold text-gray-800">${UI.h(journal.year)}</span> | Tipo: <span class="font-semibold text-gray-800">Asiento Manual Libre</span>
                </p>
            </div>
            <a href="${UI.h(UI.route('accounting.system_journals'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition">
                &larr; Volver
            </a>
        </div>

        <form data-action="manualJournal.update" class="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            <input type="hidden" name="id" value="${UI.h(journal.id)}">
            <input type="hidden" name="journal" value="${UI.h(journal.id)}">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="year" value="${UI.h(journal.year)}">
            <input type="hidden" name="month" value="${UI.h(month)}">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Fecha del Asiento</label>
                    <input type="date" name="date" value="${UI.h(oldValue(oldValues, 'date', journal.date))}" class="w-full text-xs border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Glosa / Descripción</label>
                    <input type="text" name="description" value="${UI.h(oldValue(oldValues, 'description', journal.description))}" class="w-full text-xs border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>

            <div class="flex justify-between items-center mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Líneas del Asiento</h3>
                <button type="button" id="addRowBtn" class="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition shadow-sm">
                    + Agregar Cuenta
                </button>
            </div>

            <div class="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-gray-800 text-white uppercase tracking-wider text-[11px]">
                            <th class="py-2.5 px-4">Cuenta Contable</th>
                            <th class="py-2.5 px-4 w-32 text-right">Debe</th>
                            <th class="py-2.5 px-4 w-32 text-right">Haber</th>
                            <th class="py-2.5 px-4 w-12 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="entriesTableBody" class="divide-y divide-gray-100">
                        ${editableRows}
                    </tbody>
                    <tfoot>
                        <tr class="bg-gray-50 font-mono text-xs border-t border-gray-200">
                            <td class="py-3 px-4 text-right font-bold text-gray-700 font-sans">
                                <div class="flex items-center justify-end space-x-2">
                                    <span id="balanceIndicatorDot" class="h-3 w-3 rounded-full ${isBalanced ? 'bg-green-500' : 'bg-red-500'} inline-block"></span>
                                    <span id="balanceIndicatorText" class="text-[11px] font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'} uppercase">${isBalanced ? 'Cuadrado' : 'Descuadrado'}</span>
                                    <span class="ml-2">Totales Provisorios:</span>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-right font-bold text-indigo-600" id="sumDebit">${UI.h(UI.number(initialDebit))}</td>
                            <td class="py-3 px-4 text-right font-bold text-indigo-600" id="sumCredit">${UI.h(UI.number(initialCredit))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="flex justify-end gap-3">
                <a href="${UI.h(UI.route('accounting.system_journals'))}" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                    Cancelar
                </a>
                <button type="submit" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-700 transition">
                    Actualizar Asiento Manual
                </button>
            </div>
        </form>

    </div>

    <select id="masterAccountSelect" class="hidden">
        <option value="">-- Seleccione una cuenta --</option>
        ${accountOptions(accounts, '')}
    </select>

    <script>
    (function () {
      var addRowBtn = document.getElementById('addRowBtn');
      var tbody = document.getElementById('entriesTableBody');
      var masterSelect = document.getElementById('masterAccountSelect');
      if (!addRowBtn || !tbody || !masterSelect) { return; }

      addRowBtn.addEventListener('click', function () {
        var newIndex = 'custom_' + Date.now();
        var newTr = document.createElement('tr');
        newTr.className = 'entry-row bg-white';
        newTr.innerHTML = [
          '<td class="py-3 px-4">',
          '<input type="hidden" name="entries[' + newIndex + '][component_name]" value="manual">',
          '<select name="entries[' + newIndex + '][account_code]" class="w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 new-account-select" required></select>',
          '</td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" name="entries[' + newIndex + '][debit]" value="0" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" name="entries[' + newIndex + '][credit]" value="0" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-center"><button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-bold text-sm px-2" title="Eliminar fila">&times;</button></td>'
        ].join('');
        tbody.appendChild(newTr);
        newTr.querySelector('.new-account-select').innerHTML = masterSelect.innerHTML;
        attachEvents();
        calculateTotals();
      });

      function attachEvents() {
        Array.prototype.forEach.call(document.querySelectorAll('.remove-row-btn'), function (btn) {
          btn.onclick = function () {
            var row = this.closest('tr');
            if (document.querySelectorAll('.entry-row').length > 2) {
              row.remove();
              calculateTotals();
            } else {
              window.alert('El asiento contable debe tener al menos dos líneas.');
            }
          };
        });
        Array.prototype.forEach.call(document.querySelectorAll('.debit-input, .credit-input'), function (input) {
          input.oninput = calculateTotals;
        });
      }

      function calculateTotals() {
        var totalDebit = 0;
        var totalCredit = 0;
        Array.prototype.forEach.call(document.querySelectorAll('.debit-input'), function (input) { totalDebit += parseFloat(input.value) || 0; });
        Array.prototype.forEach.call(document.querySelectorAll('.credit-input'), function (input) { totalCredit += parseFloat(input.value) || 0; });
        document.getElementById('sumDebit').innerText = totalDebit.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        document.getElementById('sumCredit').innerText = totalCredit.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        var dot = document.getElementById('balanceIndicatorDot');
        var text = document.getElementById('balanceIndicatorText');
        if (Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0) {
          dot.className = 'h-3 w-3 rounded-full bg-green-500 inline-block';
          text.className = 'text-[11px] font-bold text-green-600 uppercase';
          text.innerText = 'Cuadrado';
        } else {
          dot.className = 'h-3 w-3 rounded-full bg-red-500 inline-block';
          text.className = 'text-[11px] font-bold text-red-600 uppercase';
          text.innerText = 'Descuadrado';
        }
      }

      attachEvents();
      calculateTotals();
    })();
    </script>
    `;
  };

  window.Views.manualJournalCreate = function (ctx) {
    const owner = Store.activeOwner();
    const workingYear = Store.workingYear();
    const oldValues = UI.old() || {};
    const templates = Store.journalTemplates() || {};
    const accounts = Store.activeOwnerAccounts();
    const oldEntries = Array.isArray(oldValues.entries) ? oldValues.entries : [];
    const date = oldValue(oldValues, 'date', UI.today());
    const month = Number(oldValue(oldValues, 'month', Number(UI.today().slice(5, 7))));
    const year = oldValue(oldValues, 'year', workingYear);
    const glosa = oldValue(oldValues, 'glosa', '');

    const accountsMap = {};
    accounts.forEach(function (acc) { accountsMap[acc.code] = acc.name; });

    let monthOptions = '';
    for (let value = 1; value <= 12; value++) {
      monthOptions += `<option value="${UI.h(value)}"${value === month ? ' selected' : ''}>${UI.h(value)}</option>`;
    }

    const templateButtons = Object.keys(templates).map(function (key) {
      const template = templates[key] || {};
      const label = template.name || template.title || capitalize(String(key).replace(/_/g, ' '));
      return `<button type="button" data-template="${UI.h(key)}" class="text-xs bg-white border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded font-semibold hover:bg-indigo-600 hover:text-white transition shadow-sm">+ ${UI.h(label)}</button>`;
    }).join('');

    const datalistOptions = accounts.map(function (acc) {
      return `<option value="${UI.h(acc.code)}">${UI.h(acc.name)}</option>`;
    }).join('');

    const ownerLabel = owner
      ? `${UI.h(owner.name)} <span class="text-slate-500 font-normal">(${UI.h(owner.rut)})</span>`
      : '<span class="text-amber-600 font-medium">Ningún owner seleccionado</span>';

    return `
    <div class="bg-white text-black font-sans p-6 max-w-4xl mx-auto">

    <div class="flex justify-between items-baseline pb-3 mb-6 border-b border-gray-300">
        <div>
            <h1 class="text-base font-bold uppercase tracking-wider">Nuevo Asiento Contable Manual</h1>
            <p class="text-xs text-gray-600 font-mono mt-0.5">Registro de comprobante directo</p>
        </div>
        <div>
            <a href="${UI.h(UI.route('ingress.manual'))}" class="text-xs font-medium text-black border border-gray-300 px-2.5 py-1 rounded">&larr; Volver</a>
        </div>
    </div>

    <div class="mb-6 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
        <div class="text-left flex items-center space-x-3">
            <div class="p-2 bg-indigo-600 text-white rounded-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 block">Owner Activo</span>
                <span class="text-sm font-bold text-slate-800">${ownerLabel}</span>
            </div>
        </div>
        <div>
            <a href="${UI.h(UI.route('owners.index'))}" class="text-xs font-medium bg-white text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition shadow-sm">Cambiar</a>
        </div>
    </div>

    <div class="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded">
        <h2 class="text-xs font-bold uppercase text-indigo-900 mb-2">Asientos Prefabricados (Plantillas Rápidas)</h2>
        <div class="flex flex-wrap gap-2">
            ${templateButtons}
        </div>
    </div>

    <form data-action="manualJournal.store">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <div>
                <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Fecha</label>
                <input type="date" name="date" value="${UI.h(date)}" class="w-full text-xs p-2 border border-gray-300 bg-white" required>
            </div>
            <div>
                <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Mes</label>
                <select name="month" class="w-full text-xs p-2 border border-gray-300 bg-white" required>${monthOptions}</select>
            </div>
            <div>
                <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Año</label>
                <input type="number" name="year" value="${UI.h(year)}" class="w-full text-xs p-2 border border-gray-300 bg-white" required>
            </div>
            <div class="sm:col-span-4">
                <label class="block text-xs font-bold uppercase text-gray-700 mb-1">Glosa / Descripción General</label>
                <input type="text" id="glosa-input" name="glosa" value="${UI.h(glosa)}" placeholder="Ej: Registro de provisión de sueldos mes de agosto" class="w-full text-xs p-2 border border-gray-300 bg-white" required>
            </div>
        </div>

        <h2 class="text-xs font-bold uppercase tracking-wider mb-2 text-gray-700">Detalle de Cuentas</h2>

        <table class="w-full text-left border-collapse text-xs mb-4" id="entries-table">
            <thead>
                <tr class="border-b-2 border-black text-[11px] font-bold uppercase text-gray-700">
                    <th class="py-2 px-2">Cuenta Contable</th>
                    <th class="py-2 px-2 text-right w-36">Debe</th>
                    <th class="py-2 px-2 text-right w-36">Haber</th>
                    <th class="py-2 px-2 text-center w-12">Acción</th>
                </tr>
            </thead>
            <tbody id="entries-body" class="font-mono text-[11px] divide-y divide-gray-200"></tbody>
            <tfoot>
                <tr class="border-t-2 border-black font-bold font-mono text-[11px]">
                    <td class="py-2 px-2 text-right uppercase font-sans">TOTALES:</td>
                    <td class="py-2 px-2 text-right" id="total-debit">0</td>
                    <td class="py-2 px-2 text-right" id="total-credit">0</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>

        <div class="flex justify-between items-center mb-6">
            <button type="button" onclick="addRow()" class="text-xs bg-gray-100 border border-gray-300 px-3 py-1.5 font-semibold text-black hover:bg-gray-200">+ Agregar línea</button>
            <button type="submit" class="text-xs bg-black text-white px-4 py-2 font-bold uppercase tracking-wider">Guardar Asiento</button>
        </div>

        <datalist id="accounts_list">${datalistOptions}</datalist>
    </form>

    <script>
    (function () {
      var templatesData = ${UI.json(templates)};
      var accountsMap = ${UI.json(accountsMap)};
      var oldEntries = ${UI.json(oldEntries)};
      var rowIndex = 0;
      var tbody = document.getElementById('entries-body');

      function textOf(value) {
        return value === undefined || value === null ? '' : String(value);
      }

      function addRow(account, debit, credit) {
        var code = textOf(account);
        var initialName = accountsMap[code] || 'Seleccione o escriba cuenta';
        var row = document.createElement('tr');
        row.innerHTML = [
          '<td class="py-2 px-2">',
          '<div class="flex items-center space-x-2">',
          '<input type="text" name="entries[' + rowIndex + '][account_code]" value="' + code + '" list="accounts_list" placeholder="Código" class="w-28 text-xs p-1.5 border border-gray-300 font-sans account-input" oninput="updateAccountName(this)" required autocomplete="off">',
          '<span class="text-gray-600 text-[11px] font-sans truncate account-name-label" style="max-width: 220px;">' + initialName + '</span>',
          '</div></td>',
          '<td class="py-2 px-2 text-right"><input type="number" step="any" name="entries[' + rowIndex + '][debit]" value="' + textOf(debit) + '" class="w-full text-xs p-1.5 border border-gray-300 text-right debit-input" oninput="calculateTotals()" required></td>',
          '<td class="py-2 px-2 text-right"><input type="number" step="any" name="entries[' + rowIndex + '][credit]" value="' + textOf(credit) + '" class="w-full text-xs p-1.5 border border-gray-300 text-right credit-input" oninput="calculateTotals()" required></td>',
          '<td class="py-2 px-2 text-center"><button type="button" onclick="removeRow(this)" class="text-red-600 font-bold px-2 py-1">&times;</button></td>'
        ].join('');
        tbody.appendChild(row);
        rowIndex++;
        calculateTotals();
      }

      function updateAccountName(input) {
        var code = input.value.trim();
        var label = input.closest('td').querySelector('.account-name-label');
        if (accountsMap[code]) {
          label.innerText = accountsMap[code];
          label.classList.remove('text-gray-400', 'italic');
          label.classList.add('text-gray-800', 'font-medium');
        } else {
          label.innerText = 'Cuenta no encontrada';
          label.classList.remove('text-gray-800', 'font-medium');
          label.classList.add('text-gray-400', 'italic');
        }
      }

      function removeRow(btn) {
        var row = btn.closest('tr');
        if (document.querySelectorAll('#entries-body tr').length > 2) {
          row.remove();
          calculateTotals();
        } else {
          window.alert('El asiento debe tener al menos dos líneas.');
        }
      }

      function calculateTotals() {
        var totalDebit = 0;
        var totalCredit = 0;
        Array.prototype.forEach.call(document.querySelectorAll('.debit-input'), function (input) { totalDebit += parseFloat(input.value) || 0; });
        Array.prototype.forEach.call(document.querySelectorAll('.credit-input'), function (input) { totalCredit += parseFloat(input.value) || 0; });
        document.getElementById('total-debit').innerText = totalDebit.toLocaleString('es-CL');
        document.getElementById('total-credit').innerText = totalCredit.toLocaleString('es-CL');
      }

      function loadTemplate(templateKey) {
        var template = templatesData[templateKey];
        if (!template) { return; }
        var amountInput = window.prompt('Ingrese el monto para la transacción (' + (template.name || templateKey) + '):');
        if (amountInput === null) { return; }
        var amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
          window.alert('Por favor, ingrese un monto válido mayor a 0.');
          return;
        }
        document.getElementById('glosa-input').value = template.glosa || '';
        tbody.innerHTML = '';
        rowIndex = 0;
        Store.journalTemplateEntries(templateKey, amount).forEach(function (entry) {
          addRow(entry.account_code, entry.debit, entry.credit);
        });
        calculateTotals();
      }

      window.addRow = addRow;
      window.removeRow = removeRow;
      window.updateAccountName = updateAccountName;
      window.loadTemplate = loadTemplate;
      Array.prototype.forEach.call(document.querySelectorAll('[data-template]'), function (button) {
        button.addEventListener('click', function () { loadTemplate(button.getAttribute('data-template')); });
      });

      if (oldEntries.length > 0) {
        oldEntries.forEach(function (entry) { addRow(entry.account_code || '', entry.debit || 0, entry.credit || 0); });
      } else {
        addRow('', 0, 0);
        addRow('', 0, 0);
      }
      calculateTotals();
    })();
    </script>

    </div>
    `;
  };

  window.Views.auditIndex = function (ctx) {
    const owner = Store.activeOwner();
    const workingYear = Store.workingYear();
    const options = { year: workingYear };
    if (owner) options.owner_id = owner.id;
    const journals = Store.journals(options) || [];

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
                <p class="text-sm text-slate-500 mt-1">Periodo: <span class="font-bold text-slate-700">${UI.h(workingYear)}</span> | Owner: <span class="font-bold text-slate-700">${UI.h(owner ? owner.name : 'N/A')}</span></p>
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

  window.Views.paymentsIndex = function (ctx) {
    const owner = Store.activeOwner();
    const pendingDocuments = Store.pendingBalanceDocuments() || [];
    const accounts = Store.activeOwnerAccounts();
    const accountOptionsHtml = accounts.map(function (acc) {
      return `<option value="${UI.h(acc.code)}">${UI.h(acc.code)} - ${UI.h(acc.name)}</option>`;
    }).join('');

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
                                    <select name="bank_account_code" class="text-xs border border-slate-300 rounded px-2 py-1 bg-white">${accountOptionsHtml}</select>
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
                <p class="text-sm text-slate-500 mt-1">Owner: <span class="font-bold text-slate-700">${UI.h(owner ? owner.name : 'N/A')}</span></p>
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
    `;
  };

  window.Views.documentQueryResults = function (ctx) {
    const query = ctx.query || {};
    const typeVc = query.type_vc === undefined || query.type_vc === '' ? 'V' : query.type_vc;
    const month = queryMonth(query);
    const year = queryYear(query);
    const documents = Store.queryDocuments(typeVc, month, year) || [];
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

  window.Views.documentDetail = function (ctx) {
    const document = Store.document(ctx.params.id) || {};
    const docType = document.documentType || {};
    const docTypeDescription = docType.name || docType.description || 'Sin nombre registrado';

    return `
    <div class="bg-white text-slate-900 font-sans p-8 max-w-3xl mx-auto">

    <div class="flex justify-between items-baseline border-b border-slate-300 pb-4 mb-6">
        <div>
            <h1 class="text-xl font-semibold tracking-tight">Detalle del Documento</h1>
            <p class="text-xs text-slate-500">Folio N°: <span class="font-bold text-slate-800">${UI.h(document.folio)}</span></p>
        </div>
        <div>
            <a href="javascript:history.back()" class="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">&larr; Volver</a>
        </div>
    </div>

    <div class="space-y-6 text-xs">

        <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 class="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-3">1. Información de Registro</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div>
                    <span class="block text-slate-400 font-sans">Tipo (V/C)</span>
                    <span class="font-bold text-slate-800 text-sm">${UI.h(document.type_vc)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Mes / Año</span>
                    <span class="font-bold text-slate-800 text-sm">${UI.h(document.month_register)} / ${UI.h(document.year_register)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Fecha Doc.</span>
                    <span class="font-bold text-slate-800 text-sm">${UI.h(document.date)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Contabilizado</span>
                    <span class="font-bold ${document.journal ? 'text-green-600' : 'text-amber-600'} text-sm">${UI.h(document.journal ? 'Sí' : 'Pendiente')}</span>
                </div>
            </div>
        </div>

        <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 class="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-3">2. Entidad y Tipo de Documento</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <span class="block text-slate-400 font-sans">RUT / Entidad</span>
                    <span class="font-bold text-slate-800 text-sm font-mono">${UI.h(document.entity ? document.entity.rut : 'N/A')}</span>
                    <p class="text-slate-600">${UI.h(document.entity ? document.entity.name : 'Sin nombre registrado')}</p>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Tipo de Documento (Doctype)</span>
                    <span class="font-bold text-slate-800 text-sm font-mono">${UI.h(document.document_type_id === undefined || document.document_type_id === null || document.document_type_id === '' ? 'N/A' : document.document_type_id)}</span>
                    <p class="text-slate-600">${UI.h(docTypeDescription)}</p>
                </div>
            </div>
        </div>

        <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 class="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-3">3. Referencias</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div>
                    <span class="block text-slate-400 font-sans">RUT Ref</span>
                    <span class="text-slate-800">${UI.h(document.rut_ref || '-')}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Folio Ref</span>
                    <span class="text-slate-800">${UI.h(document.folio_ref || '-')}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Tipo Doc Ref</span>
                    <span class="text-slate-800">${UI.h(document.td_ref || '-')}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">F. Centralización</span>
                    <span class="text-slate-800">${UI.h(document.date_centralize || '-')}</span>
                </div>
            </div>
        </div>

        <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 class="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-3">4. Desglose de Montos</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div>
                    <span class="block text-slate-400 font-sans">Neto</span>
                    <span class="text-slate-800">${format0(document.net)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Exento</span>
                    <span class="text-slate-800">${format0(document.exempt)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">IVA Recuperable</span>
                    <span class="text-slate-800">${format0(document.vat_rec)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">IVA No Recup.</span>
                    <span class="text-slate-800">${format0(document.vat_no_rec)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Otros Imp. (+)</span>
                    <span class="text-slate-800">${format0(document.plus_oth_tax)}</span>
                </div>
                <div>
                    <span class="block text-slate-400 font-sans">Otros Imp. (-)</span>
                    <span class="text-slate-800">${format0(document.minus_oth_tax)}</span>
                </div>
                <div class="col-span-2 border-t pt-2 border-slate-200">
                    <span class="block text-slate-400 font-sans font-bold">TOTAL</span>
                    <span class="font-extrabold text-slate-900 text-sm">${format0(document.total)}</span>
                </div>
            </div>
        </div>

    </div>

    </div>
    `;
  };

  window.Views.ledgerResults = function (ctx) {
    const query = ctx.query || {};
    const accountCode = query.account_code === undefined || query.account_code === null ? '' : query.account_code;
    const month = queryMonth(query);
    const year = queryYear(query);
    const journals = Store.ledger(accountCode, month, year) || [];
    let saldo = 0;
    let totalDebe = 0;
    let totalHaber = 0;
    const entryRows = [];

    journals.forEach(function (journal) {
      (journal.entries || []).forEach(function (entry) {
        if (String(entry.account_code) !== String(accountCode)) return;
        const debe = num(entry.debit);
        const haber = num(entry.credit);
        saldo += debe - haber;
        totalDebe += debe;
        totalHaber += haber;
        entryRows.push(`
                        <tr>
                            <td class="py-2 px-3 text-gray-600 font-sans whitespace-nowrap">${UI.h(journal.date)}</td>
                            <td class="py-2 px-3 font-bold">${UI.h(journal.id)}</td>
                            <td class="py-2 px-3 text-gray-800 font-sans">${UI.h(journal.document && journal.document.entity ? journal.document.entity.name : 'Asiento contable N° ' + journal.id)}</td>
                            <td class="py-2 px-3 text-right">${debe > 0 ? format0(debe) : '-'}</td>
                            <td class="py-2 px-3 text-right">${haber > 0 ? format0(haber) : '-'}</td>
                            <td class="py-2 px-3 text-right font-bold">${format0(saldo)}</td>
                        </tr>`);
      });
    });

    const rows = entryRows.length
      ? entryRows.join('')
      : `
                        <tr>
                            <td colspan="6" class="text-center py-8 text-gray-400 font-sans">No se encontraron movimientos para esta cuenta en el periodo seleccionado.</td>
                        </tr>`;

    const footer = totalDebe > 0 || totalHaber > 0
      ? `
                <tfoot>
                    <tr class="border-t-2 border-black font-bold font-mono text-[11px] text-black">
                        <td colspan="3" class="py-3 px-3 text-right uppercase font-sans">TOTALES:</td>
                        <td class="py-3 px-3 text-right">${format0(totalDebe)}</td>
                        <td class="py-3 px-3 text-right">${format0(totalHaber)}</td>
                        <td class="py-3 px-3 text-right">${format0(saldo)}</td>
                    </tr>
                </tfoot>`
      : '';

    return `
    <div class="bg-white text-black font-sans p-6 max-w-[95%] mx-auto">

    <div class="flex justify-between items-baseline pb-3 mb-4 border-b border-gray-300">
        <div>
            <h1 class="text-base font-bold uppercase tracking-wider">Libro Mayor - Cuenta: <span class="text-indigo-600">${UI.h(accountCode)}</span></h1>
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
                    <th class="py-2.5 px-3">Fecha</th>
                    <th class="py-2.5 px-3">Asiento ID</th>
                    <th class="py-2.5 px-3">Glosa / Entidad</th>
                    <th class="py-2.5 px-3 text-right">Debe</th>
                    <th class="py-2.5 px-3 text-right">Haber</th>
                    <th class="py-2.5 px-3 text-right">Saldo</th>
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
})();
