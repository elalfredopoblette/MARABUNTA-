// Rastreo de guardados pendientes hacia Supabase.
//
// Guardar ahora viaja por internet (antes era instantáneo, en el propio
// navegador). Si alguien cierra la pestaña justo después de capturar algo,
// ese guardado puede quedar a la mitad y perderse. Este archivo lleva la
// cuenta de cuántos guardados están en vuelo en este momento, para que:
//   1. legacy/marabunta.html pueda mostrar un indicador "Guardando…"
//   2. legacy/marabunta.html pueda avisar al navegador que no cierre la
//      pestaña todavía (beforeunload) mientras haya algo pendiente.
//
// Carga ANTES de supabase-client.js y supabase-store.js.

(function () {
  window.marabuntaPendingWrites = 0;

  function avisar() {
    window.dispatchEvent(new CustomEvent('marabunta:pending-change', {
      detail: { pendientes: window.marabuntaPendingWrites },
    }));
  }

  // Envuelve una promesa de escritura: sube el contador al iniciar,
  // lo baja al terminar (con éxito o error), y avisa en cada cambio.
  window.marabuntaTrackWrite = function (promise) {
    window.marabuntaPendingWrites++;
    avisar();
    return promise.finally(() => {
      window.marabuntaPendingWrites--;
      avisar();
    });
  };
})();
