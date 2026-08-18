import toast from "react-hot-toast";
import Button from "@components/Button";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectFilters, setFilters } from "@features/items/store";
import ItemFiltersForm from "@features/items/components/ItemFiltersForm";
import { updateItemFilters } from "../store/thunks";
import type { ItemQueryParams } from "@features/items/types";

export default function ItemFiltersSettingsSection() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const persistFilters = async (next: ItemQueryParams) => {
    const result = await dispatch(updateItemFilters(next));
    if (!updateItemFilters.fulfilled.match(result)) {
      toast.error((result.payload as string) ?? "Failed to save filters");
    }
  };

  const onFiltersChange = (next: ItemQueryParams) => {
    dispatch(setFilters(next));
    void persistFilters(next);
  };

  const onClearFilters = () => {
    const cleared: ItemQueryParams = {};
    dispatch(setFilters(cleared));
    void persistFilters(cleared);
  };

  return (
    <section className="space-y-3 p-4">
      <ItemFiltersForm filters={filters} onChange={onFiltersChange} />

      <div className="flex gap-2">
        <Button label="Clear Filters" variant="secondary" onClick={onClearFilters} />
      </div>
    </section>
  );
}