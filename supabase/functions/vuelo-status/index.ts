// Proxy hacia AeroDataBox (RapidAPI) para consultar el status de un vuelo
// por número + fecha, SIN exponer la key de RapidAPI al navegador — esa key
// no se puede restringir por dominio como la de Google Maps, así que tiene
// que vivir aquí, del lado del servidor, no en legacy/marabunta.html.
//
// Despliegue (desde el Dashboard de Supabase, sin necesidad de CLI/terminal):
//   1. Edge Functions → Create a new function → nombre: vuelo-status
//   2. Pega este archivo completo como el código de la función → Deploy.
//   3. Project Settings → Edge Functions → Secrets → agrega:
//        AERODATABOX_KEY = <tu x-api-key de RapidAPI para AeroDataBox>
//
// Uso desde la app: GET /functions/v1/vuelo-status?numero=AM123&fecha=2026-11-10

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  try {
    const url = new URL(req.url);
    const numero = url.searchParams.get('numero'); // ej. AM123
    const fecha = url.searchParams.get('fecha');    // ej. 2026-11-10 (YYYY-MM-DD)
    if (!numero || !fecha) return json({ error: 'Faltan parámetros: numero y fecha' }, 400);

    const key = Deno.env.get('AERODATABOX_KEY');
    if (!key) return json({ error: 'AERODATABOX_KEY no está configurada en los secretos del proyecto' }, 500);

    const apiUrl = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(numero)}/${encodeURIComponent(fecha)}`;
    const resp = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
    });
    // Leemos como texto primero: si RapidAPI rechaza la key o la suscripción,
    // a veces regresa un cuerpo vacío o que no es JSON, y .json() directo
    // tronaría sin decirnos el motivo real. Así, si no se puede parsear,
    // devolvemos el texto crudo + status para poder diagnosticarlo.
    const raw = await resp.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : { error: `RapidAPI regresó una respuesta vacía (status ${resp.status})` };
    } catch {
      data = { error: `RapidAPI no regresó JSON (status ${resp.status})`, raw: raw.slice(0, 500) };
    }
    // 204/205/304 no pueden traer cuerpo (lo exige el estándar de Response) —
    // si AeroDataBox regresó uno de estos, no se lo podemos reenviar tal cual
    // con nuestro JSON adentro, o Deno truena. Lo mandamos como 502 con el
    // status real de AeroDataBox dentro del mensaje, para poder diagnosticar.
    const statusSinCuerpoPermitido = [204, 205, 304].includes(resp.status);
    if (statusSinCuerpoPermitido) {
      return json({ error: `AeroDataBox regresó status ${resp.status} sin cuerpo (revisa tu suscripción/plan en RapidAPI)`, upstreamStatus: resp.status }, 502);
    }
    return json(data, resp.status);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
