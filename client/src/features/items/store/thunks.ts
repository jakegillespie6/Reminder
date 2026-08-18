import { createAsyncThunk } from '@reduxjs/toolkit';
import { itemsApi } from '../api';
import { Item, ItemQueryParams, ItemCreatePayload, ItemUpdatePayload } from '../types';
import { AppDispatch, RootState } from '@store/index';

export const fetchItems = createAsyncThunk<Item[], ItemQueryParams, { rejectValue: string }>(
    'items/fetchItems',
    async (params = {}, { rejectWithValue }) => {
        try {
            return await itemsApi.getItems(params);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to fetch items');
        }
    }
);

export const createItem = createAsyncThunk<Item, ItemCreatePayload, { rejectValue: string }>(
    'items/createItem',
    async (payload, { rejectWithValue }) => {
        try {
            return await itemsApi.createItem(payload);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to create item');
        }
    }
);

export const updateItem = createAsyncThunk<Item, { id: number; payload: ItemUpdatePayload }, { rejectValue: string }>(
    'items/updateItem',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await itemsApi.updateItem(id, payload);
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to update item');
        }
    }
);

export const deleteItem = createAsyncThunk<number, number, { rejectValue: string }>(
    'items/deleteItem',
    async (id, { rejectWithValue }) => {
        try {
            await itemsApi.deleteItem(id);
            return id;
        } catch (e: any) {
            return rejectWithValue(e.message ?? 'Failed to delete item');
        }
    }
);

export const refetchItemsWithActiveFilters =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const filters = getState().items.filters;
        return dispatch(fetchItems(filters));
    };