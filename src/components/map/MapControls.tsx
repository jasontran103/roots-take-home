"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';

interface MapControlsProps {
  onResetView: () => void;
  showPropertyCards: boolean;
  onTogglePropertyCards: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onResetView,
  showPropertyCards,
  onTogglePropertyCards,
}) => {
  return (
    <div className="text-neo-black absolute bottom-4 right-4 z-20">      
      <Button 
        onClick={onTogglePropertyCards}
        className="neo-button-primary ml-2 border-4 border-neo-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        {showPropertyCards ? 'Hide Cards' : 'Show Cards'}
      </Button>
    </div>
  );
}; 