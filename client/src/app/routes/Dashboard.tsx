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
import GuestPassQrCard from "@features/auth/components/GuestPassQrCard";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const [refetchEpoch, setRefetchEpoch] = useState(0);
  const hasBootstrappedRef = useRef(false);

  // Hide cursor after 5s without mouse movement (Dashboard only).
  const [isCursorHidden, setIsCursorHidden] = useState(false);
  const hideCursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetHideTimer = () => {
      setIsCursorHidden(false);

      if (hideCursorTimerRef.current) {
        clearTimeout(hideCursorTimerRef.current);
      }

      hideCursorTimerRef.current = setTimeout(() => {
        setIsCursorHidden(true);
      }, 5000);
    };

    const onMouseMove = () => resetHideTimer();

    // Start timer immediately when page is mounted.
    resetHideTimer();
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (hideCursorTimerRef.current) clearTimeout(hideCursorTimerRef.current);
    };
  }, []);

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
    <div
      className={`box-border min-h-full overflow-x-hidden bg-background-primary p-6 text-text-primary ${
        isCursorHidden ? "cursor-none" : ""
      }`}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-end">
          <GuestPassQrCard />
        </div>

        <SortAndFilterList filters={filters} />

        <div className="p-4">
          <ItemList refetchEpoch={refetchEpoch} />
        </div>
      </div>
    </div>
  );
}