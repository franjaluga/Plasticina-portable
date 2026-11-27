import { Injectable } from '@angular/core';
import { DownloadService } from './download.service';
import { FormService } from './form.service';
import { PlasticinaService } from './plasticina.service';

type Values = Record<string, any>;
type Period = { month_register: number; year_register: number };
type SalesFormat = 'factura' | 'boleta';
type PreviewOptions = { kind?: string; type_vc?: string; sale_format?: string | null };
type PreviewRow = { line: number; cells: Record<string, string>; derived: Record<string, string> };

@Injectable({ providedIn: 'root' })
export class ActionService {
  constructor(
    private readonly app: PlasticinaService,
    private readonly forms: FormService,
    private readonly download: DownloadService
  ) {}

  execute(name: string, source?: unknown): unknown {
    const form = source as HTMLFormElement;
    switch (name) {
      case 'accounts.store':
        return this.run(form, async (values) => {
          await this.app.store.createAccount(values);
          this.afterSuccess('Cuenta contable creada exitosamente para esta empresa.');
        });
      case 'accounts.update':
        return this.run(form, async (values) => {
          await this.app.store.updateAccount(this.forms.integer(values.account_id), values);
          this.afterSuccess('Cuenta contable actualizada correctamente.');
        });
      case 'accounts.destroy':
        return this.run(form, async (values) => {
          await this.app.store.deleteAccount(this.forms.integer(values.account_id));
          this.afterSuccess('Cuenta contable eliminada exitosamente.');
        });
      case 'documents.store':
        return this.run(form, async (values) => {
          const data: Values = { ...values };
          delete data.owner_id;
          await this.app.store.createDocument(data);
          this.afterSuccess('Documento V/C guardado exitosamente.', 'vc_documents.create');
        });
      case 'documents.csv': {
        const values = this.forms.readForm(form);
        const file = this.fileFrom(form, 'csv_file');
        if (!file) {
          this.fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
          return undefined;
        }
        return this.readFile(file, 'No se pudo leer el archivo CSV.')
          .then(async (content) => {
            const count = await this.app.store.importCsv(content);
            this.afterSuccess('¡CSV importado correctamente! Se ingresaron ' + count + ' documentos.', 'vc_documents.create');
          })
          .catch((error: unknown) => this.fail(error, values));
      }
      case 'documents.batch':
        return this.run(form, async (values) => {
          const ids = Array.isArray(values['document_ids[]']) ? values['document_ids[]'] : [];
          const accountByDocument: Record<string, string> = {};
          this.forms.grouped(form, 'custom_net_account').forEach((item) => {
            accountByDocument[String(item._key)] = String(item.code || '').trim();
          });
          if (ids.length === 0 || !values.glosa) throw new Error('Debe seleccionar documentos y una glosa.');
          const missing = ids.filter((id: unknown) => !accountByDocument[String(id)]);
          if (missing.length) throw new Error('Debe indicar el código de la cuenta contable para el Neto en cada documento seleccionado.');
          const result = await this.app.store.batchProcess(ids, accountByDocument, values.glosa);
          const errors = Array.isArray(result.errors) ? result.errors : [];
          const processed = Number(result.success_count) || 0;
          if (errors.length) {
            this.app.flash('error', errors.join(' | '));
          }
          if (processed === 0) {
            this.app.remember(values);
            this.app.refresh$.next();
            return undefined;
          }
          this.afterSuccess('Se procesaron correctamente ' + processed + ' documentos.', 'vc_documents.batch_processed', { processed: processed });
          return undefined;
        });
      case 'imports.purchases_start': {
        const values = this.forms.readForm(form);
        const period = this.periodFrom(values);
        const error = this.periodError(period);
        if (error) {
          this.fail(error, values);
          return undefined;
        }
        this.goTo('ingress.import.purchases', period);
        return undefined;
      }
      case 'imports.purchases_upload': {
        const values = this.forms.readForm(form);
        const period = this.periodFrom(values);
        const periodProblem = this.periodError(period);
        const file = this.fileFrom(form, 'csv_file');
        if (periodProblem) {
          this.fail(periodProblem, values);
          return undefined;
        }
        if (!file) {
          this.fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
          return undefined;
        }
        return this.readFile(file, 'No se pudo leer el archivo CSV.')
          .then((content) => {
            const parsed = this.app.store.parsePurchases(content);
            const payload: Values = Object.assign({ headers: parsed.headers, rows: parsed.rows, type_vc: 'C' }, period);
            const validation = this.app.store.validatePurchases(payload);
            this.rememberPreview(file.name || 'documentos.csv', payload.headers, payload.rows, period);
            this.app.flash(validation.ok ? 'success' : 'error', validation.ok
              ? 'CSV leído correctamente. Revisa y confirma los documentos antes de guardarlos.'
              : 'Se detectaron ' + validation.errorCount + ' dato(s) faltante(s) o inválido(s). Corrígelos en la grilla antes de procesar.');
            this.goTo('ingress.import.purchases.preview');
          })
          .catch((error: unknown) => this.fail(error, values));
      }
      case 'imports.purchases_confirm':
        return this.run(form, async (values) => {
          const period = this.periodFrom(values);
          const periodProblem = this.periodError(period);
          if (periodProblem) throw periodProblem;
          const payload: Values = Object.assign({
            headers: this.headersFrom(form),
            rows: this.rowsFrom(form),
            type_vc: 'C'
          }, period);
          if (payload.rows.length === 0) throw new Error('No hay documentos para procesar.');
          const validation = this.app.store.validatePurchases(payload);
          if (!validation.ok) {
            this.rememberPreview(values.file_name, payload.headers, payload.rows, period);
            this.app.flash('error', 'Corrige ' + validation.errorCount + ' dato(s) marcado(s) antes de procesar.');
            this.goTo('ingress.import.purchases.preview');
            return undefined;
          }
          const previousYear = this.app.store.workingYear();
          if (previousYear !== period.year_register) {
            await this.app.store.setWorkingYear(period.year_register);
          }
          let processed;
          try {
            processed = await this.app.store.importPurchases(payload);
          } catch (error) {
            if (this.app.store.workingYear() !== previousYear) {
              await this.app.store.setWorkingYear(previousYear);
            }
            throw error;
          }
          this.afterSuccess('¡CSV de compras importado! Se ingresaron ' + processed + ' documentos.', 'ingress.import.purchases.imported');
          return undefined;
        });
      case 'imports.purchases_cancel': {
        const dataset = this.datasetOf(source);
        const period = dataset.monthRegister === undefined ? undefined : this.periodFrom(dataset);
        window.sessionStorage.removeItem('plasticina_old');
        this.goTo('ingress.import.purchases', period);
        return undefined;
      }
      case 'imports.sales_start': {
        const values = this.forms.readForm(form);
        const format = this.salesFormatFrom(values);
        const formatProblem = this.salesFormatError(format);
        if (formatProblem) {
          this.fail(formatProblem, values);
          return undefined;
        }
        const period = this.periodFrom(values);
        const error = this.periodError(period);
        if (error) {
          this.fail(error, values);
          return undefined;
        }
        this.goTo('ingress.import.sales', Object.assign({ sale_format: format }, period));
        return undefined;
      }
      case 'imports.sales_upload': {
        const values = this.forms.readForm(form);
        const format = this.salesFormatFrom(values);
        const formatProblem = this.salesFormatError(format);
        const period = this.periodFrom(values);
        const file = this.fileFrom(form, 'csv_file');
        if (formatProblem) {
          this.fail(formatProblem, values);
          return undefined;
        }
        const periodProblem = this.periodError(period);
        if (periodProblem) {
          this.fail(periodProblem, values);
          return undefined;
        }
        if (!file) {
          this.fail(new Error('Debe seleccionar un archivo CSV válido.'), values);
          return undefined;
        }
        return this.readFile(file, 'No se pudo leer el archivo CSV.')
          .then((content) => {
            const parsed = this.app.store.parseSales(content, format);
            const payload: Values = Object.assign({
              headers: parsed.headers,
              rows: parsed.rows,
              sale_format: format,
              type_vc: 'V'
            }, period);
            const validation = this.app.store.validateSales(payload);
            this.rememberPreview(file.name || 'documentos.csv', payload.headers, payload.rows, period, {
              kind: 'sales',
              type_vc: 'V',
              sale_format: format
            });
            this.app.flash(validation.ok ? 'success' : 'error', validation.ok
              ? 'CSV leído correctamente. Revisa y confirma los documentos antes de guardarlos.'
              : 'Se detectaron ' + validation.errorCount + ' dato(s) faltante(s) o inválido(s). Corrígelos en la grilla antes de procesar.');
            this.goTo('ingress.import.sales.preview');
          })
          .catch((error: unknown) => this.fail(error, values));
      }
      case 'imports.sales_confirm':
        return this.run(form, async (values) => {
          const format = this.salesFormatFrom(values);
          const formatProblem = this.salesFormatError(format);
          if (formatProblem) throw formatProblem;
          const period = this.periodFrom(values);
          const periodProblem = this.periodError(period);
          if (periodProblem) throw periodProblem;
          const headers = this.app.store.SALES_HEADERS ? this.app.store.SALES_HEADERS[format || ''] : undefined;
          const payload: Values = Object.assign({
            headers: this.headersFrom(form, headers),
            rows: this.rowsFrom(form),
            sale_format: format,
            type_vc: 'V'
          }, period);
          if (payload.rows.length === 0) throw new Error('No hay documentos para procesar.');
          const validation = this.app.store.validateSales(payload);
          if (!validation.ok) {
            this.rememberPreview(values.file_name, payload.headers, payload.rows, period, {
              kind: 'sales',
              type_vc: 'V',
              sale_format: format
            });
            this.app.flash('error', 'Corrige ' + validation.errorCount + ' dato(s) marcado(s) antes de procesar.');
            this.goTo('ingress.import.sales.preview');
            return undefined;
          }
          const previousYear = this.app.store.workingYear();
          if (previousYear !== period.year_register) {
            await this.app.store.setWorkingYear(period.year_register);
          }
          let processed;
          try {
            processed = await this.app.store.importSales(payload);
          } catch (error) {
            if (this.app.store.workingYear() !== previousYear) {
              await this.app.store.setWorkingYear(previousYear);
            }
            throw error;
          }
          this.afterSuccess('¡CSV de ventas importado! Se ingresaron ' + processed + ' documentos.', 'ingress.import.sales.imported');
          return undefined;
        });
      case 'imports.sales_cancel': {
        const dataset = this.datasetOf(source);
        const period = dataset.monthRegister === undefined ? {} : this.periodFrom(dataset);
        window.sessionStorage.removeItem('plasticina_old');
        this.goTo('ingress.import.sales', Object.assign({ sale_format: dataset.saleFormat || 'factura' }, period));
        return undefined;
      }
      case 'manualJournal.store':
        return this.run(form, async (values) => {
          const entries = this.forms.grouped(form, 'entries').map((entry) => ({
            account_code: entry.account_code,
            debit: this.forms.number(entry.debit),
            credit: this.forms.number(entry.credit)
          }));
          const journalId = await this.app.store.registerManualJournal(
            this.forms.integer(values.year), this.forms.integer(values.month), values.date, values.glosa, entries
          );
          this.afterSuccess('Asiento contable manual creado exitosamente.', 'accounting.manual_journals.created', { journal_id: journalId });
        });
      case 'manualJournal.update':
        return this.run(form, async (values) => {
          const entries = this.forms.grouped(form, 'entries').map((entry) => ({
            account_code: entry.account_code,
            component_name: entry.component_name || 'manual',
            debit: this.forms.number(entry.debit),
            credit: this.forms.number(entry.credit)
          }));
          await this.app.store.updateManualJournal(
            this.forms.integer(values.id), this.forms.integer(values.year), this.forms.integer(values.month),
            values.date, values.description, entries
          );
          this.afterSuccess('Asiento manual actualizado exitosamente.', 'accounting.system_journals');
        });
      case 'journals.update':
        return this.run(form, async (values) => {
          const entries = this.forms.grouped(form, 'entries').map((entry) => ({
            account_code: entry.account_code,
            component_name: entry.component_name || 'custom',
            debit: this.forms.number(entry.debit),
            credit: this.forms.number(entry.credit)
          }));
          await this.app.store.updateJournal(this.forms.integer(values.id), values.date, values.description, entries);
          this.afterSuccess('Asiento contable actualizado exitosamente.', 'accounting.system_journals');
        });
      case 'journals.delete-only':
        return this.run(form, async (values) => {
          await this.app.store.deleteJournal(this.forms.integer(values.journal || values.id), false);
          this.afterSuccess('Asiento contable eliminado. El documento asociado quedó pendiente de contabilizar.', 'accounting.system_journals');
        });
      case 'journals.delete-with-document':
        return this.run(form, async (values) => {
          await this.app.store.deleteJournal(this.forms.integer(values.journal || values.id), true);
          this.afterSuccess('El documento y su asiento contable han sido eliminados definitivamente.', 'accounting.system_journals');
        });
      case 'owners.store':
        return this.run(form, async (values) => {
          await this.app.store.createOwner(values);
          this.afterSuccess('Empresa y su plan de cuentas inicial creados exitosamente.', 'owners.index');
        });
      case 'owners.update':
        return this.run(form, async (values) => {
          await this.app.store.updateOwner(this.forms.integer(values.owner_id), values);
          this.afterSuccess('Empresa actualizada exitosamente.', 'owners.index');
        });
      case 'owners.activate':
        return this.run(form, async (values) => {
          await this.app.store.setActiveOwner(this.forms.integer(values.owner_id));
          this.afterSuccess('Empresa activada correctamente.', 'owners.index');
        });
      case 'owners.destroy':
        return this.run(form, async (values) => {
          await this.app.store.deleteOwner(this.forms.integer(values.owner_id));
          this.afterSuccess('Empresa eliminada correctamente.', 'owners.index');
        });
      case 'payments.store':
        return this.run(form, async (values) => {
          await this.app.store.processPayment(
            this.forms.integer(values.document_id), this.forms.number(values.amount), values.date, values.bank_account_code
          );
          this.afterSuccess('Pago/Cobro procesado y registrado contablemente con éxito.', 'accounting.payments.index');
        });
      case 'period.update':
        return this.run(form, async (values) => {
          const year = this.forms.integer(values.working_year);
          const range = this.app.store.workingYearRange();
          if (year < 2000) throw new Error('El año de trabajo debe ser mayor o igual a 2000.');
          if (year < range.min || year > range.max) {
            throw new Error('El año de trabajo debe estar entre ' + range.min + ' y ' + range.max + '.');
          }
          await this.app.store.setWorkingYear(year);
          this.afterSuccess('Año de trabajo actualizado.', 'welcome');
        });
      case 'system.sqlite-export': {
        const filename = 'plasticina_backup_' + this.app.ui.today() + '.sqlite';
        this.download.download([this.app.store.exportSqlite() as BlobPart], filename, 'application/x-sqlite3');
        this.app.flash('success', 'Respaldo SQLite descargado correctamente.');
        this.app.navigate(this.app.route('system.config'));
        return undefined;
      }
      case 'system.sqlite-import': {
        const values = this.forms.readForm(form);
        const file = this.fileFrom(form, 'sqlite_file');
        if (!file) {
          this.fail(new Error('Debe seleccionar un archivo SQLite.'), values);
          return undefined;
        }
        return this.readFile(file, 'No se pudo leer el archivo SQLite.')
          .then(async (content) => {
            await this.app.store.importSqlite(new Uint8Array(content as ArrayBuffer));
            this.afterSuccess('Base de datos SQLite importada correctamente.', 'welcome');
          })
          .catch((error: unknown) => this.fail(error, values));
      }
      case 'system.export': {
        const filename = 'plasticina_backup_' + this.app.ui.today() + '.json';
        this.download.download([this.app.store.exportJson() as BlobPart], filename, 'application/json;charset=utf-8');
        this.app.flash('success', 'Respaldo JSON descargado correctamente.');
        this.app.navigate(this.app.route('system.config'));
        return undefined;
      }
      case 'system.import': {
        const values = this.forms.readForm(form);
        const file = this.fileFrom(form, 'backup_file');
        if (!file) {
          this.fail(new Error('Debe seleccionar un respaldo JSON.'), values);
          return undefined;
        }
        return this.readFile(file, 'No se pudo leer el respaldo.')
          .then(async (content) => {
            await this.app.store.importJson(this.app.store.decodeText(content));
            this.afterSuccess('Respaldo importado correctamente.', 'welcome');
          })
          .catch((error: unknown) => this.fail(error, values));
      }
      case 'system.reset':
        return (async () => {
          await this.app.store.reset();
          this.afterSuccess('Base de datos reiniciada correctamente.', 'welcome');
        })();
      case 'templates.store':
        return this.run(form, async (values) => {
          await this.app.store.createTemplate(values);
          this.afterSuccess('Plan de cuentas creado y clonado exitosamente desde la base.', 'masters.account_templates.index');
        });
      case 'templates.update':
        return this.run(form, async (values) => {
          await this.app.store.updateTemplate(this.forms.integer(values.account_template_id), values, this.forms.grouped(form, 'items'));
          this.afterSuccess('Plan de cuentas actualizado correctamente.', 'masters.account_templates.index');
        });
      case 'templates.destroy':
        return this.run(form, async (values) => {
          await this.app.store.deleteTemplate(this.forms.integer(values.account_template_id));
          this.afterSuccess('Plan maestro eliminado exitosamente.', 'masters.account_templates.index');
        });
      default:
        return undefined;
    }
  }

