# DAP – Digital Adoption Platform
### Extensión de navegador | Chrome / Edge (Manifest V3)

> Guía interactiva paso a paso superpuesta sobre cualquier sitio web, sin modificar su código fuente.

---

## ¿Qué hace?

Al navegar a una URL registrada, aparece un **botón flotante** en la esquina superior derecha. Al hacer clic, la extensión:

- Resalta visualmente cada campo del formulario.
- Muestra un **tooltip contextual** con instrucciones precisas.
- Presenta un **panel lateral** con todos los pasos y el progreso.
- Permite navegar libremente entre pasos (Anterior / Siguiente).
- Guarda el progreso: si el usuario recarga la página, retoma desde donde estaba.
- Muestra un banner de éxito al completar el flujo.

---

## Estructura del proyecto

```
demo_carrasco/
├── manifest.json          ← Configuración de la extensión (Chrome MV3)
├── README.md
├── src/
│   ├── core/
│   │   └── dap-core.js    ← Motor del DAP (tooltip, overlay, panel, navegación)
│   ├── flows/
│   │   ├── register.js    ← Flujo: Registro de cuenta
│   │   └── login.js       ← Flujo: Inicio de sesión
│   ├── popup/
│   │   └── popup.html     ← Interfaz del ícono en la barra del navegador
│   └── styles/
│       └── styles.css     ← Estilos de todos los componentes DAP
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Cómo instalar

1. Abrir Chrome o Edge y navegar a `chrome://extensions/`
2. Activar **Modo desarrollador** (esquina superior derecha)
3. Hacer clic en **"Cargar extensión sin empaquetar"**
4. Seleccionar la carpeta raíz del proyecto (`demo_carrasco/`)
5. La extensión aparecerá en la barra de herramientas

---

## Cómo usar

1. Navegar a una URL compatible (ej: `https://www.opencart.com/index.php?route=account/register`)
2. Hacer clic en el **ícono DAP** (esquina superior derecha de la página)
3. Seguir los pasos del tooltip
4. Usar **← Anterior** / **Siguiente →** para navegar
5. Al finalizar el último paso, aparece un banner de confirmación

También podés iniciar un flujo desde el **popup** (clic en el ícono de la extensión en la barra del navegador).

---

## Flujos disponibles

| ID | Nombre | URL | Pasos |
|----|--------|-----|-------|
| `register` | Registro de cuenta | `/index.php?route=account/register` | 8 |
| `login` | Inicio de sesión | `/index.php?route=account/login` | 3 |

---

## Cómo agregar un nuevo flujo

### Paso 1 — Crear el archivo del flujo

Crear `src/flows/mi-flujo.js`:

```js
window.__DAP_FLOWS__ = window.__DAP_FLOWS__ || {};

window.__DAP_FLOWS__["mi-flujo"] = {
  id:   "mi-flujo",
  name: "Nombre visible en el popup",
  icon: "🛒",                          // emoji decorativo
  url:  /route=checkout\/cart/,         // regex que identifica la página
  steps: [
    {
      selector:    "input[name='campo']",  // selector CSS del elemento a resaltar
      title:       "Paso 1 – Título",
      description: "Explicación para el usuario.",
      position:    "right",               // right | left | top | bottom
    },
    // agregar más pasos...
  ],
};
```

### Paso 2 — Registrarlo en `manifest.json`

Agregar el nuevo archivo **antes** de `dap-core.js` en el array `js`:

```json
"js": [
  "src/flows/login.js",
  "src/flows/register.js",
  "src/flows/mi-flujo.js",
  "src/core/dap-core.js"
]
```

### Paso 3 — Recargar la extensión

En `chrome://extensions/` hacer clic en el botón **🔄 Reload** de la extensión.

> No es necesario tocar `dap-core.js`, `popup.html` ni ningún otro archivo.

---

## Arquitectura

```
flows/*.js  ──────────────────┐
  Registran flujos en          │
  window.__DAP_FLOWS__         ▼
                          dap-core.js
                          Lee __DAP_FLOWS__,
                          inyecta UI en el DOM,
                          gestiona navegación
                               │
                          popup.html
                          Consulta al core
                          qué flujos hay
                          en la página actual
```

El motor (`dap-core.js`) es **agnóstico**: no conoce ningún flujo. Solo sabe renderizar pasos. Los flujos son datos puros en archivos independientes.

---

## Opciones de posición del tooltip

| Valor | Descripción |
|-------|-------------|
| `"right"` | A la derecha del elemento (recomendado para inputs) |
| `"left"` | A la izquierda del elemento |
| `"top"` | Encima del elemento |
| `"bottom"` | Debajo del elemento |

---

## Requisitos técnicos

- Chrome 88+ o Edge 88+ (soporte Manifest V3)
- No requiere servidor ni dependencias externas
- No modifica el código del sitio web destino
