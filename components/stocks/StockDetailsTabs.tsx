"use client";

import React, { useState } from 'react';

interface StockDetailsTabsProps {
  overview: React.ReactNode;
  forecast: React.ReactNode;
  financials: React.ReactNode;
  company: React.ReactNode;
}

const StockDetailsTabs = ({ 
  overview, 
  forecast, 
  financials,
  company 
}: StockDetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'forecast', label: 'AI Forecast' },
    { id: 'financials', label: 'Financials' },
    { id: 'company', label: 'Company' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex border-b border-neutral-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full animate-in fade-in duration-500">
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          {overview}
        </div>
        <div className={activeTab === 'forecast' ? 'block' : 'hidden'}>
          {forecast}
        </div>
        <div className={activeTab === 'financials' ? 'block' : 'hidden'}>
          {financials}
        </div>
        <div className={activeTab === 'company' ? 'block' : 'hidden'}>
          {company}
        </div>
      </div>
    </div>
  );
};

export default StockDetailsTabs;
