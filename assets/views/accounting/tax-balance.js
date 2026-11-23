(function () {
  'use strict';

  window.Views = window.Views || {};

  const { format0, format0OrDash, num, queryYear } = window.Plasticina.views.helpers;

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
})();
