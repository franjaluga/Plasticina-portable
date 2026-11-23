(function () {
  'use strict';

  window.Views = window.Views || {};

  const { capitalize, oldValue } = window.Plasticina.views.helpers;

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
})();
