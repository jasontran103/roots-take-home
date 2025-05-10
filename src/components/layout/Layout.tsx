"use client";
import React, { useState } from 'react';
import Header from './Header';
import MainNav from './MainNav';

interface LayoutProps {
  children: React.ReactNode;
  tabs?: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  tabs = [], 
  activeTab, 
  onTabChange 
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab || (tabs.length > 0 ? tabs[0].value : ''));

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <Header />
      <MainNav tabs={tabs} currentTab={currentTab} onTabChange={handleTabChange} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout; 