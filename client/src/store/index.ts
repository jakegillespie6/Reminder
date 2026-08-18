import { configureStore } from '@reduxjs/toolkit';
import itemsReducer from '@features/items/store/slice';
import globalSettingsReducer from '@features/global-settings/store/slice';
export const store = configureStore({
    reducer: {
        items: itemsReducer,
        globalSettings: globalSettingsReducer
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;