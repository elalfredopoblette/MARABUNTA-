// Carga el SDK de Google Maps (librería Places) solo si hay una key
// configurada en maps-config.js. Si no hay key, la app sigue funcionando
// normal — el campo de dirección del hotel simplemente queda como texto
// libre en vez de autocompletar.
//
// Carga ANTES de este archivo: src/maps-config.js
(function () {
  if (!window.MARABUNTA_GOOGLE_MAPS_KEY) return;

  // Google llama este callback global cuando el SDK ya está listo. En ese
  // momento volvemos a renderizar para que bindHotelAutocomplete() (en
  // legacy/marabunta.html) enganche el autocomplete a los campos de
  // dirección que ya estén en pantalla.
  window.__marabuntaMapsReady = function () {
    if (typeof render === 'function') render();
  };

  // Google llama ESTE callback específicamente cuando la key es rechazada
  // (restricción de dominio, API no habilitada, billing, key inválida...).
  // Lo mostramos directo en la app con toast() porque en el navegador del
  // celular no siempre hay forma fácil de abrir la consola de errores.
  window.gm_authFailure = function () {
    const msg = 'Google Maps rechazó la key configurada (revisa restricciones/API habilitadas en Cloud Console).';
    if (typeof toast === 'function') toast(msg); else alert(msg);
  };

  const s = document.createElement('script');
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' +
    encodeURIComponent(window.MARABUNTA_GOOGLE_MAPS_KEY) +
    '&libraries=places&loading=async&callback=__marabuntaMapsReady';
  s.async = true;
  document.head.appendChild(s);
})();
