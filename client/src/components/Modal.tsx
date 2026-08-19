import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { LayerContext } from "./LayerContext";

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  closeOnBackdropClick?: boolean;
  zIndex?: number;
  initialFocusSelector?: string;
};

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-lg",
  closeOnBackdropClick = true,
  zIndex = 6000,
  initialFocusSelector,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !initialFocusSelector) return;

    const timer = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;

      const target = root.querySelector<HTMLElement>(initialFocusSelector);
      if (!target) return;

      target.focus();

      // Optional: select existing text if it's an input/textarea
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.select();
      }
    }, 30);

    return () => window.clearTimeout(timer);
  }, [isOpen, initialFocusSelector]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <LayerContext.Provider value={zIndex}>
          <motion.div
            className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4"
            style={{ zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`w-full ${maxWidthClassName} rounded-md border border-border bg-background-secondary p-4 shadow-xl max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto mb-[env(safe-area-inset-bottom)]`}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -80 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              </div>

              <div>{children}</div>

              {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
            </motion.div>
          </motion.div>
        </LayerContext.Provider>
      )}
    </AnimatePresence>,
    document.body
  );
}