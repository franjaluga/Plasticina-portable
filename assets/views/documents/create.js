(function () {
  'use strict';

  window.Views = window.Views || {};

  const { selectField } = window.Plasticina.views.helpers;

  window.Views.documentCreate = function (ctx) {
    const owner = Store.activeOwner();
    const values = UI.old() || {};
    function value(name, fallback) {
      const stored = values[name];
      if (stored === undefined || stored === null || stored === '') return fallback === undefined ? '' : fallback;
      return stored;
    }
    const fieldClass = 'mt-1 block w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 transition';
    const amountClass = fieldClass + ' text-right font-mono';
    const totalClass = 'mt-1 block w-full min-w-0 rounded-lg border border-gray-400 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900 shadow-sm outline-none border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 text-right font-mono transition';
    const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-700 mb-1';
    const sectionClass = 'text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200';

    return `
    <header class="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Ingresar Documento V/C</h2>
            <div>
                <a href="${UI.h(UI.route('ingress.manual'))}" class="text-xs font-semibold bg-gray-100 text-gray-700 px-3.5 py-2 rounded-lg border border-gray-200 bg-gray-200:hover transition shadow-sm">
                    &larr; Volver al Inicio
                </a>
            </div>
        </div>
    </header>

    <main class="py-4 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
            <div class="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                <form data-action="documents.store">
                    <input type="hidden" name="owner_id" value="${UI.h(owner ? owner.id : '')}">

                    <h3 class="${sectionClass}">1. Datos de Registro</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label for="month_register" class="${labelClass}">Mes de Registro</label>
                            <input type="number" name="month_register" id="month_register" min="1" max="12" value="${UI.h(value('month_register', String(new Date().getMonth() + 1)))}" class="${fieldClass}" required>
                        </div>
                        <div>
                            <label for="year_register" class="${labelClass}">Año de Registro</label>
                            <input type="number" name="year_register" id="year_register" min="2000" value="${UI.h(value('year_register', ''))}" class="${fieldClass}" required>
                        </div>
                        <div>
                            <label for="type_vc" class="${labelClass}">Tipo (V/C)</label>
                            ${selectField('type_vc', [
                              { value: 'V', label: 'Venta' },
                              { value: 'C', label: 'Compra' }
                            ], {
                              id: 'type_vc',
                              value: value('type_vc', 'V'),
                              className: fieldClass
                            })}
                        </div>
                    </div>

                    <h3 class="${sectionClass}">2. Detalles del Documento</h3>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Datos de la Entidad</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label for="rut" class="${labelClass}">RUT (Ej: 12345678-9)</label>
                                <input type="text" name="rut" id="rut" maxlength="10" value="${UI.h(value('rut', ''))}" placeholder="Ej: 12345678-9" class="${fieldClass}" required>
                                <p id="rut_message" class="text-xs mt-2 leading-tight text-gray-500"></p>
                            </div>
                            <div>
                                <label for="entity_name" class="${labelClass}">Nombre o Razón Social</label>
                                <input type="text" name="entity_name" id="entity_name" value="${UI.h(value('entity_name', ''))}" placeholder="Nombre completo o razón social" class="${fieldClass}" required>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Tipo de Documento</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label for="doctype" class="${labelClass}">Código (Doctype)</label>
                                <input type="number" name="doctype" id="doctype" value="${UI.h(value('doctype', ''))}" placeholder="Ej: 33" class="${fieldClass}" required>
                                <p id="doctype_message" class="text-xs mt-2 leading-tight text-gray-500"></p>
                            </div>
                            <div>
                                <label for="document_type_name" class="${labelClass}">Nombre del Documento</label>
                                <input type="text" name="document_type_name" id="document_type_name" value="${UI.h(value('document_type_name', ''))}" placeholder="Ej: Factura Electrónica" class="${fieldClass}" required>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label for="folio" class="${labelClass}">Folio</label>
                            <input type="number" name="folio" id="folio" value="${UI.h(value('folio', ''))}" placeholder="N° de folio" class="${fieldClass}" required>
                        </div>
                        <div>
                            <label for="date" class="${labelClass}">Fecha Documento</label>
                            <input type="date" name="date" id="date" value="${UI.h(value('date', ''))}" class="${fieldClass}" required>
                        </div>
                    </div>

                    <h3 class="${sectionClass}">3. Referencias</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="rut_ref" class="${labelClass}">RUT Ref</label>
                            <input type="text" name="rut_ref" id="rut_ref" maxlength="10" value="${UI.h(value('rut_ref', ''))}" placeholder="Ej: 12345678-9" class="${fieldClass}">
                        </div>
                        <div>
                            <label for="folio_ref" class="${labelClass}">Folio Ref</label>
                            <input type="number" name="folio_ref" id="folio_ref" value="${UI.h(value('folio_ref', ''))}" placeholder="N° de folio" class="${fieldClass}">
                        </div>
                        <div>
                            <label for="td_ref" class="${labelClass}">Tipo Doc Ref</label>
                            <input type="text" name="td_ref" id="td_ref" maxlength="2" value="${UI.h(value('td_ref', ''))}" placeholder="Ej: 33" class="${fieldClass}">
                        </div>
                        <div>
                            <label for="date_centralize" class="${labelClass}">Fecha Centralización</label>
                            <input type="date" name="date_centralize" id="date_centralize" value="${UI.h(value('date_centralize', ''))}" class="${fieldClass}">
                        </div>
                    </div>

                    <h3 class="${sectionClass}">4. Montos</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label for="net" class="${labelClass}">Neto</label>
                            <input type="number" name="net" id="net" value="${UI.h(value('net', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div>
                            <label for="exempt" class="${labelClass}">Exento</label>
                            <input type="number" name="exempt" id="exempt" value="${UI.h(value('exempt', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div>
                            <label for="vat_rec" class="${labelClass}">IVA Recuperable</label>
                            <input type="number" name="vat_rec" id="vat_rec" value="${UI.h(value('vat_rec', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div>
                            <label for="vat_no_rec" class="${labelClass}">IVA No Recup.</label>
                            <input type="number" name="vat_no_rec" id="vat_no_rec" value="${UI.h(value('vat_no_rec', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div>
                            <label for="plus_oth_tax" class="${labelClass}">Otros Imp. (+)</label>
                            <input type="number" name="plus_oth_tax" id="plus_oth_tax" value="${UI.h(value('plus_oth_tax', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div>
                            <label for="minus_oth_tax" class="${labelClass}">Otros Imp. (-)</label>
                            <input type="number" name="minus_oth_tax" id="minus_oth_tax" value="${UI.h(value('minus_oth_tax', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${amountClass}">
                        </div>
                        <div class="sm:col-span-2 md:col-span-4">
                            <label for="total" class="block text-sm font-bold text-gray-900 mb-1">TOTAL</label>
                            <input type="number" name="total" id="total" value="${UI.h(value('total', '0'))}" step="0.01" inputmode="decimal" placeholder="0.00" class="${totalClass}" required>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                        <a href="${UI.h(UI.route('welcome'))}" class="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50:hover transition text-center">
                            Cancelar / Volver
                        </a>
                        <button type="submit" class="bg-indigo-600 border border-transparent rounded-lg shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white bg-indigo-700:hover outline-none ring-2 ring-offset-2 ring-indigo-500 transition">
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
          rutMessage.className = 'text-xs mt-2 leading-tight text-gray-500';
          nameInput.removeAttribute('readonly');
          nameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
          var entity = Store.entityByRut(rutValue);
          if (entity) {
            nameInput.value = entity.name || '';
            rutMessage.textContent = 'Entidad cargada. Puede ajustar el nombre si es necesario.';
            rutMessage.className = 'text-xs mt-2 leading-tight text-green-600 font-medium';
          } else {
            nameInput.value = '';
            rutMessage.textContent = 'RUT nuevo. Ingrese el nombre para registrarlo.';
            rutMessage.className = 'text-xs mt-2 leading-tight text-blue-600 font-medium';
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
          doctypeMessage.className = 'text-xs mt-2 leading-tight text-gray-500';
          docNameInput.removeAttribute('readonly');
          docNameInput.classList.remove('bg-gray-100', 'text-gray-600', 'cursor-not-allowed');
          var documentType = Store.documentTypeByDoctype(doctypeValue);
          if (documentType) {
            docNameInput.value = documentType.name || '';
            doctypeMessage.textContent = 'Tipo de documento cargado. Puede ajustar el nombre si es necesario.';
            doctypeMessage.className = 'text-xs mt-2 leading-tight text-green-600 font-medium';
          } else {
            docNameInput.value = '';
            doctypeMessage.textContent = 'Código nuevo. Ingrese el nombre para registrarlo.';
            doctypeMessage.className = 'text-xs mt-2 leading-tight text-blue-600 font-medium';
            docNameInput.focus();
          }
        });
      }
    })();
    </script>
    `;
  };
})();
