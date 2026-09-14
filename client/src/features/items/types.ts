export const STORE_OPTIONS = [
  "walmart",
  "target",
  "ralphs",
  "stater_bros",
  "hmart",
  "99_ranch",
  "general",
] as const;

export const SORT_OPTIONS = ["created_at", "-created_at", "store"] as const;

export type Store = (typeof STORE_OPTIONS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface Item {
  id: number;
  name: string;
  store: Store;
  purchased: boolean;
  created_at: string;
}

export interface ItemCreatePayload {
  name: string;
  store?: Store;
}

export interface ItemUpdatePayload {
  name?: string;
  store?: Store;
  purchased?: boolean;
}

export interface ItemQueryParams {
  store?: Store[];
  purchased?: boolean;
  sort?: SortOption;
}

export interface ItemsState {
  items: Item[];
  loading: boolean;
  error: string | null;
  filters: ItemQueryParams;
}