import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item, ItemQueryParams, ItemsState } from '../types';
import {
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
} from './thunks';

const initialState: ItemsState = {
    items: [],
    loading: false,
    error: null,
    filters: {},
};

const itemsSlice = createSlice({
    name: 'items',
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<ItemQueryParams>) {
            state.filters = action.payload;
        },

        clearFilters(state) {
            state.filters = {};
        },

        clearError(state) {
            state.error = null;
        },

        addIncomingItem(state, action: PayloadAction<Item>) {
            const exists = state.items.some((i) => i.id === action.payload.id);
            if (!exists) {
                state.items.push(action.payload);
            }
        },

        upsertIncomingItem(state, action: PayloadAction<Item>) {
            const idx = state.items.findIndex((i) => i.id === action.payload.id);
            if (idx === -1) state.items.push(action.payload);
            else state.items[idx] = action.payload;
        },

        removeIncomingItem(state, action: PayloadAction<number>) {
            state.items = state.items.filter((i) => i.id !== action.payload);
        },
    },

    extraReducers: (builder) => {
        // Fetch
        builder.addCase(fetchItems.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(fetchItems.fulfilled, (state, action) => {
            state.loading = false;
            state.items = action.payload;
        });

        builder.addCase(fetchItems.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Failed to fetch items';
        });

        // Create
        builder.addCase(createItem.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(createItem.fulfilled, (state, action) => {
            state.loading = false;
            state.items.push(action.payload);
        });

        builder.addCase(createItem.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Failed to create item';
        });

        // Update
        builder.addCase(updateItem.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(updateItem.fulfilled, (state, action) => {
            state.loading = false;

            const index = state.items.findIndex(
                (item) => item.id === action.payload.id
            );

            if (index !== -1) {
                state.items[index] = action.payload;
            }
        });

        builder.addCase(updateItem.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Failed to update item';
        });

        // Delete
        builder.addCase(deleteItem.pending, (state) => {
            state.loading = true;
            state.error = null;
        });

        builder.addCase(deleteItem.fulfilled, (state, action) => {
            state.loading = false;

            state.items = state.items.filter(
                (item) => item.id !== action.payload
            );
        });

        builder.addCase(deleteItem.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Failed to delete item';
        });
    },
});

export const {
    setFilters,
    clearFilters,
    clearError,
    addIncomingItem,
    upsertIncomingItem,
    removeIncomingItem,
} = itemsSlice.actions;

export default itemsSlice.reducer;