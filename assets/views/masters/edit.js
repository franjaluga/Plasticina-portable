(function () {
  'use strict';

  window.Views = window.Views || {};

  const { dataset, selectField } = window.Plasticina.views.helpers;

  window.Views.templatesEdit = function (ctx) {
    const detail = dataset(ctx, 'masters.templateDetail', function () {
      const template = Store.template(ctx.params.accountTemplate) || {};
      return { template: template, items: Store.templateItems(template.id) };
    });
    const template = detail.template || {};
    const items = detail.items || [];

    const categoryOptions = [
      { value: 'activo', label: 'Activo' },
      { value: 'pasivo', label: 'Pasivo' },
      { value: 'patrimonio', label: 'Patrimonio' },
      { value: 'ganancia', label: 'Ganancia' },
      { value: 'perdida', label: 'Pérdida' }
    ];

    const rows = items.map(function (item) {
      const category = String(item.category === undefined || item.category === null ? '' : item.category);
      return `
                        <tr class="bg-white">
                            <td class="py-2 px-4"><input type="text" name="items[${UI.h(item.id)}][code]" value="${UI.h(item.code)}" class="w-full text-xs border-slate-300 rounded-md" required></td>
                            <td class="py-2 px-4"><input type="text" name="items[${UI.h(item.id)}][name]" value="${UI.h(item.name)}" class="w-full text-xs border-slate-300 rounded-md" required></td>
                            <td class="py-2 px-4">
                                ${selectField('items[' + item.id + '][category]', categoryOptions, {
                                  value: category,
                                  className: 'w-full text-xs border-slate-300 rounded-md p-1.5 bg-white border'
                                })}
                            </td>
                            <td class="py-2 px-4 text-center"><button type="button" onclick="this.closest('tr').remove()" class="text-rose-600 font-bold text-base">&times;</button></td>
                        </tr>`;
    }).join('');

    return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6 flex justify-between items-center">
            <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Editar Plan: <span class="text-indigo-600">${UI.h(template.name)}</span></h1>
            <a href="${UI.h(UI.route('masters.account_templates.index'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3.5 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition">&larr; Volver</a>
        </div>

        <form id="templateForm" data-action="templates.update" class="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
            <input type="hidden" name="account_template_id" value="${UI.h(template.id)}">
            <input type="hidden" name="_method" value="PUT">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nombre del Plan</label>
                    <input type="text" name="name" value="${UI.h(template.name)}" class="w-full text-xs border-slate-300 rounded-lg shadow-sm" required>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                    <input type="text" name="description" value="${UI.h(template.description)}" class="w-full text-xs border-slate-300 rounded-lg shadow-sm">
                </div>
            </div>

            <div class="flex justify-between items-center mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Elementos / Cuentas del Plan</h3>
                <button type="button" id="addRow" class="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition">+ Añadir Cuenta</button>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden mb-6 max-h-[500px] overflow-y-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-800 text-white uppercase tracking-wider text-[11px] sticky top-0">
                        <tr>
                            <th class="py-2.5 px-4 w-36">Código</th>
                            <th class="py-2.5 px-4">Nombre de la Cuenta</th>
                            <th class="py-2.5 px-4 w-40">Categoría</th>
                            <th class="py-2.5 px-4 w-12 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="accountsTableBody" class="divide-y divide-slate-100">
                        ${rows}
                    </tbody>
                </table>
            </div>

            <div class="flex justify-end">
                <button type="submit" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-700 transition">Guardar Cambios del Plan</button>
            </div>
        </form>
    </div>

    <script>
    (function () {
      var config = ${UI.json({ accountTemplateId: template.id === undefined ? null : template.id })};
      var form = document.getElementById('templateForm');
      var selectField = window.Plasticina.views.helpers.selectField;
      var dropdown = window.Plasticina.views.dropdown;
      var categoryOptions = [
        { value: 'activo', label: 'Activo' },
        { value: 'pasivo', label: 'Pasivo' },
        { value: 'patrimonio', label: 'Patrimonio' },
        { value: 'ganancia', label: 'Ganancia' },
        { value: 'perdida', label: 'Pérdida' }
      ];
      if (form) {
        form.dataset.accountTemplateId = config.accountTemplateId === null ? '' : String(config.accountTemplateId);
      }
      document.getElementById('addRow').addEventListener('click', function() {
        const tbody = document.getElementById('accountsTableBody');
        const newId = 'new_' + Date.now();
        const tr = document.createElement('tr');
        tr.className = 'bg-white';
        tr.innerHTML = \`
                <td class="py-2 px-4"><input type="text" name="items[\${newId}][code]" class="w-full text-xs border-slate-300 rounded-md" required placeholder="Ej: 1010199"></td>
                <td class="py-2 px-4"><input type="text" name="items[\${newId}][name]" class="w-full text-xs border-slate-300 rounded-md" required placeholder="Nombre de cuenta"></td>
                <td class="py-2 px-4">\${selectField('items[' + newId + '][category]', categoryOptions, { value: 'activo', className: 'w-full text-xs border-slate-300 rounded-md p-1.5 bg-white border' })}</td>
                <td class="py-2 px-4 text-center"><button type="button" onclick="this.closest('tr').remove()" class="text-rose-600 font-bold text-base">&times;</button></td>
            \`;
        tbody.appendChild(tr);
        if (dropdown) dropdown.mount(tr);
      });
    })();
    </script>
    `;
  };
  window.Views.templatesEdit.resources = ['masters.templateDetail'];
})();
