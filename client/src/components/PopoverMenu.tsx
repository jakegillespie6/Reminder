import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type PopoverMenuItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type PopoverMenuProps = {
  trigger: ReactNode;
  triggerLabel: string;
  items: PopoverMenuItem[];
  align?: "left" | "right";
  side?: "top" | "bottom";
  openOnContextMenu?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  offset?: number;
  viewportTopInset?: number; // reserved top area (e.g. fixed header height)
};

export default function PopoverMenu({
  trigger,
  triggerLabel,
  items,
  align = "right",
  side = "bottom",
  openOnContextMenu = false,
  open,
  onOpenChange,
  className = "",
  offset = 6,
  viewportTopInset = 0,
}: PopoverMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const [contextPoint, setContextPoint] = useState<{ x: number; y: number } | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);
  const [placement, setPlacement] = useState<{ side: "top" | "bottom"; align: "left" | "right" }>({
    side,
    align,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }

    const placeMenu = () => {
      const menuEl = menuRef.current;
      if (!menuEl) return;

      const margin = 8;
      const menuW = menuEl.offsetWidth;
      const menuH = menuEl.offsetHeight;

      const minLeft = margin;
      const minTop = viewportTopInset + margin;
      const maxLeft = window.innerWidth - menuW - margin;
      const maxTop = window.innerHeight - menuH - margin;

      let left = 0;
      let top = 0;
      let resolvedSide: "top" | "bottom" = side;
      let resolvedAlign: "left" | "right" = align;

      if (contextPoint) {
        left = contextPoint.x + offset;
        top = contextPoint.y + offset;
      } else {
        const triggerEl = triggerRef.current;
        if (!triggerEl) return;

        const rect = triggerEl.getBoundingClientRect();

        // flip vertically if needed
        if (side === "top" && rect.top - menuH - offset < minTop) resolvedSide = "bottom";
        if (side === "bottom" && rect.bottom + offset + menuH > maxTop) resolvedSide = "top";

        // flip horizontally if needed
        if (align === "right" && rect.right - menuW < minLeft) resolvedAlign = "left";
        if (align === "left" && rect.left + menuW > maxLeft) resolvedAlign = "right";

        left = resolvedAlign === "right" ? rect.right - menuW : rect.left;
        top = resolvedSide === "top" ? rect.top - menuH - offset : rect.bottom + offset;
      }

      left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));
      top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));

      setPlacement({ side: resolvedSide, align: resolvedAlign });
      setMenuPos({ left: Math.round(left), top: Math.round(top) });
      setIsPositioned(true);
    };

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);

    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [isOpen, align, side, items.length, contextPoint, offset, viewportTopInset]);

  const transformOrigin = `${placement.side === "top" ? "bottom" : "top"} ${
    placement.align === "right" ? "right" : "left"
  }`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          setContextPoint(null);
          setIsPositioned(false);
          setOpen(!isOpen);
        }}
        onContextMenu={(e) => {
          if (!openOnContextMenu) return;
          e.preventDefault();
          setContextPoint({ x: e.clientX, y: e.clientY });
          setIsPositioned(false);
          setOpen(true);
        }}
        className="
          group
          rounded-md
          border-0
          bg-transparent
          p-0
          outline-none
          ring-0
          focus:outline-none
          focus:ring-0
          focus-visible:outline-none
          focus-visible:ring-0
        "
      >
        {trigger}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.96, y: side === "top" ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: side === "top" ? 4 : -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={{
                left: menuPos.left,
                top: menuPos.top,
                visibility: isPositioned ? "visible" : "hidden",
                transformOrigin,
              }}
              className="fixed z-[4900] min-w-52 sm:min-w-44 rounded-md border border-border bg-surface p-1.5 sm:p-1 shadow-lg"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`flex w-full min-h-11 items-center gap-2 rounded-md px-4 py-2.5 sm:px-3 sm:py-2 text-left text-base sm:text-sm transition-colors
                    ${
                      item.danger
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-text-primary hover:bg-surface-elevated"
                    }
                    disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}