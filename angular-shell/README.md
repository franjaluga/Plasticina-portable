# Shell Angular de Plasticina

Shell Angular 19 que reutiliza el núcleo SQLite existente (`assets/core/db/`) sin modificar la app Electron ni el `index.html` original.

## Compilar

Desde la raíz del repositorio:

```bash
npm run build:shell
```

El resultado estático queda en `angular-shell/dist/angular-shell/browser/`.

## Arquitectura

- `src/index.html` carga los scripts del núcleo SQLite en el mismo orden que el `index.html` principal, antes del bundle Angular.
- `src/app/sqlite.service.ts` expone `ready$`, `status$`, `revision$`, `externalChange$`, `query()`, `first()`, `write()` y `flush()` como Observables de RxJS, con manejo centralizado de errores.
- `src/app/app.component.ts` consume el servicio con el pipe `async`.

La capa SQLite original ya serializa escrituras con locks, transacciones y revisiones; el shell solo la envuelve, no la reimplementa.
