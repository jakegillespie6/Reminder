// features/items/store/sse.ts

import { AppDispatch, RootState } from "@store/index";
import { Item, ItemQueryParams, SortOption } from "../types";

import {
    addIncomingItem,
    upsertIncomingItem,
    removeIncomingItem,
    setFilters,
} from "./slice";

import { eventStream } from "@lib/sse/eventStream";
import { refetchItemsWithActiveFilters } from "./thunks";
import toast from "react-hot-toast";

type SettingChangedPayload = {
    key: string;
    value: unknown;
    previous_value: unknown;
    updated_at: string | null;
};

const toStringArray = (value: unknown): string[] | undefined => {
    if (Array.isArray(value)) {
        const arr = value.filter((v): v is string => typeof v === "string");
        return arr.length ? arr : undefined;
    }
    if (typeof value === "string" && value.length > 0) return [value];
    return undefined;
};

export const normalizeItemFilters = (value: unknown): ItemQueryParams => {
    if (!value || typeof value !== "object") return {};

    const raw = value as Record<string, unknown>;
    const next: ItemQueryParams = {};

    if (typeof raw.purchased === "boolean") {
        next.purchased = raw.purchased;
    } else if (raw.not_purchased === true) {
        next.purchased = false;
    }

    const stores = toStringArray(raw.store);
    if (stores) next.store = stores as ItemQueryParams["store"];

    const types = toStringArray(raw.type);
    if (types) next.type = types as ItemQueryParams["type"];

    if (isSortOption(raw.sort)) {
        next.sort = raw.sort;
    }

    return next;
};

const sameArray = <T>(a?: T[], b?: T[]) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
};

const areFiltersEqual = (a: ItemQueryParams, b: ItemQueryParams) =>
    a.purchased === b.purchased &&
    a.sort === b.sort &&
    sameArray(a.store, b.store) &&
    sameArray(a.type, b.type);

const matchesFilters = (item: Item, filters: ItemQueryParams) => {
    if (filters.purchased !== undefined && item.purchased !== filters.purchased) return false;
    if (filters.store?.length && !filters.store.includes(item.store)) return false;
    if (filters.type?.length && !filters.type.includes(item.type)) return false;
    return true;
};

const isSortOption = (value: unknown): value is SortOption =>
    typeof value === "string" && (SORT_OPTIONS as readonly string[]).includes(value);

const SORT_OPTIONS: readonly SortOption[] = ["created_at", "-created_at", "store", "type"];

export function registerItemEvents(dispatch: AppDispatch, getState: () => RootState) {
    const unsubCreated = eventStream.subscribe<Item>("item.created", (item) => {
        const filters = getState().items.filters;
        if (matchesFilters(item, filters)) {
            dispatch(addIncomingItem(item));
            toast.success("Item created");
        }
    });

    const unsubUpdated = eventStream.subscribe<Item>("item.updated", (item) => {
        const filters = getState().items.filters;
        if (matchesFilters(item, filters)) {
            dispatch(upsertIncomingItem(item));
            toast.success("Item updated");
        } else {
            dispatch(removeIncomingItem(item.id));
            toast.success("Item updated (no longer matches filters)");
        }
    });

    const unsubDeleted = eventStream.subscribe<{ id: number }>("item.deleted", ({ id }) => {
        dispatch(removeIncomingItem(id));
        toast.success("Item deleted");
    });

    const unsubSettingChanged = eventStream.subscribe<SettingChangedPayload>(
        "setting.changed",
        ({ key, value }) => {
            if (key !== "item_filters") return;

            const nextFilters = normalizeItemFilters(value);
            const currentFilters = getState().items.filters;

            if (areFiltersEqual(currentFilters, nextFilters)) return;

            dispatch(setFilters(nextFilters));
            dispatch(refetchItemsWithActiveFilters());
            toast.success("Filter/sort settings updated");
        }
    );

    return () => {
        unsubCreated();
        unsubUpdated();
        unsubDeleted();
        unsubSettingChanged();
    };
}