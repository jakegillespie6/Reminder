import { useState } from "react";
import ThemeSettingsSection from "@features/global-settings/components/ThemeSettingsSection";
import CalendarSettingsSection from "@features/global-settings/components/CalendarSettingsSection";
import ItemFiltersSettingsSection from "@features/global-settings/components/ItemFiltersSettingsSection";
import ItemsManagerSection from "@features/items/components/ItemsManagerSection";
import { CalendarEventsScheduler } from "@features/calendar_events/components/CalendarEventScheduler";
import { Tabs, TabsList, Tab, TabPanel } from "@components/Tabs";
import CollapsibleSection from "@components/CollapsibleSection";

type HomeTab = "items" | "calendar" | "global";

export default function Home() {
  const [activeTab, setActiveTab] = useState<HomeTab>("items");

  return (
    <div className="relative h-full overflow-hidden bg-background-primary px-1 text-text-primary">
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue as HomeTab)}
        className="flex h-full min-h-0 flex-col gap-2"
      >
        <TabsList
          ariaLabel="Home navigation tabs"
          className="sticky top-0 z-20 h-11 shrink-0 border-b border-border bg-background-primary"
        >
          <Tab value="items">Items</Tab>
          <Tab value="calendar">Calendar</Tab>
          <Tab value="global">Global Settings</Tab>
        </TabsList>

        <div className="min-h-0 flex-1">
          <TabPanel value="items" className="h-full overflow-y-auto">
            <ItemsManagerSection />
          </TabPanel>

          <TabPanel value="calendar" className="h-full overflow-hidden">
            <CalendarEventsScheduler />
          </TabPanel>

          <TabPanel value="global" className="h-full overflow-y-auto">
            <section className="space-y-4">
              <CollapsibleSection
                title="Item Filters"
                defaultOpen
                className="px-4 py-3"
              >
                <ItemFiltersSettingsSection />
              </CollapsibleSection>

              <CollapsibleSection
                title="Calendar Settings"
                defaultOpen
                className="px-4 py-3"
              >
                <CalendarSettingsSection />
              </CollapsibleSection>

              <CollapsibleSection
                title="Theme Settings"
                defaultOpen
                className="px-4 py-3"
              >
                <ThemeSettingsSection />
              </CollapsibleSection>
            </section>
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
}