import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectFilters, setFilters } from "../store";
import { updateItemFilters } from "@features/global-settings/store/thunks";
import type { ItemQueryParams } from "../types";

type Options = { persistOnChange?: boolean };

export function useItemFiltersController(options: Options = {}) {
  const { persistOnChange = false } = options;
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const changeFilters = (next: ItemQueryParams) => {
    dispatch(setFilters(next));
    if (persistOnChange) void dispatch(updateItemFilters(next));
  };

  const persistFilters = async () => dispatch(updateItemFilters(filters));
  const clearFilters = async () => {
    const cleared: ItemQueryParams = {};
    dispatch(setFilters(cleared));
    return dispatch(updateItemFilters(cleared));
  };

  return { filters, changeFilters, persistFilters, clearFilters };
}