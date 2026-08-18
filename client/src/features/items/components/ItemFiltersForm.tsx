import Dropdown from "@components/Dropdown";
import ToggleButtonGroup from "@components/ToggleButtonGroup";
import { STORE_OPTIONS, TYPE_OPTIONS, SORT_OPTIONS, type ItemType, type SortOption, type Store } from "../types";
import type { ItemQueryParams } from "../types";
import { ItemFilters } from "@features/global-settings/types";
type Props = {
  filters: ItemQueryParams;
  onChange: (next: ItemQueryParams) => void;
};

type PurchasedFilterValue = "all" | "true" | "false";
type StoreFilterValue = "all" | Store;
type TypeFilterValue = "all" | ItemType;
type SortFilterValue = "all" | SortOption;

const PURCHASED_OPTIONS: ReadonlyArray<{ value: PurchasedFilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const STORE_FILTER_OPTIONS: ReadonlyArray<{ value: StoreFilterValue; label: string }> = [
  { value: "all", label: "Store: all" },
  ...STORE_OPTIONS.map((store) => ({
    value: store,
    label: store === "general" ? "General" : store,
  })),
];

const TYPE_FILTER_OPTIONS: ReadonlyArray<{ value: TypeFilterValue; label: string }> = [
  { value: "all", label: "Type: all" },
  ...TYPE_OPTIONS.map((type) => ({
    value: type,
    label: type === "general" ? "General" : type,
  })),
];

const SORT_FILTER_OPTIONS: ReadonlyArray<{ value: SortFilterValue; label: string }> = [
  { value: "all", label: "Sort: default" },
  ...SORT_OPTIONS.map((sort) => ({
    value: sort,
    label: sort,
  })),
];

export default function ItemFiltersForm({ filters, onChange }: Props) {
  const purchasedValue: PurchasedFilterValue =
    filters.purchased === undefined ? "all" : filters.purchased ? "true" : "false";

  // Handle both sort shapes (string or string[]) safely.
  const rawSort = (filters as ItemFilters & { sort?: SortOption | SortOption[] }).sort;
  const sortValue: SortFilterValue = (Array.isArray(rawSort) ? rawSort[0] : rawSort) ?? "all";
  const sortIsArray = Array.isArray(rawSort);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
      <ToggleButtonGroup<PurchasedFilterValue>
        label="Purchased"
        value={purchasedValue}
        options={PURCHASED_OPTIONS}
        onChange={(value) => {
          onChange({
            ...filters,
            purchased: value === "all" ? undefined : value === "true",
          });
        }}
      />

      <Dropdown<TypeFilterValue>
        label="Type"
        value={(filters.type?.[0] ?? "all") as TypeFilterValue}
        options={TYPE_FILTER_OPTIONS}
        onChange={(value) => {
          onChange({ ...filters, type: value === "all" ? undefined : [value] });
        }}
      />

      <Dropdown<StoreFilterValue>
        label="Store"
        value={(filters.store?.[0] ?? "all") as StoreFilterValue}
        options={STORE_FILTER_OPTIONS}
        onChange={(value) => {
          onChange({ ...filters, store: value === "all" ? undefined : [value] });
        }}
      />

      <Dropdown<SortFilterValue>
        label="Sort Options"
        value={sortValue}
        options={SORT_FILTER_OPTIONS}
        onChange={(value) => {
          const nextSort =
            value === "all"
              ? undefined
              : (sortIsArray ? [value] : value);

          onChange({ ...filters, sort: nextSort as ItemFilters["sort"] });
        }}
      />
    </div>
  );
}