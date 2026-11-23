(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.ownersAccounts = function (ctx) {
    const owner = Store.owner(ctx.params.owner) || {};
    const accounts = Store.accounts(owner.id);
    const badgeColors = {
      activo: 'bg-blue-50 text-blue-700 border-blue-200',
      pasivo: 'bg-amber-50 text-amber-700 border-amber-200',
      patrimonio: 'bg-purple-50 text-purple-700 border-purple-200',
      perdida: 'bg-rose-50 text-rose-700 border-rose-200',
      ganancia: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    const rows = accounts.length
      ? accounts.map(function (account) {
          const args = [account.id, account.code, account.name, account.category]
            .map(function (value) { return UI.json(value === undefined || value === null ? '' : String(value)); })
            .join(', ');
          const editOnClick = UI.h('openEditModal(' + args + ')');
          const badgeColor = badgeColors[account.category] || 'bg-emerald-50 text-emerald-700 border-emerald-200';
          return `
                            <tr class="hover:bg-slate-50/80 transition">
                                <td class="py-4 px-5 font-mono font-bold text-slate-700">
                                    ${UI.h(account.code)}
                                </td>
                                <td class="py-4 px-5 font-medium text-slate-800">
                                    ${UI.h(account.name)}
                                </td>
                                <td class="py-4 px-5">
                                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${badgeColor}">
                                        ${UI.h(account.category)}
                                    </span>
                                </td>
                                <td class="py-4 px-5 text-right space-x-1">
                                    <button onclick="${editOnClick}" class="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-semibold transition">
                                        Editar
                                    </button>

                                    <form data-action="accounts.destroy" class="inline-block" data-confirm="¿Estás seguro de eliminar esta cuenta?">
                                        <input type="hidden" name="owner_id" value="${UI.h(owner.id)}">
                                        <input type="hidden" name="account_id" value="${UI.h(account.id)}">
                                        <input type="hidden" name="_method" value="DELETE">
                                        <button type="submit" class="px-2.5 py-1.5 bg-slate-100 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition">
                                            Eliminar
                                        </button>
                                    </form>
                                </td>
                            </tr>`;
        }).join('')
      : `
                            <tr>
                                <td colspan="4" class="py-12 text-center text-slate-400">
                                    No hay cuentas registradas para esta empresa.
                                </td>
                            </tr>`;

    return `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm gap-4">
            <div>
                <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">Gestión de Empresa</span>
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">Plan de Cuentas: <span class="text-indigo-600">${UI.h(owner.name)}</span></h1>
                <p class="text-xs text-slate-500 mt-0.5">RUT: <span class="font-semibold text-slate-700">${UI.h(owner.rut)}</span></p>
            </div>
            <div class="flex items-center space-x-3">
                <button onclick="openCreateModal()" class="inline-flex items-center text-xs font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition">
                    + Nueva Cuenta
                </button>
                <a href="${UI.h(UI.route('owners.index'))}" class="inline-flex items-center text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition">
                    &larr; Volver
                </a>
            </div>
        </div>

        <div class="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Cuentas Registradas (${UI.h(UI.number(accounts.length))})</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                            <th class="py-3 px-5 w-36">Código</th>
                            <th class="py-3 px-5">Nombre de la Cuenta</th>
                            <th class="py-3 px-5 w-40">Categoría</th>
                            <th class="py-3 px-5 w-32 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <div id="accountModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div class="flex justify-between items-center mb-4">
                <h3 id="modalTitle" class="text-sm font-bold text-slate-800">Añadir Nueva Cuenta</h3>
                <button onclick="closeAccountModal()" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form id="accountForm" data-action="accounts.store" class="space-y-4">
                <input type="hidden" id="ownerIdField" name="owner_id" value="${UI.h(owner.id)}">
                <input type="hidden" id="accountIdField" name="account_id" value="">
                <div id="methodField"></div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Código de Cuenta</label>
                    <input type="text" id="code" name="code" placeholder="Ej: 110101" class="w-full text-xs border-slate-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3" required>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nombre de la Cuenta</label>
                    <input type="text" id="name" name="name" placeholder="Ej: Caja Chica" class="w-full text-xs border-slate-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3" required>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                    <select id="category" name="category" class="w-full text-xs border-slate-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 bg-white" required>
                        <option value="activo">Activo</option>
                        <option value="pasivo">Pasivo</option>
                        <option value="patrimonio">Patrimonio</option>
                        <option value="perdida">Pérdida</option>
                        <option value="ganancia">Ganancia</option>
                    </select>
                </div>

                <div class="flex justify-end space-x-2 pt-2">
                    <button type="button" onclick="closeAccountModal()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
                        Cancelar
                    </button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition">
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
    (function () {
      var config = ${UI.json({ ownerId: owner.id === undefined ? null : owner.id, storeAction: 'accounts.store', updateAction: 'accounts.update' })};
      var modal = document.getElementById('accountModal');
      var form = document.getElementById('accountForm');
      var modalTitle = document.getElementById('modalTitle');
      var methodField = document.getElementById('methodField');
      var ownerField = document.getElementById('ownerIdField');
      var accountField = document.getElementById('accountIdField');

      function showModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function openCreateModal() {
        modalTitle.innerText = "Añadir Nueva Cuenta";
        form.dataset.action = config.storeAction;
        ownerField.value = config.ownerId === null ? '' : config.ownerId;
        accountField.value = '';
        methodField.innerHTML = '';
        document.getElementById('code').value = '';
        document.getElementById('name').value = '';
        document.getElementById('category').value = 'activo';
        showModal();
      }

      function openEditModal(id, code, name, category) {
        modalTitle.innerText = "Editar Cuenta Contable";
        form.dataset.action = config.updateAction;
        ownerField.value = config.ownerId === null ? '' : config.ownerId;
        accountField.value = id;
        methodField.innerHTML = '<input type="hidden" name="_method" value="PUT">';
        document.getElementById('code').value = code;
        document.getElementById('name').value = name;
        document.getElementById('category').value = category;
        showModal();
      }

      function closeAccountModal() {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }

      window.openCreateModal = openCreateModal;
      window.openEditModal = openEditModal;
      window.closeAccountModal = closeAccountModal;
    })();
    </script>
    `;
  };
})();
