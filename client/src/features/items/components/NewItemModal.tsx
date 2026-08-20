import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@components/Button";
import Modal from "@components/Modal";
import Input from "@components/Input";
import Dropdown, { type DropdownOption } from "@components/Dropdown";
import { useAppDispatch } from "@store/hooks";
import { createItem } from "../store";
import { STORE_OPTIONS, TYPE_OPTIONS, type ItemType, type Store } from "../types";

type NewItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function NewItemModal({ isOpen, onClose, onCreated }: NewItemModalProps) {
  const dispatch = useAppDispatch();

  const [newItemName, setNewItemName] = useState("");
  const [newItemStore, setNewItemStore] = useState<Store>("general");
  const [newItemType, setNewItemType] = useState<ItemType>("general");

  const storeOptions: ReadonlyArray<DropdownOption<Store>> = STORE_OPTIONS.map((store) => ({
    value: store,
    label: store === "general" ? "General" : store,
  }));

  const typeOptions: ReadonlyArray<DropdownOption<ItemType>> = TYPE_OPTIONS.map((type) => ({
    value: type,
    label: type === "general" ? "General" : type,
  }));

  const resetCreateForm = () => {
    setNewItemName("");
    setNewItemStore("general");
    setNewItemType("general");
  };

  const handleClose = () => {
    onClose();
    resetCreateForm();
  };

  const onCreate = async () => {
    const name = newItemName.trim();
    if (!name) return;

    const result = await dispatch(
      createItem({
        name,
        store: newItemStore,
        type: newItemType,
      })
    );

    if (createItem.fulfilled.match(result)) {
      toast.success("Item created");
      handleClose();
      onCreated?.();
    } else {
      toast.error(result.payload ?? "Create failed");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create item"
      footer={
        <>
          <Button label="Cancel" variant="secondary" onClick={handleClose} />
          <Button label="Create" variant="primary" onClick={() => void onCreate()} />
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void onCreate();
        }}
      >
        <Input
          id="new-item-name"
          autoFocus
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="New item name"
          enterKeyHint="done"
          className="text-base md:text-base"
        />

        <Dropdown<Store>
          label="Store"
          value={newItemStore}
          onChange={setNewItemStore}
          options={storeOptions}
        />

        <Dropdown<ItemType>
          label="Type"
          value={newItemType}
          onChange={setNewItemType}
          options={typeOptions}
        />

        {/* Hidden submit helps mobile keyboards trigger form submission */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}