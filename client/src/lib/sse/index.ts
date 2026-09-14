import { AppDispatch, RootState } from "@store/index";
import { eventStream } from "@lib/sse/eventStream";
import { registerItemEvents } from "@features/items/store/sse";
import { registerGlobalSettingsEvents } from "@features/global-settings/store/sse";
import { registerCalendarEvents } from "@features/calendar_events/sse";

let teardownFeatureEvents: (() => void) | null = null;

export function startAppSSE(dispatch: AppDispatch, getState: () => RootState) {
    if (teardownFeatureEvents) return;

    const teardownItems = registerItemEvents(dispatch, getState);
    const teardownGlobalSettings = registerGlobalSettingsEvents(dispatch);
    const teardownCalendarEvents = registerCalendarEvents();

    teardownFeatureEvents = () => {
        teardownItems();
        teardownGlobalSettings();
        teardownCalendarEvents();
    };

    const sseUrl = import.meta.env.VITE_SSE_URL ?? "/api/events/";
    eventStream.connect(sseUrl);
}

export function stopAppSSE() {
    teardownFeatureEvents?.();
    teardownFeatureEvents = null;
    eventStream.disconnect();
}