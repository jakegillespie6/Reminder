import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import Button from "@components/Button";
import CollapsibleSection from "@components/CollapsibleSection";
import FloatingActionButton from "@components/FloatingActionButton";
import { LayerContext } from "@components/LayerContext";
import { useAppDispatch } from "@store/hooks";
import { fetchItems } from "../store";
import ItemFiltersForm from "./ItemFiltersForm";
import ItemList from "./ItemList";
import NewItemModal from "./NewItemModal";
import { useItemFiltersController } from "../hooks/useItemFiltersController";

export default function ItemsManagerSection() {
  const dispatch = useAppDispatch();

  const { filters, changeFilters } = useItemFiltersController({ persistOnChange: true });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refetchEpoch, setRefetchEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const result = await dispatch(fetchItems(filters));

      // Only full-list re-stagger after filter/sort fetch completes successfully.
      if (!cancelled && fetchItems.fulfilled.match(result)) {
        setRefetchEpoch((prev) => prev + 1);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [dispatch, filters]);

  return (
    <>
      <FloatingActionButton
        icon={<FiPlus />}
        label="New item"
        position="bottom-right"
        onClick={() => setIsCreateModalOpen(true)}
      />

      <section className="relative z-[2500] mt-3 p-3">
        <CollapsibleSection title="Filters" defaultOpen={false}>
          <LayerContext.Provider value={5000}>
            <ItemFiltersForm filters={filters} onChange={changeFilters} />
          </LayerContext.Provider>
          <div className="mt-2 flex justify-end">
            <Button label="Clear Filters" variant="secondary" onClick={() => changeFilters({})} />
          </div>
        </CollapsibleSection>
      </section>

      <section className="relative z-[4000] mt-3 space-y-2 p-3">
        <ItemList refetchEpoch={refetchEpoch} />
      </section>

      <NewItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}