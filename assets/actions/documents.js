(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, fail, grouped, readForm, run } = helpers;

  window.Actions = window.Actions || {};

  window.Actions['documents.store'] = function (form) {
    run(form, async function (values) {
      const data = Object.assign({}, values);
      delete data.owner_id;
      await Store.createDocument(data);
      afterSuccess('Documento V/C guardado exitosamente.', 'vc_documents.create');
    });
  };

  window.Actions['documents.csv'] = function (form) {
    const values = readForm(form);
    const input = form.elements.csv_file;
    const file = input && input.files ? input.files[0] : null;
    if (!file) {
      fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
      return;
    }
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const count = await Store.importCsv(reader.result);
        afterSuccess('¡CSV importado correctamente! Se ingresaron ' + count + ' documentos.', 'vc_documents.create');
      } catch (error) {
        fail(error, values);
      }
    };
    reader.onerror = function () { fail(new Error('No se pudo leer el archivo CSV.'), values); };
    reader.readAsArrayBuffer(file);
  };

  window.Actions['documents.batch'] = function (form) {
    run(form, async function (values) {
      const ids = Array.isArray(values['document_ids[]']) ? values['document_ids[]'] : [];
      const accountByDocument = {};
      grouped(form, 'custom_net_account').forEach(function (item) {
        accountByDocument[String(item._key)] = String(item.code || '').trim();
      });
      if (ids.length === 0 || !values.glosa) throw new Error('Debe seleccionar documentos y una glosa.');
      const missing = ids.filter(function (id) { return !accountByDocument[String(id)]; });
      if (missing.length) throw new Error('Debe indicar el código de la cuenta contable para el Neto en cada documento seleccionado.');
      const result = await Store.batchProcess(ids, accountByDocument, values.glosa);
      const errors = Array.isArray(result.errors) ? result.errors : [];
      const processed = Number(result.success_count) || 0;
      if (errors.length) {
        UI.flash('error', errors.join(' | '));
      }
      if (processed === 0) {
        UI.remember(values);
        if (window.App) window.App.render();
        return undefined;
      }
      afterSuccess('Se procesaron correctamente ' + processed + ' documentos.', 'vc_documents.batch_processed', { processed: processed });
    });
  };

})();
