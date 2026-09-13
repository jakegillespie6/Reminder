import PopoverMenu, {
  type PopoverMenuItem,
} from "@components/PopoverMenu"
import type { EventOccurrence } from "../types";

type Props = {
  open: boolean;
  occurrence: EventOccurrence | null;
  anchorPoint: { x: number; y: number } | null;
  items: PopoverMenuItem[];
  onOpenChange: (open: boolean) => void;
};

export function CalendarEventContextMenu({
  open,
  occurrence,
  anchorPoint,
  items,
  onOpenChange,
}: Props) {
  return (
    <PopoverMenu
      trigger={<span />}
      triggerLabel="Event actions"
      items={occurrence ? items : []}
      open={open}
      onOpenChange={onOpenChange}
      anchorPoint={anchorPoint}
      align="left"
      side="bottom"
      className="hidden"
    />
  );
}