(function () {
  'use strict';

  const helpers = window.Plasticina.actions.helpers;
  const { afterSuccess, fail, readForm, run } = helpers;

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
        const count = await Store.importCsv(String(reader.result || ''));
        afterSuccess('¡CSV importado correctamente! Se ingresaron ' + count + ' documentos.', 'vc_documents.create');
      } catch (error) {
        fail(error, values);
      }
    };
    reader.onerror = function () { fail(new Error('No se pudo leer el archivo CSV.'), values); };
    reader.readAsText(file, 'UTF-8');
  };

  window.Actions['documents.batch'] = function (form) {
    run(form, async function (values) {
      const ids = Array.isArray(values['document_ids[]']) ? values['document_ids[]'] : [];
      if (ids.length === 0 || !values.custom_net_account || !values.glosa) throw new Error('Debe seleccionar documentos, una cuenta contable para el Neto y una glosa.');
      const result = await Store.batchProcess(ids, values.custom_net_account, values.glosa);
      if (result.errors && result.errors.length) {
        UI.flash('error', result.errors.join(' | '));
      }
      afterSuccess('Se procesaron correctamente ' + result.success_count + ' documentos.', 'vc_documents.pending');
    });
  };

})();
