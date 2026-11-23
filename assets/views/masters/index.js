(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.templatesIndex = function (ctx) {
    const templates = Store.templates();

    const rows = templates.length
      ? templates.map(function (tpl) {
          return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="py-3 px-4 font-bold text-slate-800">${UI.h(tpl.name)} <br><span class="font-normal text-slate-400">${UI.h(tpl.description)}</span></td>
                        <td class="py-3 px-4 font-mono text-indigo-600">${UI.h(tpl.slug)}</td>
                        <td class="py-3 px-4 text-center font-semibold">${UI.h(UI.number(tpl.items_count))} cuentas</td>
                        <td class="py-3 px-4 text-center space-x-2">
                            <a href="${UI.h(UI.route('masters.account_templates.edit', { accountTemplate: tpl.id }))}" class="px-2.5 py-1 bg-amber-500 text-white rounded-md text-xs font-semibold hover:bg-amber-600 transition">Editar Cuentas</a>
                            <form data-action="templates.destroy" class="inline">
                                <input type="hidden" name="account_template_id" value="${UI.h(tpl.id)}">
                                <input type="hidden" name="_method" value="DELETE">
                                <button type="submit" data-confirm="¿Borrar este plan maestro?" class="px-2.5 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700 transition">Eliminar</button>
                            </form>
                        </td>
                    </tr>`;
        }).join('')
      : `
                    <tr><td colspan="4" class="p-6 text-center text-slate-400">No hay planes personalizados creados.</td></tr>`;

    return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6 flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Planes de Cuentas Maestros</h1>
                <p class="text-xs text-slate-500 mt-1">Crea nuevos planes personalizados clonando la base estándar del sistema.</p>
            </div>
            <a href="${UI.h(UI.route('reports.analytics'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition">
                &larr; Volver
            </a>
        </div>

        <div class="bg-white shadow-sm border border-slate-200 rounded-xl p-6 mb-6">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Crear Nuevo Plan Clonando Base</h2>
            <form data-action="templates.store">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Nombre del Plan</label>
                        <input type="text" name="name" class="w-full text-xs border-slate-300 rounded-lg shadow-sm" required placeholder="Ej: Plan Constructoras 2026">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Descripción / Rubro</label>
                        <input type="text" name="description" class="w-full text-xs border-slate-300 rounded-lg shadow-sm" placeholder="Opcional">
                    </div>
                    <div>
                        <button type="submit" class="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-700 transition">
                            Generar y Clonar Plan Base
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <div class="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-800 text-white uppercase tracking-wider text-[11px]">
                        <th class="py-2.5 px-4">Nombre del Plan</th>
                        <th class="py-2.5 px-4">Slug Identificador</th>
                        <th class="py-2.5 px-4 text-center">Total Cuentas</th>
                        <th class="py-2.5 px-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${rows}
                </tbody>
            </table>
        </div>
    </div>
    `;
  };
})();
