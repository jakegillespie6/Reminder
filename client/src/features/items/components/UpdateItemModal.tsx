import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@components/Button";
import Modal from "@components/Modal";
import Input from "@components/Input";
import Dropdown, { type DropdownOption } from "@components/Dropdown";
import { useAppDispatch } from "@store/hooks";
import { updateItem } from "../store";
import {
  STORE_OPTIONS,
  TYPE_OPTIONS,
  type Item,
  type ItemType,
  type Store,
} from "../types";

type UpdateItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onUpdated?: () => void;
};

export default function UpdateItemModal({
  isOpen,
  onClose,
  item,
  onUpdated,
}: UpdateItemModalProps) {
  const dispatch = useAppDispatch();

  const [editName, setEditName] = useState(item.name);
  const [editStore, setEditStore] = useState<Store>(item.store);
  const [editType, setEditType] = useState<ItemType>(item.type);

  useEffect(() => {
    if (!isOpen) return;
    setEditName(item.name);
    setEditStore(item.store);
    setEditType(item.type);
  }, [isOpen, item]);

  const storeOptions: ReadonlyArray<DropdownOption<Store>> = STORE_OPTIONS.map((store) => ({
    value: store,
    label: store === "general" ? "General" : store,
  }));

  const typeOptions: ReadonlyArray<DropdownOption<ItemType>> = TYPE_OPTIONS.map((type) => ({
    value: type,
    label: type === "general" ? "General" : type,
  }));

  const onSave = async () => {
    const name = editName.trim();
    if (!name) return;

    const result = await dispatch(
      updateItem({
        id: item.id,
        payload: {
          name,
          store: editStore,
          type: editType,
        },
      })
    );

    if (updateItem.fulfilled.match(result)) {
      toast.success("Item updated");
      onClose();
      onUpdated?.();
    } else {
      toast.error(result.payload ?? "Update failed");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit item"
      footer={
        <>
          <Button label="Cancel" variant="secondary" onClick={onClose} />
          <Button label="Save" variant="primary" onClick={() => void onSave()} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Item name"
        />

        <Dropdown<Store>
          label="Store"
          value={editStore}
          onChange={setEditStore}
          options={storeOptions}
        />

        <Dropdown<ItemType>
          label="Type"
          value={editType}
          onChange={setEditType}
          options={typeOptions}
        />
      </div>
    </Modal>
  );
}