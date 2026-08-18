export const STORE_OPTIONS = [
  "walmart",
  "target",
  "ralphs",
  "stater_bros",
  "hmart",
  "99_ranch",
  "general",
] as const;

export const TYPE_OPTIONS = [
  "grocery",
  "supplies",
  "household",
  "personal_care",
  "electronics",
  "general",
] as const;

export const SORT_OPTIONS = ["created_at", "-created_at", "store", "type"] as const;

export type Store = (typeof STORE_OPTIONS)[number];
export type ItemType = (typeof TYPE_OPTIONS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface Item {
    id: number;
    name: string;
    store: Store;
    type: ItemType;
    purchased: boolean;
    created_at: string;
}

export interface ItemCreatePayload {
    name: string;
    store?: Store;
    type?: ItemType;
}

export interface ItemUpdatePayload {
    name?: string;
    store?: Store;
    type?: ItemType;
    purchased?: boolean;
}

export interface ItemQueryParams {
    store?: Store[];
    type?: ItemType[];
    purchased?: boolean;
    sort?: SortOption;
}

export interface ItemsState {
    items: Item[];
    loading: boolean;
    error: string | null;
    filters: ItemQueryParams;
}