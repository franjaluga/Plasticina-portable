### Regla de UI y Renderizado en Electron (Windows Linux)

Al desarrollar o depurar interfaces en Electrón para windows y linux, ten en cuenta que los elemenots '<select>' (combobox) nativos de HTML/Chromium sufren fallos de renderizados, tales como menús invisibles, desplazados o bloqueados.

**Instrucciones obligatorias**

1. **NO uses etiquetas '<select>' nativas de HTML** para desplegables o comboboxes en la interfaz. Implementa siempre componentes desplegables basados 100% en el DOM (ej. Radix UI, Headless UI, Shadcn, ETC. o contenedores '<div>'/'<ul>' personalizados con posicionamiento absoluto flotante, para que el menú se renderice dentro del propio arbol del DOM de la ventana y no dependa de poups nativos del sistema operativo

2. SI el proyecto exige el uso de '<select>' nativos o se detecta que un desplegable no abre en **Windows**, verifica la configuración de 'BrowserWindow' , evita combinar 'transparent: true' con elementos nativos y añade 'app.disableHardwareAcceleration()' antes de 'app.whenReady()' si el fallo persoste por incompatiblidad de GPU/ANGLE.

3. Si el desplegable falla o aparece desalineado en linux, especialmente bajo wayland, configura el proceso principal ('main') agregando 'app.commandLine.appendSwitch('ozone-platform-hint','auto)' o fuerza con x11 antes de iniciar la aplicación