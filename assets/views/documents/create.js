(function () {
  'use strict';

  window.Views = window.Views || {};

  window.Views.documentCreate = function (ctx) {
    const owner = Store.activeOwner();
    const values = UI.old() || {};
    function value(name, fallback) {
      const stored = values[name];
      if (stored === undefined || stored === null || stored === '') return fallback === undefined ? '' : fallback;
      return stored;
    }
    function selected(name, expected, fallback) {
      return String(value(name, fallback)) === String(expected) ? ' selected' : '';
    }

    return `
    <header class="bg-white shadow mb-8">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Ingresar Documento V/C</h2>
            <div>
                <a href="${UI.h(UI.route('ingress.manual'))}" class="text-xs font-semibold bg-gray-100 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm">
                    &larr; Volver al Inicio
                </a>
            </div>
        </div>
    </header>

    <main class="py-4">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <form data-action="documents.store">
                    <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">1. Datos de Registro</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label for="month_register" class="block text-sm font-medium text-gray-700">Mes de Registro</label>
                            <input type="number" name="month_register" id="month_register" min="1" max="12" value="${UI.h(value('month_register', String(new Date().getMonth() + 1)))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="year_register" class="block text-sm font-medium text-gray-700">Año de Registro</label>
                            <input type="number" name="year_register" id="year_register" min="2000" value="${UI.h(value('year_register', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="type_vc" class="block text-sm font-medium text-gray-700">Tipo (V/C)</label>
                            <select name="type_vc" id="type_vc" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <option value="V"${selected('type_vc', 'V', 'V')}>Venta</option>
                                <option value="C"${selected('type_vc', 'C', 'V')}>Compra</option>
                            </select>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">2. Detalles del Documento</h3>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-md mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Datos de la Entidad</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="rut" class="block text-sm font-medium text-gray-700">RUT (Ej: 12345678-9)</label>
                                <input type="text" name="rut" id="rut" maxlength="10" value="${UI.h(value('rut', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <p id="rut_message" class="text-xs mt-1 h-4 text-gray-500"></p>
                            </div>
                            <div>
                                <label for="entity_name" class="block text-sm font-medium text-gray-700">Nombre o Razón Social</label>
                                <input type="text" name="entity_name" id="entity_name" value="${UI.h(value('entity_name', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors" required>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-md mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Tipo de Documento</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label for="doctype" class="block text-sm font-medium text-gray-700">Código (Doctype)</label>
                                <input type="number" name="doctype" id="doctype" value="${UI.h(value('doctype', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                <p id="doctype_message" class="text-xs mt-1 h-4 text-gray-500"></p>
                            </div>
                            <div>
                                <label for="document_type_name" class="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                                <input type="text" name="document_type_name" id="document_type_name" value="${UI.h(value('document_type_name', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors" required>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label for="folio" class="block text-sm font-medium text-gray-700">Folio</label>
                            <input type="number" name="folio" id="folio" value="${UI.h(value('folio', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                        <div>
                            <label for="date" class="block text-sm font-medium text-gray-700">Fecha Documento</label>
                            <input type="date" name="date" id="date" value="${UI.h(value('date', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">3. Referencias</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="rut_ref" class="block text-sm font-medium text-gray-700">RUT Ref</label>
                            <input type="text" name="rut_ref" id="rut_ref" maxlength="10" value="${UI.h(value('rut_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="folio_ref" class="block text-sm font-medium text-gray-700">Folio Ref</label>
                            <input type="number" name="folio_ref" id="folio_ref" value="${UI.h(value('folio_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="td_ref" class="block text-sm font-medium text-gray-700">Tipo Doc Ref</label>
                            <input type="text" name="td_ref" id="td_ref" maxlength="2" value="${UI.h(value('td_ref', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="date_centralize" class="block text-sm font-medium text-gray-700">Fecha Centralización</label>
                            <input type="date" name="date_centralize" id="date_centralize" value="${UI.h(value('date_centralize', ''))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                    </div>

                    <h3 class="text-lg font-medium text-gray-900 mb-4 border-b pb-2">4. Montos</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="net" class="block text-sm font-medium text-gray-700">Neto</label>
                            <input type="number" name="net" id="net" value="${UI.h(value('net', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="exempt" class="block text-sm font-medium text-gray-700">Exento</label>
                            <input type="number" name="exempt" id="exempt" value="${UI.h(value('exempt', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="vat_rec" class="block text-sm font-medium text-gray-700">IVA Recuperable</label>
                            <input type="number" name="vat_rec" id="vat_rec" value="${UI.h(value('vat_rec', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="vat_no_rec" class="block text-sm font-medium text-gray-700">IVA No Recup.</label>
                            <input type="number" name="vat_no_rec" id="vat_no_rec" value="${UI.h(value('vat_no_rec', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="plus_oth_tax" class="block text-sm font-medium text-gray-700">Otros Imp. (+)</label>
                            <input type="number" name="plus_oth_tax" id="plus_oth_tax" value="${UI.h(value('plus_oth_tax', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label for="minus_oth_tax" class="block text-sm font-medium text-gray-700">Otros Imp. (-)</label>
                            <input type="number" name="minus_oth_tax" id="minus_oth_tax" value="${UI.h(value('minus_oth_tax', '0'))}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        </div>
                        <div class="col-span-2">
                            <label for="total" class="block text-sm font-bold text-gray-900">TOTAL</label>
                            <input type="number" name="total" id="total" value="${UI.h(value('total', '0'))}" class="mt-1 block w-full rounded-md border-gray-400 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold" required>
                        </div>
                    </div>

                    <div class="flex justify-end pt-4 border-t">
                        <a href="${UI.h(UI.route('welcome'))}" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3">
                            Cancelar / Volver
                        </a>
                        <button type="submit" class="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Guardar Documento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <script>
    (function () {
      var config = ${UI.json({ ownerId: owner ? owner.id : null, workingYear: Store.workingYear() })};
      var yearInput = document.getElementById('year_register');
      if (yearInput && !yearInput.value) { yearInput.value = String(config.workingYear); }

      var form = document.querySelector('form[data-action="documents.store"]');
      if (form) {
        Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (field) {
          function selectContent() {
            try { this.select(); } catch (error) { return; }
          }
          field.addEventListener('focus', selectContent);
          field.addEventListener('click', selectContent);
        });
      }

      var centralizeInput = document.getElementById('date_centralize');
      if (centralizeInput && !centralizeInput.value) {
        var currentDate = new Date();
        var monthEnd = new Date(config.workingYear, currentDate.getMonth() + 1, 0);
        var monthText = String(monthEnd.getMonth() + 1);
        var dayText = String(monthEnd.getDate());
        centralizeInput.value = String(config.workingYear) + '-' +
          (monthText.length < 2 ? '0' + monthText : monthText) + '-' +
          (dayText.length < 2 ? '0' + dayText : dayText);
      }

      var rutInput = document.getElementById('rut');
      var folioInput = document.getElementById('folio');
      var rutRefInput = document.getElementById('rut_ref');
      var tdRefInput = document.getElementById('td_ref');
      var folioRefInput = document.getElementById('folio_ref');
      var autoRutRef = false;
      var autoTdRef = false;
      var autoFolioRef = false;

      function syncReferences() {
        var doctypeField = document.getElementById('doctype');
        if (!doctypeField || !rutRefInput || !tdRefInput || !folioRefInput) return;
        var code = String(doctypeField.value).trim();
        if (code === '33' || code === '34') {
          var rutValue = rutInput ? String(rutInput.value).trim() : '';
          if (rutValue && (!rutRefInput.value || autoRutRef)) {
            rutRefInput.value = rutValue;
            autoRutRef = true;
          }
          if (!tdRefInput.value || autoTdRef) {
            tdRefInput.value = code;
            autoTdRef = true;
          }
          var folioValue = folioInput ? String(folioInput.value).trim() : '';
          if (folioValue && (!folioRefInput.value || autoFolioRef)) {
            folioRefInput.value = folioValue;
            autoFolioRef = true;
          }
          return;
        }
        if (autoRutRef) { rutRefInput.value = ''; autoRutRef = false; }
        if (autoTdRef) { tdRefInput.value = ''; autoTdRef = false; }
        if (autoFolioRef) { folioRefInput.value = ''; autoFolioRef = false; }
      }

      if (rutRefInput) { rutRefInput.addEventListener('input', function () { autoRutRef = false; }); }
      if (tdRefInput) { tdRefInput.addEventListener('input', function () { autoTdRef = false; }); }
      if (folioRefInput) { folioRefInput.addEventListener('input', function () { autoFolioRef = false; }); }
      if (rutInput) { rutInput.addEventListener('input', syncReferences); }
      if (folioInput) { folioInput.addEventListener('input', syncReferences); }
      syncReferences();

      var totalInput = document.getElementById('total');
      var amountIds = ['net', 'exempt', 'vat_rec', 'vat_no_rec', 'plus_oth_tax', 'minus_oth_tax'];
      function amountOf(id) {
        var input = document.getElementById(id);
        var parsed = parseFloat(input ? input.value : '0');
        return isNaN(parsed) ? 0 : parsed;
      }
      function calculateTotal() {
        if (!totalInput) return;
        var sum = amountOf('net') + amountOf('exempt') + amountOf('vat_rec') +
          amountOf('vat_no_rec') + amountOf('plus_oth_tax') - amountOf('minus_oth_tax');
        totalInput.value = String(Math.round((sum + Number.EPSILON) * 100) / 100);
      }
      amountIds.forEach(function (id) {
        var input = document.getElementById(id);
        if (input) { input.addEventListener('input', calculateTotal); }
      });
      if (totalInput && (!totalInput.value || Number(totalInput.value) === 0)) { calculateTotal(); }

      var nameInput = document.getElementById('entity_name');
      var rutMessage = document.getElementById('rut_message');
      if (rutInput && nameInput && rutMessage) {
        rutInput.addEventListener('blur', function () {
          var rutValue = this.value.trim();
          syncReferences();
          if (rutValue.length === 0) { rutMessage.textContent = ''; return; }
          rutMessage.textContent = 'Buscando...';
          rutMessage.className = 'text-xs mt-1 h-4 text-gray-500';
          var entity = Store.entityByRut(rutValue);
          if (entity) {
            nameInput.value = entity.name || '';
            nameInput.setAttribute('readonly', 'readonly');
            nameInput.classList.add('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            rutMessage.textContent = 'Entidad cargada.';
            rutMessage.className = 'text-xs mt-1 h-4 text-green-600 font-medium';
          } else {
            nameInput.value = '';
            nameInput.removeAttribute('readonly');
            nameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            rutMessage.textContent = 'RUT nuevo. Ingrese el nombre para registrarlo.';
            rutMessage.className = 'text-xs mt-1 h-4 text-blue-600 font-medium';
            nameInput.focus();
          }
        });
      }

      var doctypeInput = document.getElementById('doctype');
      var docNameInput = document.getElementById('document_type_name');
      var doctypeMessage = document.getElementById('doctype_message');
      if (doctypeInput) { doctypeInput.addEventListener('input', syncReferences); }
      if (doctypeInput && docNameInput && doctypeMessage) {
        doctypeInput.addEventListener('blur', function () {
          var doctypeValue = this.value.trim();
          syncReferences();
          if (doctypeValue.length === 0) { doctypeMessage.textContent = ''; return; }
          doctypeMessage.textContent = 'Buscando...';
          doctypeMessage.className = 'text-xs mt-1 h-4 text-gray-500';
          var documentType = Store.documentTypeByDoctype(doctypeValue);
          if (documentType) {
            docNameInput.value = documentType.name || '';
            docNameInput.setAttribute('readonly', 'readonly');
            docNameInput.classList.add('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            doctypeMessage.textContent = 'Tipo de documento cargado.';
            doctypeMessage.className = 'text-xs mt-1 h-4 text-green-600 font-medium';
          } else {
            docNameInput.value = '';
            docNameInput.removeAttribute('readonly');
            docNameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
            doctypeMessage.textContent = 'Código nuevo. Ingrese el nombre para registrarlo.';
            doctypeMessage.className = 'text-xs mt-1 h-4 text-blue-600 font-medium';
            docNameInput.focus();
          }
        });
      }
    })();
    </script>
    `;
  };
})();
