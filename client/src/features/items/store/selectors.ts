import { RootState } from '@store/index';
import { Store, ItemType } from '../types';

export const selectAllItems = (state: RootState) => state.items.items;

export const selectItemsLoading = (state: RootState) =>
    state.items.loading;

export const selectItemsError = (state: RootState) =>
    state.items.error;

export const selectFilters = (state: RootState) =>
    state.items.filters;

export const selectPurchasedItems = (state: RootState) =>
    state.items.items.filter((item) => item.purchased);

export const selectUnpurchasedItems = (state: RootState) =>
    state.items.items.filter((item) => !item.purchased);

export const selectItemsByStore =
    (store: Store) => (state: RootState) =>
        state.items.items.filter((item) => item.store === store);

export const selectItemsByType =
    (type: ItemType) => (state: RootState) =>
        state.items.items.filter((item) => item.type === type);