import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "@store/hooks";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  selectAllItems,
  selectItemsError,
  selectItemsLoading,
} from "../store";
import ItemPill from "./ItemPill";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import type { Item } from "../types";
const PLACEHOLDER_COUNT = 8;
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type DragStateDetail = {
  dragging: boolean;
  x: number;
  y: number;
  intent: "purchase" | "delete" | null;
};

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

const listContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.03, // domino/waterfall timing
      delayChildren: 0,
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
      delay: index * 0.045, // was 0.03
      duration: 0.3,        // was 0.24
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

  const [dragUI, setDragUI] = useState<{
    active: boolean;
    over: "purchase" | "delete" | null;
  }>({ active: false, over: null });

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
      Object.values(highlightTimeoutsRef.current).forEach((t) => window.clearTimeout(t));
      highlightTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const onDragState = (event: Event) => {
      const detail = (event as CustomEvent<DragStateDetail>).detail;

      if (!detail?.dragging) {
        setDragUI({ active: false, over: null });
        return;
      }

      setDragUI({
        active: true,
        over: detail.intent,
      });
    };

    window.addEventListener("item-pill-drag-state", onDragState as EventListener);
    return () => {
      window.removeEventListener("item-pill-drag-state", onDragState as EventListener);
    };
  }, []);

  const dragZones = (
    <>
      <div
        id="purchase-drop-zone"
        className={`
          fixed left-0 right-0 z-[3000]
          top-[var(--app-nav-height,56px)]
          h-[calc((100dvh-var(--app-nav-height,56px))/3)]
          transition-opacity duration-150
          pointer-events-none
          ${dragUI.active ? "opacity-100" : "opacity-0"}
          ${
            dragUI.over === "purchase"
              ? "bg-gradient-to-b from-emerald-500/55 via-emerald-500/30 to-emerald-500/10"
              : "bg-gradient-to-b from-emerald-500/35 via-emerald-500/20 to-emerald-500/5"
          }
        `}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-emerald-950">
          <FiArrowUp className="h-14 w-14 text-text-secondary" aria-hidden="true" />
          <span className="text-text-primary font-semibold">Purchase (swipe up)</span>
        </div>
      </div>

      <div
        id="delete-drop-zone"
        className={`
          fixed inset-x-0 bottom-0 z-[3000]
          h-[calc(33.333dvh+env(safe-area-inset-bottom))]
          transition-opacity duration-150
          pointer-events-none
          ${dragUI.active ? "opacity-100" : "opacity-0"}
          ${
            dragUI.over === "delete"
              ? "bg-gradient-to-t from-red-500/55 via-red-500/30 to-red-500/10"
              : "bg-gradient-to-t from-red-500/35 via-red-500/20 to-red-500/5"
          }
        `}
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 pb-[env(safe-area-inset-bottom)] text-red-950">
          <FiArrowDown className="h-14 w-14 text-text-secondary" aria-hidden="true" />
          <span className="text-text-primary font-semibold">Delete (swipe down)</span>
        </div>
      </div>
    </>
  );

  if (error) return <p className="text-sm text-danger">{error}</p>;

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
            className="inline-block h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </motion.div>
    );
  }

  if (!items.length) return <p className="text-sm text-text-tertiary">No items yet.</p>;

  return (
    <>
      {typeof document !== "undefined" ? createPortal(dragZones, document.body) : dragZones}

      <AnimatePresence mode="wait">
        <motion.div
          key={`items-refetch-${refetchEpoch}`}
          variants={listSwapVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex flex-wrap gap-2"
        >
          <motion.div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  custom={index}
                  initial="hidden"
                  animate="show"
                  layout
                  variants={itemVariants}
                  exit="exit"
                  transition={{ layout: { duration: 0.22, ease: EASE_OUT } }}
                >
                  <ItemPill item={item} highlight={highlightedIds.includes(item.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}