"use client";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MainNavProps {
  tabs: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  currentTab: string;
  onTabChange: (value: string) => void;
}

const MainNav: React.FC<MainNavProps> = ({ tabs, currentTab, onTabChange }) => {
  if (!tabs.length) return null;
  return (
    <div className="bg-white border-b-4 border-neo-black sticky top-0 z-10">
      <div className="neo-container mx-auto py-3">
        <Tabs
          value={currentTab}
          onValueChange={onTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto border-4 border-neo-black">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center space-x-2 text-base font-bold text-black data-[state=active]:bg-neo-primary data-[state=active]:!text-black"
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default MainNav; 