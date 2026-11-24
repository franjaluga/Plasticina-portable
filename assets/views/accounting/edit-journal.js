(function () {
  'use strict';

  window.Views = window.Views || {};

  const { accountSearchField, docTypeName, num, oldValue } = window.Plasticina.views.helpers;

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
                                    ${accountSearchField(`entries[${UI.h(index)}][account_code]`, accountCode, {
                                      accounts: accounts,
                                      inputClass: 'w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
                                      placeholder: 'Código o nombre'
                                    })}
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" min="0" name="entries[${UI.h(index)}][debit]" value="${UI.h(entryValue(entry, index, 'debit'))}" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" min="0" name="entries[${UI.h(index)}][credit]" value="${UI.h(entryValue(entry, index, 'credit'))}" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required>
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
                                    <input type="number" step="any" min="0" name="entries[devengo][debit]" value="${UI.h(devengoEntry.debit)}" class="debit-input w-full text-right text-xs bg-gray-100 text-gray-500 border-gray-300 rounded-md shadow-sm cursor-not-allowed" readonly required>
                                </td>
                                <td class="py-3 px-4 text-right">
                                    <input type="number" step="any" min="0" name="entries[devengo][credit]" value="${UI.h(devengoEntry.credit)}" class="credit-input w-full text-right text-xs bg-gray-100 text-gray-500 border-gray-300 rounded-md shadow-sm cursor-not-allowed" readonly required>
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

    <script>
    (function () {
      var viewHelpers = window.Plasticina.views.helpers;
      var accountsData = ${UI.json(accounts)};
      var addRowBtn = document.getElementById('addRowBtn');
      var tbody = document.getElementById('entriesTableBody');
      if (!addRowBtn || !tbody) { return; }

      addRowBtn.addEventListener('click', function () {
        var fixedRow = tbody.querySelector('tr[data-fixed="true"]');
        var newIndex = 'custom_' + Date.now();
        var newTr = document.createElement('tr');
        newTr.className = 'entry-row bg-white';
        newTr.innerHTML = [
          '<td class="py-3 px-4">',
          '<input type="hidden" name="entries[' + newIndex + '][component_name]" value="custom">',
          viewHelpers.accountSearchField('entries[' + newIndex + '][account_code]', '', {
            accounts: accountsData,
            inputClass: 'w-full text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500',
            placeholder: 'Código o nombre'
          }),
          '</td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" min="0" name="entries[' + newIndex + '][debit]" value="0" class="debit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-right"><input type="number" step="any" min="0" name="entries[' + newIndex + '][credit]" value="0" class="credit-input w-full text-right text-xs border-gray-300 rounded-md shadow-sm" required></td>',
          '<td class="py-3 px-4 text-center"><button type="button" class="remove-row-btn text-red-500 hover:text-red-700 font-bold text-sm px-2" title="Eliminar fila">&times;</button></td>'
        ].join('');
        tbody.insertBefore(newTr, fixedRow || null);
        viewHelpers.bindAccountSearch(newTr.querySelector('[data-account-search]'), accountsData, {});
        attachEvents();
        calculateTotals();
      });

      function enforceSingleSide(input) {
        if (!(Number(input.value) > 0)) return;
        var row = input.closest('tr');
        if (!row) return;
        var opposite = row.querySelector(input.classList.contains('debit-input') ? '.credit-input' : '.debit-input');
        if (!opposite || Number(opposite.value) === 0) return;
        opposite.value = 0;
        UI.notify('Cada fila del asiento debe registrar solo Debe o solo Haber.', 'error');
      }

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
          input.oninput = function () {
            if (Number(this.value) < 0) {
              this.value = 0;
              UI.notify('No se permiten montos negativos en Debe ni en Haber.', 'error');
            }
            enforceSingleSide(this);
            calculateTotals();
          };
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

      viewHelpers.bindAccountSearchForm(document.querySelector('form[data-action="journals.update"]'), accountsData, {});
      attachEvents();
      calculateTotals();
    })();
    </script>
    `;
  };
})();
