import { useCallback, useEffect, useState } from 'react';

import { ApiError, USE_MOCK } from '@/services/api';
import { MOCK_PAQUETES, normalizarFolio, obtenerPaquetes, type Paquete } from '@/services/packages';

/** `habilitado: false` evita la petición (p. ej. la lista de envíos para un invitado). */
export function usePaquetes({ habilitado = true }: { habilitado?: boolean } = {}) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [cargando, setCargando] = useState(habilitado);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    let activo = true;

    const cargar = async () => {
      try {
        let datos: Paquete[];
        if (USE_MOCK) {
          await new Promise((r) => setTimeout(r, 1000));
          datos = MOCK_PAQUETES;
        } else {
          datos = await obtenerPaquetes();
        }
        if (activo) setPaquetes(datos);
      } catch (e) {
        if (activo) {
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            setError('Para consultar este envío necesitas iniciar sesión.');
          } else {
            setError(e instanceof Error ? e.message : 'No se pudieron cargar los paquetes.');
          }
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [intento, habilitado]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }, []);

  const getPaqueteByFolio = useCallback(
    (folio?: string | null): Paquete | null => {
      if (!folio) return null;
      const buscado = normalizarFolio(folio);
      return paquetes.find((p) => normalizarFolio(p.folio) === buscado) ?? null;
    },
    [paquetes]
  );

  return { paquetes, cargando, error, reintentar, getPaqueteByFolio };
}
