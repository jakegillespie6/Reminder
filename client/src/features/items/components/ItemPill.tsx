import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import PopoverMenu from "@components/PopoverMenu";
import { useAppDispatch } from "@store/hooks";
import { deleteItem, updateItem } from "../store";
import { type Item } from "../types";
import UpdateItemModal from "./UpdateItemModal";

type ItemPillProps = {
  item: Item;
  highlight?: boolean;
};

export default function ItemPill({ item, highlight = false }: ItemPillProps) {
  const dispatch = useAppDispatch();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const onTapOpenMenu = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const stateClasses = highlight ? "bg-accent/20 border-accent/60" : "bg-surface border-border";

  return (
    <>
      <PopoverMenu
        trigger={
          <div
            ref={triggerRef}
            onClick={onTapOpenMenu}
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
              cursor-pointer
              ${stateClasses}
              ${highlight ? "shadow-lg shadow-accent/40" : ""}
            `}
          >
            <span className={`max-w-[220px] truncate ${item.purchased ? "line-through opacity-70" : ""}`}>
              {item.name}
            </span>
          </div>
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