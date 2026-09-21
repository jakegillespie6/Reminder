import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface PopoverCardProps {
  open: boolean;
  children: ReactNode;
  footer?: ReactNode;
  anchorPoint?: { x: number; y: number } | null;
  anchorRef?: RefObject<HTMLElement | null>;
  side?: "top" | "bottom";
  align?: "left" | "right";
  offset?: number;
  viewportTopInset?: number;
  className?: string;
  onOpenChange: (open: boolean) => void;
}

export function PopoverCard({
  open,
  children,
  footer,
  anchorPoint = null,
  anchorRef,
  side = "bottom",
  align = "right",
  offset = 6,
  viewportTopInset = 0,
  className = "",
  onOpenChange,
}: PopoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [placement, setPlacement] = useState({ side, align });

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !cardRef.current?.contains(target) &&
        !anchorRef?.current?.contains(target)
      ) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, close]);

  useLayoutEffect(() => {
    if (!open) {
      setIsPositioned(false);
      return;
    }

    const placeCard = () => {
      const card = cardRef.current;
      if (!card) return;

      const margin = 8;
      const width = card.offsetWidth;
      const height = card.offsetHeight;

      const minLeft = margin;
      const minTop = viewportTopInset + margin;
      const maxLeft = window.innerWidth - width - margin;
      const maxTop = window.innerHeight - height - margin;

      let left = 0;
      let top = 0;
      let resolvedSide = side;
      let resolvedAlign = align;

      if (anchorPoint) {
        left = anchorPoint.x + offset;
        top = anchorPoint.y + offset;
      } else if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();

        if (side === "top" && rect.top - height - offset < minTop) {
          resolvedSide = "bottom";
        }

        if (
          side === "bottom" &&
          rect.bottom + height + offset > window.innerHeight - margin
        ) {
          resolvedSide = "top";
        }

        if (align === "right" && rect.right - width < minLeft) {
          resolvedAlign = "left";
        }

        if (align === "left" && rect.left + width > maxLeft) {
          resolvedAlign = "right";
        }

        left =
          resolvedAlign === "right"
            ? rect.right - width
            : rect.left;

        top =
          resolvedSide === "top"
            ? rect.top - height - offset
            : rect.bottom + offset;
      }

      setPlacement({
        side: resolvedSide,
        align: resolvedAlign,
      });

      setPosition({
        left: Math.round(
          Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft)),
        ),
        top: Math.round(
          Math.min(Math.max(top, minTop), Math.max(minTop, maxTop)),
        ),
      });

      setIsPositioned(true);
    };

    placeCard();

    window.addEventListener("resize", placeCard);
    window.addEventListener("scroll", placeCard, true);

    return () => {
      window.removeEventListener("resize", placeCard);
      window.removeEventListener("scroll", placeCard, true);
    };
  }, [
    open,
    anchorPoint,
    anchorRef,
    side,
    align,
    offset,
    viewportTopInset,
  ]);

  const transformOrigin = `${placement.side === "top" ? "bottom" : "top"} ${
    placement.align === "right" ? "right" : "left"
  }`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={cardRef}
          role="dialog"
          initial={{
            opacity: 0,
            scale: 0.96,
            y: placement.side === "top" ? 6 : -6,
          }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            y: placement.side === "top" ? 4 : -4,
          }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          style={{
            left: position.left,
            top: position.top,
            visibility: isPositioned ? "visible" : "hidden",
            transformOrigin,
          }}
          className={`fixed z-[4900] w-80 rounded-md border border-border bg-surface p-4 shadow-lg ${className}`}
        >
          <div>{children}</div>

          {footer && (
            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              {footer}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}