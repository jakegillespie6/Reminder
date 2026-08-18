import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import PopoverMenu from "@components/PopoverMenu";
import { useAppDispatch } from "@store/hooks";
import { deleteItem, updateItem } from "../store";
import { type Item } from "../types";
import UpdateItemModal from "./UpdateItemModal";

type ItemPillProps = {
  item: Item;
  highlight?: boolean;
};

type DragIntent = "purchase" | "delete" | null;

type DragStateDetail = {
  dragging: boolean;
  x: number;
  y: number;
  intent: DragIntent;
};

const DRAG_ACTION_DISTANCE = 56; // px
const DRAG_ACTION_VELOCITY = 700; // px/s

export default function ItemPill({ item, highlight = false }: ItemPillProps) {
  const dispatch = useAppDispatch();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHoldActive, setIsHoldActive] = useState(false);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  const longPressTimerRef = useRef<number | null>(null);
  const isPressingRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });

  const dragArmedRef = useRef(false);
  const isDraggingRef = useRef(false);

  const emitDragState = (detail: DragStateDetail) => {
    window.dispatchEvent(new CustomEvent<DragStateDetail>("item-pill-drag-state", { detail }));
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getClientPoint = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if ("clientX" in event && "clientY" in event) {
      return { x: event.clientX, y: event.clientY };
    }

    if ("changedTouches" in event && event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    return { x: info.point.x, y: info.point.y };
  };

  const onTapOpenMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClickRef.current = false;
      return;
    }

    e.preventDefault();

    triggerRef.current?.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isPressingRef.current = true;
    longPressTriggeredRef.current = false;
    isDraggingRef.current = false;
    dragArmedRef.current = false;

    pointerRef.current = { x: e.clientX, y: e.clientY };
    clearLongPressTimer();

    longPressTimerRef.current = window.setTimeout(() => {
      if (!isPressingRef.current) return;

      longPressTriggeredRef.current = true;
      suppressNextClickRef.current = true;
      setIsHoldActive(true);
      navigator.vibrate?.(15);

      // Arm drag; start on next pointermove so event frame is always current.
      dragArmedRef.current = true;
    }, 260);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };

    if (dragArmedRef.current && !isDraggingRef.current) {
      dragArmedRef.current = false;
      dragControls.start(e.nativeEvent, { snapToCursor: true });
    }
  };

  const onPointerUp = () => {
    isPressingRef.current = false;
    clearLongPressTimer();
    dragArmedRef.current = false;

    if (longPressTriggeredRef.current && !isDraggingRef.current) {
      emitDragState({
        dragging: false,
        x: pointerRef.current.x,
        y: pointerRef.current.y,
        intent: null,
      });
    }

    setIsHoldActive(false);
  };

  const onPointerCancel = () => {
    isPressingRef.current = false;
    clearLongPressTimer();
    dragArmedRef.current = false;

    if (longPressTriggeredRef.current && !isDraggingRef.current) {
      emitDragState({
        dragging: false,
        x: pointerRef.current.x,
        y: pointerRef.current.y,
        intent: null,
      });
    }

    setIsHoldActive(false);
  };

  const getDragIntent = (offsetY: number, velocityY: number): DragIntent => {
    const movedUp = offsetY <= -DRAG_ACTION_DISTANCE || velocityY <= -DRAG_ACTION_VELOCITY;
    const movedDown = offsetY >= DRAG_ACTION_DISTANCE || velocityY >= DRAG_ACTION_VELOCITY;

    if (movedUp) return "purchase";
    if (movedDown) return "delete";
    return null;
  };

  const onDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = true;
    const point = getClientPoint(event, info);

    emitDragState({
      dragging: true,
      x: point.x,
      y: point.y,
      intent: getDragIntent(info.offset.y, info.velocity.y),
    });
  };

  const onDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const point = getClientPoint(event, info);

    emitDragState({
      dragging: true,
      x: point.x,
      y: point.y,
      intent: getDragIntent(info.offset.y, info.velocity.y),
    });
  };

  const onDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const intent = getDragIntent(info.offset.y, info.velocity.y);
    const point = getClientPoint(event, info);

    isDraggingRef.current = false;
    longPressTriggeredRef.current = false;
    dragArmedRef.current = false;

    emitDragState({
      dragging: false,
      x: point.x,
      y: point.y,
      intent: null,
    });

    setIsHoldActive(false);

    if (intent === "purchase") {
      await onMarkPurchased();
      return;
    }

    if (intent === "delete") {
      await onDelete();
    }
  };

  const onMarkPurchased = async () => {
    if (item.purchased) return;

    const result = await dispatch(
      updateItem({
        id: item.id,
        payload: { purchased: true },
      })
    );

    if (updateItem.fulfilled.match(result)) {
      toast.success("Marked as purchased");
    } else {
      toast.error(result.payload ?? "Update failed");
    }
  };

  const onDelete = async () => {
    const result = await dispatch(deleteItem(item.id));

    if (deleteItem.fulfilled.match(result)) {
      toast.success("Item deleted");
    } else {
      toast.error(result.payload ?? "Delete failed");
    }
  };

  const stateClasses = highlight
    ? "bg-accent/20 border-accent/60"
    : isHoldActive
      ? "bg-accent/20 border-accent"
      : "bg-surface border-border";

  return (
    <>
      <PopoverMenu
        trigger={
          <motion.div
            ref={triggerRef}
            onClick={onTapOpenMenu}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragSnapToOrigin
            dragElastic={0.12}
            dragMomentum={false}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            whileDrag={{ scale: 1.06, zIndex: 4100 }}
            className={`
              relative
              inline-flex items-center gap-2
              rounded-full
              border
              px-3 py-1
              text-sm
              text-text-primary
              shadow-sm
              transition-all duration-300
              hover:bg-accent/10
              hover:border-accent/40
              group-aria-expanded:bg-accent/20
              group-aria-expanded:border-accent
              group-aria-expanded:hover:bg-accent/60
              select-none
              touch-manipulation
              cursor-grab
              active:cursor-grabbing
              ${stateClasses}
              ${highlight ? "shadow-lg shadow-accent/40" : ""}
            `}
          >
            <span className={`max-w-[220px] truncate ${item.purchased ? "line-through opacity-70" : ""}`}>
              {item.name}
            </span>
          </motion.div>
        }
        triggerLabel={`Item actions for ${item.name}`}
        side="top"
        align="left"
        openOnContextMenu
        items={[
          {
            label: "Edit",
            icon: <FiEdit2 aria-hidden="true" />,
            onClick: () => setIsEditOpen(true),
          },
          {
            label: "Mark as purchased",
            icon: <FiCheck aria-hidden="true" />,
            onClick: () => void onMarkPurchased(),
            disabled: item.purchased,
          },
          {
            label: "Delete",
            icon: <FiTrash2 aria-hidden="true" />,
            onClick: () => void onDelete(),
            danger: true,
          },
        ]}
      />

      <UpdateItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        item={item}
      />
    </>
  );
}