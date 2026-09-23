import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@store/hooks";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  selectAllItems,
  selectItemsError,
  selectItemsLoading,
  selectFilters,
} from "../store";
import ItemPill from "./ItemPill";
import {
  STORE_LABELS,
  type Item,
  type Store,
} from "../types";

const PLACEHOLDER_COUNT = 8;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = {
  refetchEpoch?: number;
};

const skeletonContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.03,
    },
  },
};

const listSwapVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.14, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const skeletonVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.045,
      duration: 0.3,
      ease: EASE_OUT,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.88,
    y: -6,
    transition: { duration: 0.16 },
  },
};

type ItemId = Item["id"];

export default function ItemList({ refetchEpoch = 0 }: Props) {
  const items = useAppSelector(selectAllItems);
  const loading = useAppSelector(selectItemsLoading);
  const error = useAppSelector(selectItemsError);
  const filters = useAppSelector(selectFilters);

  const [highlightedIds, setHighlightedIds] = useState<ItemId[]>([]);
  const prevItemSignatureRef = useRef<Map<ItemId, string>>(new Map());
  const highlightTimeoutsRef = useRef<Map<ItemId, number>>(new Map());
  const hasInitializedRef = useRef(false);
  const lastRefetchEpochRef = useRef(refetchEpoch);

  // Track add/update and glow for 2s.
  useEffect(() => {
    const nextSignatures = new Map<ItemId, string>();
    for (const item of items) {
      nextSignatures.set(item.id, JSON.stringify(item));
    }

    // Avoid mass glow during full-list refetch cycle.
    if (lastRefetchEpochRef.current !== refetchEpoch) {
      lastRefetchEpochRef.current = refetchEpoch;
      prevItemSignatureRef.current = nextSignatures;
      return;
    }

    // Skip initial hydration.
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevItemSignatureRef.current = nextSignatures;
      return;
    }

    const prevSignatures = prevItemSignatureRef.current;
    const idsToHighlight: ItemId[] = [];

    for (const [id, signature] of nextSignatures.entries()) {
      const prev = prevSignatures.get(id);
      if (!prev || prev !== signature) idsToHighlight.push(id);
    }

    if (idsToHighlight.length) {
      setHighlightedIds((prev) => Array.from(new Set([...prev, ...idsToHighlight])));

      idsToHighlight.forEach((id) => {
        const existing = highlightTimeoutsRef.current.get(id);
        if (existing) window.clearTimeout(existing);

        highlightTimeoutsRef.current.set(id, window.setTimeout(() => {
          setHighlightedIds((prev) => prev.filter((x) => x !== id));
          highlightTimeoutsRef.current.delete(id);
        }, 2000));
      });
    }

    prevItemSignatureRef.current = nextSignatures;
  }, [items, refetchEpoch]);

  useEffect(() => {
    return () => {
      for (const t of highlightTimeoutsRef.current.values()) {
        window.clearTimeout(t);
      }
      highlightTimeoutsRef.current.clear();
    };
  }, []);

  const groupedItems = useMemo(() => {
    const groups = new Map<Store, Item[]>();

    for (const item of items) {
      const group = groups.get(item.store) ?? [];
      group.push(item);
      groups.set(item.store, group);
    }

    return Array.from(groups.entries()).map(([store, groupItems]) => ({
      store,
      items: groupItems,
    }));
  }, [items]);

  const isGroupedByStore = filters.sort === "store";

  if (error) return <p className="text-base text-danger">{error}</p>;

  if (loading && !items.length) {
    return (
      <motion.div
        className="flex flex-wrap gap-2"
        variants={skeletonContainerVariants}
        initial="hidden"
        animate="show"
        aria-label="Loading items"
      >
        {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
          <motion.span
            key={`item-skeleton-${index}`}
            variants={skeletonVariants}
            className="inline-block h-8 w-24 rounded-full bg-surface"
          />
        ))}
      </motion.div>
    );
  }

  if (!items.length) {
    return <p className="text-base text-text-tertiary">No items yet.</p>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`items-refetch-${refetchEpoch}`}
        variants={listSwapVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="flex flex-wrap gap-2"
      >
        <motion.div className="flex flex-wrap items-start gap-3">
          <AnimatePresence>
            {isGroupedByStore
              ? groupedItems.map((group) => (
                  <motion.fieldset
                    key={group.store}
                    layout
                    className="min-w-0 max-w-full flex-none rounded-lg border border-border px-3 pb-3 pt-2"
                  >
                    <legend className="px-1 text-xs font-semibold text-text-secondary">
                      {STORE_LABELS[group.store]}
                    </legend>

                    <div className="flex max-w-full flex-wrap gap-2">
                      {group.items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          custom={index}
                          initial="hidden"
                          animate="show"
                          layout
                          variants={itemVariants}
                          exit="exit"
                        >
                          <ItemPill
                            item={item}
                            highlight={highlightedIds.includes(item.id)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.fieldset>
                ))
              : items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    custom={index}
                    initial="hidden"
                    animate="show"
                    layout
                    variants={itemVariants}
                    exit="exit"
                  >
                    <ItemPill
                      item={item}
                      highlight={highlightedIds.includes(item.id)}
                    />
                  </motion.div>
                ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}