import { useState } from "react";
import ThemeSettingsSection from "@features/global-settings/components/ThemeSettingsSection";
import CalendarSettingsSection from "@features/global-settings/components/CalendarSettingsSection";
import ItemFiltersSettingsSection from "@features/global-settings/components/ItemFiltersSettingsSection";
import ItemsManagerSection from "@features/items/components/ItemsManagerSection";
import { Tabs, TabsList, Tab, TabPanel } from "@components/Tabs";
import CollapsibleSection from "@components/CollapsibleSection";

type HomeTab = "items" | "calendar" | "global";

export default function Home() {
  const [activeTab, setActiveTab] = useState<HomeTab>("items");

  return (
    <div className="relative min-h-full bg-background-primary px-1 pb-0 text-text-primary">
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue as HomeTab)}
        className="space-y-2"
      >
        <TabsList
          ariaLabel="Home navigation tabs"
          className="sticky top-0 z-20 h-11 border-b border-border bg-background-primary"
        >
          <Tab value="items">Items</Tab>
          <Tab value="calendar">Calendar</Tab>
          <Tab value="global">Global Settings</Tab>
        </TabsList>

        <div className="space-y-6">
          <TabPanel value="items">
            <ItemsManagerSection />
          </TabPanel>

          <TabPanel value="calendar">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Calendar</h2>
              <p className="text-sm text-text-secondary">
                Add your calendar view/component here.
              </p>
            </section>
          </TabPanel>

          <TabPanel value="global">
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