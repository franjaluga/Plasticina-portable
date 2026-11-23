# Plasticina Portable

Port de escritorio de la aplicación contable Plasticina, construido únicamente con HTML, CSS y JavaScript.

- `plasticina-master/` es la aplicación Laravel/MariaDB original y la referencia visual/funcional.
- La raíz contiene el port estático: `index.html`, `assets/` y `desktop/main.js`.
- No se usa PHP ni servidor local: los datos se guardan en un archivo SQLite real (`plasticina.sqlite`) con el motor sql.js/asm.js empaquetado en `assets/vendor/`.
- La UI conserva las clases y textos originales; `assets/styles/app.css` reproduce la identidad visual de Tailwind sin dependencias externas.

## Estructura de `assets/`

- `core/namespace.js`: espacios de nombre compartidos (`window.Plasticina`).
- `core/db/`: capa SQLite granular: `schema/` (DDL por tabla), `queries/` (SQL por entidad), `repositories/` (mapeo y escrituras transaccionales) y `adapters/` (Electron/IndexedDB).
- `core/ui/`: rutas, formato, sesión, formularios y descargas; compone `window.UI`.
- `data/`: plan de cuentas y plantillas de asientos sembradas.
- `store/`: proyección en memoria hidratada desde SQLite, maestros, documentos, asientos, contabilidad, CSV y fachada `window.Store`.
- `views/`: una vista por archivo, agrupada por contexto (inicio, ingreso, reportes, documentos, contabilidad, owners, maestros, sistema).
- `actions/`: helpers de formulario y un módulo por grupo de acciones; registros en `window.Actions`.
- `app/`: configuración de rutas, router, eventos, exportación CSV y arranque.
- `builds/`: artefactos y scripts de empaquetado. `linux_builds/` contiene el AppImage comprimido en `.tar`; `windows_builds/` contiene el ZIP autocontenido. La build excluye `plasticina-master/`, `builds/`, `test/` y `node_modules/`.
- `tests/`: página y suites de pruebas ejecutables en el navegador.

## Ejecutar

```bash
npm install
npm start
```

Para generar los paquetes autocontenidos:

```bash
npm run build:linux
npm run build:windows
```

El build de Linux deja `builds/linux_builds/Plasticina-<version>-linux-x64.tar` con el AppImage dentro. El de Windows deja `builds/windows_builds/Plasticina-<version>-win-x64.zip` con la aplicación y Electron incluidos.

También se puede abrir `index.html` directamente en un navegador moderno; en ese caso el archivo SQLite se persiste en IndexedDB.

En Electron, `plasticina.sqlite` vive en el directorio `userData` de la aplicación. Desde **Configuración General del Sistema** se puede descargar y restaurar ese archivo SQLite.

## Pruebas

```bash
npm test          # requiere Node; carga los mismos scripts que index.html en un DOM simulado
npm run test:static  # comprobaciones de estructura y sintaxis sin dependencias
```

También se puede abrir `assets/tests/index.html` en el navegador para ver el resultado de cada caso.
