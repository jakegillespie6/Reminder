import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

type TabValue = string | number;

type TabsContextValue = {
  value: TabValue;
  onChange: (event: SyntheticEvent, newValue: TabValue) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>.");
  }
  return ctx;
}

function valueKey(value: TabValue) {
  return encodeURIComponent(String(value));
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type TabsProps = {
  value: TabValue;
  onChange: (event: SyntheticEvent, newValue: TabValue) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({ value, onChange, children, className }: TabsProps) {
  const id = useId();

  return (
    <TabsContext.Provider value={{ value, onChange, baseId: id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

export function TabsList({ children, ariaLabel, className }: TabsListProps) {
  const { value } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  const updateIndicator = () => {
    const list = listRef.current;
    if (!list) return;

    const selected = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!selected) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }

    const listRect = list.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();

    setIndicator({
      left: Math.round(selectedRect.left - listRect.left),
      width: Math.round(selectedRect.width),
      visible: true,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [value, children]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(onResize);
    ro.observe(list);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;

    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    );

    if (!tabs.length) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    let nextIndex = currentIndex;

    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = tabs.length - 1;
    if (e.key === "ArrowRight") nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    if (e.key === "ArrowLeft") nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;

    e.preventDefault();
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cx(
        "relative box-border flex flex-nowrap items-stretch gap-2 border-b border-border min-h-[49px]",
        className
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-0.5 bg-accent transition-all duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
    </div>
  );
}

type TabProps = {
  value: TabValue;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Tab({ value, children, disabled, className }: TabProps) {
  const { value: selectedValue, onChange, baseId } = useTabsContext();
  const selected = selectedValue === value;
  const key = valueKey(value);
  const tabId = `${baseId}-tab-${key}`;
  const panelId = `${baseId}-panel-${key}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={(e) => onChange(e, value)}
      className={cx(
        "px-4 py-3 text-sm font-medium transition-colors",
        selected ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

type TabPanelProps = {
  value: TabValue;
  children: ReactNode;
  className?: string;
  keepMounted?: boolean;
};

export function TabPanel({ value, children, className, keepMounted = false }: TabPanelProps) {
  const { value: selectedValue, baseId } = useTabsContext();
  const selected = selectedValue === value;
  const key = valueKey(value);
  const tabId = `${baseId}-tab-${key}`;
  const panelId = `${baseId}-panel-${key}`;

  if (!selected && !keepMounted) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      hidden={!selected}
      className={className}
    >
      {children}
    </div>
  );
}