import { useEffect, type ReactNode } from "react";
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
}: ModalProps) {
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <LayerContext.Provider value={zIndex}>
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"
            style={{ zIndex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={`w-full ${maxWidthClassName} rounded-md border border-border bg-background-secondary p-4 shadow-xl`}
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