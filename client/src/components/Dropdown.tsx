import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { IoMdCheckmark } from "react-icons/io";
import { useLayerZIndex } from "./LayerContext";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

type DropdownProps<T extends string> = {
  value: T;
  options: ReadonlyArray<DropdownOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  menuZIndex?: number;
};

export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  label,
  menuZIndex,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value]
  );

  const layerZIndex = useLayerZIndex();
  const resolvedMenuZIndex = menuZIndex ?? layerZIndex + 1;

  useEffect(() => {
    const updateMenuPos = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    if (!open) return;

    updateMenuPos();
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);

    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
    };
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <div className="mb-1 text-xs font-medium text-text-primary">{label}</div>
      ) : null}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full h-[34px] rounded-md border border-border bg-background-tertiary px-3",
          "text-sm text-text-primary flex items-center justify-between",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <span>{selected?.label}</span>
        <span className="text-text-secondary" aria-hidden>
          {open ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
        </span>
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence initial={false}>
              {open && !disabled ? (
                <motion.div
                  ref={menuRef}
                  key="menu"
                  initial={{ height: 0, opacity: 0, y: -4 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: menuPos.top,
                    left: menuPos.left,
                    width: menuPos.width,
                    zIndex: resolvedMenuZIndex,
                  }}
                  className="overflow-hidden rounded-md border border-border bg-background-tertiary shadow-lg"
                >
                  <ul className="py-1">
                    {options.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <li key={option.value}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(option.value);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm flex items-center justify-between",
                              "hover:bg-background-secondary",
                              isSelected ? "text-accent" : "text-text-primary"
                            )}
                          >
                            <span>{option.label}</span>
                            <span
                              className={cn(
                                "ml-3 text-accent transition-opacity",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                              aria-hidden
                            >
                              <IoMdCheckmark size={16} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}