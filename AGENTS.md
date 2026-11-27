# AGENTS.md

## Workspace / misión
- La raíz es el port a escritorio de Plasticina y debe implementarse con Angular + HTML, CSS y JavaScript. No usar PHP en el código del port.
- `plasticina-master/` es la app Laravel/MariaDB original: referencia de comportamiento e identidad visual, pero no se modifica.
- La identidad visual debe conservarse; `assets/styles/app.css` contiene los estilos derivados de las clases Tailwind originales.

## Arquitectura del port
- `angular-shell/` es la app Angular standalone: router hash, shell visual, componentes y servicios. El documento de la app es `angular-shell/dist/angular-shell/browser/index.html` (generado desde `angular-shell/src/index.html`); el `index.html` de la raíz se conserva solo como referencia/harness y no se empaqueta.
- `angular-shell/src/app/core/plasticina.service.ts` es la fachada Angular hacia la capa de datos; `action.service.ts` implementa las 33 acciones en Angular; `form.service.ts`, `view-state.service.ts` y `view-data.resolver.ts` cargan el contexto/recursos de cada ruta. `shared/ui/` contiene los controles Angular (`app-select`, `app-account-picker`) que reemplazan a los helpers legacy.
- `assets/vendor/`: motor SQLite (sql.js/asm.js) empaquetado localmente; no se descarga en tiempo de ejecución.
- `assets/core/namespace.js`: espacios de nombre (`window.Plasticina`) usados por los módulos; evita colisiones entre contextos.
- `assets/core/db/`: capa SQLite. `config.js`, `driver.js` y `adapters/` abren y guardan el archivo; `schema/` contiene el DDL por tabla; `queries/` agrupa las sentencias SQL por entidad; `repositories/` ejecuta esas queries y mapea filas; `index.js` expone `window.Plasticina.db.ready`.
- `assets/core/ui/`: módulos pequeños de rutas, formato, sesión, formularios y descargas; `index.js` compone `window.UI`. Las rutas son hash (`#/...`).
- `assets/data/`: plan de cuentas sembrado y plantillas de asientos manuales.
- `assets/store/`: `context.js` mantiene una proyección en memoria hidratada desde SQLite y helpers primitivos; `masters.js`, `documents.js`, `journals.js`, `accounting.js` y `csv.js` aportan la lógica contable y delegan toda escritura a los repositorios; `index.js` publica `window.Store`.
- `angular-shell/src/app/features/`: una carpeta por contexto (home, ingress, reports, documents, accounting, owners, masters, system) con un componente Angular standalone y su template por vista; son las únicas vistas que carga la app.
- `assets/views/` y `assets/actions/`: implementaciones legacy originales. Se conservan como referencia de comportamiento e identidad visual y las usan las suites históricas, pero el bundle Angular no las carga ni las ejecuta.
- `assets/app/`: configuración de rutas y utilidades del documento; `app/config.js` sigue siendo la única fuente legacy cargada por el renderer Angular. Router, eventos, exportación CSV y arranque viven en Angular.
- `builds/`: artefactos y scripts de empaquetado; `linux_builds/` guarda el AppImage dentro de un `.tar`, `windows_builds/` guarda el ZIP autocontenido. El staging de electron-builder va en `builds/.cache/`. La build incluye el port completo y excluye explícitamente `plasticina-master/`, `builds/`, `test/` y `node_modules/`.
- `assets/tests/`: page de pruebas (`index.html`), harness y suites por contexto; `test/run.js` ejecuta las mismas suites en Node sin dependencias y `angular-shell/src/app/legacy-suites.spec.ts` las ejecuta desde Jasmine cuando hay Chrome/Chromium.
- `desktop/main.js`: ventana Electron que carga el `index.html` generado por Angular con `loadFile`; expone IPC para leer/escribir `plasticina.sqlite` en `userData`; no levanta servidores.

## Datos y persistencia
- No hay base de datos externa: la persistencia es un archivo SQLite real (`plasticina.sqlite`) gestionado por sql.js/asm.js.
- En Electron el archivo se guarda en `app.getPath('userData')` vía `desktop/preload.js`. Al abrir el `index.html` generado directamente, el adaptador de navegador guarda el mismo archivo SQLite en IndexedDB (con respaldo en `localStorage` del binario si IndexedDB no está disponible).
- Toda escritura pasa por `assets/core/db/repositories/` dentro de transacciones SQLite; `Store` solo conserva una proyección en memoria para renderizar.
- El esquema replica las tablas de dominio de Laravel: owners, accounts, entities, document_types, vc_documents, journals, journal_entries, account_templates, account_template_items y settings.
- Seed inicial: owner `55555555-5` / `Test`, 161 cuentas, año de trabajo igual al año actual.

## Comandos
- Instalar y ejecutar: `npm install && npm start` (`start` requiere haber generado antes el bundle Angular).
- Generar el renderer Angular: `npm run build:shell` (ejecuta `ng build`, elimina `type="module"` y aísla los chunks generados en IIFE para evitar colisiones globales bajo `file://`).
- Empaquetar Linux (AppImage dentro de `.tar`): `npm run build:linux`.
- Empaquetar Windows (ZIP autocontenido): `npm run build:windows`.
- Empaquetado genérico / staging: `npm run dist` deja los artefactos en `builds/.cache/` y ejecuta `build:shell` automáticamente.
- Pruebas: `npm test` (usa Angular/Jasmine si hay Chrome/Chromium; si no, cae al arnés Node), `npm run test:angular` y `npm run test:static` (Python, sin dependencias).
- También se puede abrir `angular-shell/dist/angular-shell/browser/index.html` directamente en un navegador moderno (la base se guarda en IndexedDB).

## Verificación
- Tras cualquier cambio, ejecutar `npm test` y `npm run test:static`; también se puede abrir `assets/tests/index.html` en el navegador.
- Si Node vuelve a estar disponible en el entorno, ejecutar además `node --check` sobre cada archivo de `assets/` y `desktop/main.js`.
- Al añadir scripts de capa de datos al documento Angular, actualizar `angular-shell/src/index.html`; si también los necesitan las suites históricas, actualizar `angular-shell/src/test-support/load-legacy.js`.
- `test/check_static.py` verifica además que el bundle generado no use `type="module"`, no cargue `assets/views/` ni `assets/actions/`, que el código Angular no use fachadas legacy, que Electron cargue el documento Angular y que las 36 rutas estén declaradas.
- No generar archivos PHP ni reintroducir dependencias del servidor Laravel.
