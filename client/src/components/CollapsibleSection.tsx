import { useId, useState, type ReactNode } from "react";
import { FiChevronDown } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-center justify-between border-b border-border pb-2 text-left"
      >
        <h3
          className={`text-base font-semibold transition-colors ${
            isOpen ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {title}
        </h3>
        <FiChevronDown
          className={`transition-transform transition-colors ${
            isOpen ? "rotate-180 text-text-primary" : "text-text-secondary"
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            key="collapsible-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}