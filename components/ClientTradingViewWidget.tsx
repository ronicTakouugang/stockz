'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicTradingViewWidget = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

interface ClientTradingViewWidgetProps {
  title: string;
  scriptUrl: string;
  config: any; // Use a more specific type if available for config
  className: string;
  height: number;
}

const ClientTradingViewWidget: React.FC<ClientTradingViewWidgetProps> = (props) => {
  return <DynamicTradingViewWidget {...props} />;
};

export default ClientTradingViewWidget;
