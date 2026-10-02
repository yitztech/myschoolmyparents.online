import { useEffect, useRef, useState } from 'react';
import type { AppDatabase } from '../db/database';

/**
 * Consulta que se vuelve a ejecutar cuando cambia la base de datos (equivale a los
 * `Stream` de Drift). Descarta resultados antiguos si llegan fuera de orden.
 */
export function useLiveQuery<T>(db: AppDatabase | null, query: (db: AppDatabase) => Promise<T>, deps: unknown[], initial: T): T {
  const [data, setData] = useState<T>(initial);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    if (!db) return;
    let alive = true;
    let ticket = 0;
    const load = () => {
      const mine = ++ticket;
      queryRef.current(db).then(
        (value) => {
          if (alive && mine === ticket) setData(value);
        },
        () => {},
      );
    };
    load();
    const unsubscribe = db.subscribe(load);
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ...deps]);

  return data;
}
