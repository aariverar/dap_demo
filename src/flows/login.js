/**
 * DAP – Flujo: Inicio de sesión
 * URL destino: /index.php?route=account/login
 *
 * Para agregar o modificar pasos edita solo este archivo.
 * El motor (dap-core.js) lo tomará automáticamente al cargar.
 */

window.__DAP_FLOWS__ = window.__DAP_FLOWS__ || {};

window.__DAP_FLOWS__["login"] = {
  id:   "login",
  name: "Inicio de sesión",
  icon: "🔐",
  url:  /route=account\/login/,
  steps: [
    {
      selector:    "input[name='email']",
      title:       "Paso 1 – Correo electrónico",
      description: "Ingresa el correo con el que te registraste.",
      position:    "right",
    },
    {
      selector:    "input[name='password']",
      title:       "Paso 2 – Contraseña",
      description: "Ingresa tu contraseña. Si la olvidaste, usa el enlace '¿Olvidaste tu contraseña?'.",
      position:    "right",
    },
    {
      selector:    "input[type='submit'], button[type='submit']",
      title:       "Paso 3 – Iniciar sesión",
      description: "Haz clic para acceder a tu cuenta.",
      position:    "right",
    },
  ],
};
