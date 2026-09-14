import Dropdown from "@components/Dropdown";
import ToggleButtonGroup from "@components/ToggleButtonGroup";
import {
  STORE_OPTIONS,
  SORT_OPTIONS,
  type SortOption,
  type Store,
  type ItemQueryParams,
} from "../types";

type Props = {
  filters: ItemQueryParams;
  onChange: (next: ItemQueryParams) => void;
};

type PurchasedFilterValue = "all" | "true" | "false";
type StoreFilterValue = "all" | Store;
type SortFilterValue = "all" | SortOption;

const PURCHASED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

const STORE_FILTER_OPTIONS: ReadonlyArray<{
  value: StoreFilterValue;
  label: string;
}> = [
  { value: "all", label: "Store: all" },
  ...STORE_OPTIONS.map((store) => ({
    value: store,
    label: store === "general" ? "General" : store,
  })),
];

const SORT_FILTER_OPTIONS: ReadonlyArray<{
  value: SortFilterValue;
  label: string;
}> = [
  { value: "all", label: "Sort: default" },
  ...SORT_OPTIONS.map((sort) => ({
    value: sort,
    label: sort,
  })),
];

export default function ItemFiltersForm({ filters, onChange }: Props) {
  const purchasedValue: PurchasedFilterValue =
    filters.purchased === undefined
      ? "all"
      : filters.purchased
        ? "true"
        : "false";

  const sortValue: SortFilterValue = filters.sort ?? "all";

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      <ToggleButtonGroup<PurchasedFilterValue>
        label="Purchased"
        value={purchasedValue}
        options={PURCHASED_OPTIONS}
        onChange={(value) =>
          onChange({
            ...filters,
            purchased: value === "all" ? undefined : value === "true",
          })
        }
      />

      <Dropdown<StoreFilterValue>
        label="Store"
        value={(filters.store?.[0] ?? "all") as StoreFilterValue}
        options={STORE_FILTER_OPTIONS}
        onChange={(value) =>
          onChange({
            ...filters,
            store: value === "all" ? undefined : [value],
          })
        }
      />

      <Dropdown<SortFilterValue>
        label="Sort Options"
        value={sortValue}
        options={SORT_FILTER_OPTIONS}
        onChange={(value) =>
          onChange({
            ...filters,
            sort: value === "all" ? undefined : value,
          })
        }
      />
    </div>
  );
}