  private run(form: HTMLFormElement, callback: (values: Values) => unknown): unknown {
    const values = this.forms.readForm(form);
    this.app.remember(values);
    try {
      const result = callback(values);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        return Promise.resolve(result).catch((error: unknown) => {
          this.fail(error, values);
          return undefined;
        });
      }
      return result;
    } catch (error) {
      this.fail(error, values);
      return undefined;
    }
  }

  private fail(error: unknown, values?: unknown): void {
    this.app.remember(values || {});
    this.app.flash('error', this.app.message(error));
    this.app.refresh$.next();
  }

  private afterSuccess(message: string, routeName?: string, parameters?: unknown): void {
    this.app.flash('success', message);
    if (routeName) {
      this.goTo(routeName, parameters);
      return;
    }
    this.app.refresh$.next();
  }

  private goTo(routeName: string, parameters?: unknown): void {
    this.app.navigate(this.app.route(routeName, parameters));
  }

  private readFile(file: File, errorMessage: string): Promise<ArrayBuffer | string> {
    return new Promise<ArrayBuffer | string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(result instanceof ArrayBuffer ? result : String(result ?? ''));
      };
      reader.onerror = () => reject(new Error(errorMessage));
      reader.readAsArrayBuffer(file);
    });
  }

  private fileFrom(form: HTMLFormElement, name: string): File | null {
    const elements = form && form.elements ? form.elements as unknown as Record<string, unknown> : {};
    let input = elements[name] as HTMLInputElement | undefined;
    if (!input && typeof form?.elements?.namedItem === 'function') {
      input = form.elements.namedItem(name) as HTMLInputElement | null || undefined;
    }
    return input && input.files && input.files.length ? input.files[0] : null;
  }

  private datasetOf(source?: unknown): Record<string, string> {
    if (source && typeof source === 'object' && 'dataset' in source) {
      const dataset = (source as { dataset?: Record<string, string> }).dataset;
      if (dataset) return dataset;
    }
    return {};
  }

  private periodFrom(values: Values): Period {
    return {
      month_register: this.forms.integer(values.month_register),
      year_register: this.forms.integer(values.year_register)
    };
  }

  private periodError(period: Period): Error | null {
    const status = this.app.store.reportPeriodStatus(period.year_register, period.month_register);
    if (status && status.allowed) return null;
    return new Error(this.app.periodHelp(status) || 'Período no disponible.');
  }

  private salesFormatFrom(values: Values): SalesFormat | null {
    const format = String(values && values.sale_format ? values.sale_format : '').trim().toLowerCase();
    return format === 'factura' || format === 'boleta' ? format : null;
  }

  private salesFormatError(format: SalesFormat | null): Error | null {
    return format ? null : new Error('Selecciona si estás importando ventas facturas o ventas boletas.');
  }

  private headersFrom(form: HTMLFormElement, fallback?: string[]): string[] {
    const result: string[] = [];
    for (let index = 0; index < form.elements.length; index++) {
      const element = form.elements[index] as HTMLInputElement;
      if (element.name === 'headers[]') result.push(element.value);
    }
    if (result.length) return result;
    const source = fallback || this.app.store.PURCHASE_HEADERS || [];
    return Array.isArray(source) ? source.slice() : [];
  }

  private rowsFrom(form: HTMLFormElement): PreviewRow[] {
    return this.forms.grouped(form, 'rows')
      .sort((a, b) => Number(a._key) - Number(b._key))
      .map((item) => {
        const row: PreviewRow = { line: Number(item._key) + 2, cells: {}, derived: {} };
        Object.keys(item).forEach((key) => {
          if (key === '_key') return;
          if (/^c\d+$/.test(key)) row.cells[key] = item[key];
          else row.derived[key] = item[key];
        });
        return row;
      });
  }

  private rememberPreview(
    fileName: unknown,
    headers: unknown,
    rows: unknown,
    period: Values,
    options?: PreviewOptions
  ): void {
    const chosen = this.periodFrom(period);
    const settings = options || {};
    this.app.remember({
      kind: settings.kind || 'purchases',
      fileName: fileName || 'documentos.csv',
      headers,
      rows,
      month_register: chosen.month_register,
      year_register: chosen.year_register,
      type_vc: settings.type_vc || 'C',
      sale_format: settings.sale_format
    });
  }
}
