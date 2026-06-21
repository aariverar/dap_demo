/**
 * DAP – Flujo: Registro de cuenta
 * URL destino: /index.php?route=account/register
 *
 * Para agregar o modificar pasos edita solo este archivo.
 * El motor (dap-core.js) lo tomará automáticamente al cargar.
 */

window.__DAP_FLOWS__ = window.__DAP_FLOWS__ || {};

window.__DAP_FLOWS__["register"] = {
  id:   "register",
  name: "Registro de cuenta",
  icon: "📝",
  url:  /route=account\/register/,
  steps: [
    {
      selector:    "input[name='username']",
      title:       "Paso 1 – Nombre de usuario",
      description: "Ingresa tu nombre de usuario que usarás para ingresar a la aplicación.",
      position:    "right",
    },
    {
      selector:    "input[name='firstname']",
      title:       "Paso 2 – Nombre",
      description: "Ingresa tu nombre de pila tal como aparece en tu documento de identidad.",
      position:    "right",
    },
    {
      selector:    "input[name='lastname']",
      title:       "Paso 3 – Apellido",
      description: "Ingresa tu apellido completo.",
      position:    "right",
    },
    {
      selector:    "input[name='email']",
      title:       "Paso 4 – Correo electrónico",
      description: "Usa un correo válido; lo necesitarás para confirmar tu cuenta y recuperar tu contraseña.",
      position:    "right",
    },
    {
      selector:    "select[name='country_id']",
      title:       "Paso 5 – País",
      description: "Selecciona tu país de residencia.",
      position:    "right",
    },
    {
      selector:    "input[name='password']",
      title:       "Paso 6 – Contraseña",
      description: "Mínimo 4 caracteres. Recomendamos usar letras, números y símbolos para mayor seguridad.",
      position:    "right",
    },
    {
      selector:    "div[id='captcha']",
      title:       "Paso 7 – Captcha",
      description: "Completa el captcha para verificar que no eres un robot.",
      position:    "right",
    },
    {
      selector:    "input[type='submit'], button[type='submit']",
      title:       "Paso 8 – REGISTER",
      description: "¡Listo! Haz clic en 'REGISTER' para crear tu cuenta.",
      position:    "right",
    },
  ],
};
