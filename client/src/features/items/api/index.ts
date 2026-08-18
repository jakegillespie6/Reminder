import api from '@lib/api';
import { Item, ItemCreatePayload, ItemUpdatePayload, ItemQueryParams } from '../types';

const BASE_URL = '/items';

const buildQueryString = (params: ItemQueryParams): string => {
    const query = new URLSearchParams();

    if (params.store?.length) query.set('store', params.store.join(','));
    if (params.type?.length) query.set('type', params.type.join(','));
    if (params.purchased !== undefined) query.set('purchased', String(params.purchased));
    if (params.sort) query.set('sort', params.sort);

    return query.toString();
};

export const itemsApi = {
    getItems: async (params: ItemQueryParams = {}): Promise<Item[]> => {
        const qs = buildQueryString(params);
        const url = qs ? `${BASE_URL}/?${qs}` : `${BASE_URL}/`;
        const { data } = await api.get(url);
        return data;
    },

    createItem: async (payload: ItemCreatePayload): Promise<Item> => {
        const { data } = await api.post(`${BASE_URL}/`, payload);
        return data;
    },

    updateItem: async (id: number, payload: ItemUpdatePayload): Promise<Item> => {
        const { data } = await api.patch(`${BASE_URL}/${id}/`, payload);
        return data;
    },

    deleteItem: async (id: number): Promise<void> => {
        await api.delete(`${BASE_URL}/${id}/`);
    },
};