import { useEffect, useRef, useState } from "react";
import ItemList from "@features/items/components/ItemList";
import SortAndFilterList from "@components/SortAndFilter/List";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { store } from "@store/index";
import { eventStream } from "@lib/sse/eventStream";
import { registerItemEvents, normalizeItemFilters } from "@features/items/store/sse";
import { setFilters } from "@features/items/store/slice";
import { refetchItemsWithActiveFilters } from "@features/items/store/thunks";
import { selectFilters } from "@features/items/store";
import {
  fetchTheme,
  fetchCalendar,
  fetchItemFilters,
} from "@features/global-settings/store/thunks";
import { registerGlobalSettingsEvents } from "@features/global-settings/store/sse";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const [refetchEpoch, setRefetchEpoch] = useState(0);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const bootstrap = async () => {
      dispatch(fetchTheme());
      dispatch(fetchCalendar());

      const result = await dispatch(fetchItemFilters());

      if (disposed) return;

      if (fetchItemFilters.fulfilled.match(result)) {
        const payload = result.payload as unknown;

        const rawFilters =
          payload && typeof payload === "object" && "value" in (payload as Record<string, unknown>)
            ? (payload as Record<string, unknown>).value
            : payload;

        const nextFilters = normalizeItemFilters(rawFilters);
        dispatch(setFilters(nextFilters));
      }

      // Always fetch list, even if filters fetch failed.
      dispatch(refetchItemsWithActiveFilters());

      hasBootstrappedRef.current = true;
    };

    void bootstrap();

    const unsubscribeItemEvents = registerItemEvents(dispatch, store.getState);
    const unsubscribeGlobalSettingsEvents = registerGlobalSettingsEvents(dispatch);

    const sseUrl = import.meta.env.VITE_SSE_URL ?? "/api/events/";
    eventStream.connect(sseUrl);

    return () => {
      disposed = true;
      unsubscribeItemEvents();
      unsubscribeGlobalSettingsEvents();
      eventStream.disconnect();
    };
  }, [dispatch]);

  // Any filter change after bootstrap triggers full-list stagger cycle.
  useEffect(() => {
    if (!hasBootstrappedRef.current) return;
    setRefetchEpoch((prev) => prev + 1);
  }, [filters]);

  return (
    <div className="box-border min-h-full overflow-x-hidden bg-background-primary p-6 text-text-primary">
      <div className="mx-auto max-w-4xl space-y-6">
        <SortAndFilterList filters={filters} />

        <div className="p-4">
          <ItemList refetchEpoch={refetchEpoch} />
        </div>
      </div>
    </div>
  );
}