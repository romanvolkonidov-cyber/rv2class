"use client";

import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface TldrawWhiteboardProps {
  roomId: string;
  onClose: () => void;
}

export default function TldrawWhiteboard({ roomId, onClose }: TldrawWhiteboardProps) {
  // Prevent body scroll when whiteboard is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-white flex flex-col"
      style={{ 
        touchAction: 'none', // Prevent default touch behaviors
        WebkitTouchCallout: 'none', // Prevent iOS callout
        userSelect: 'none'
      }}
    >
      {/* Header with close button */}
      <div className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Collaborative Whiteboard
        </h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* tldraw canvas - flex-1 takes remaining space */}
      <div 
        className="flex-1 overflow-hidden relative"
        style={{
          touchAction: 'none', // Allow tldraw to handle all touch events
        }}
      >
        <Tldraw
          persistenceKey={`rv2class-${roomId}`}
          autoFocus
          inferDarkMode={false}
          hideUi={false}
          // Explicitly show all UI components
          components={{
            Toolbar: null, // Use default toolbar
          }}
        />
      </div>
      
      {/* Add custom CSS to ensure toolbar is always visible as ONE unified bar */}
      <style jsx global>{`
        .tldraw {
          --color-background: white !important;
        }
        
        /* Hide scattered UI elements - we want one unified toolbar */
        .tlui-layout__top,
        .tlui-layout__top__left,
        .tlui-layout__top__right,
        .tlui-navigation-zone,
        .tlui-helper-buttons {
          display: none !important;
        }
        
        /* Keep main toolbar visible as ONE BAR at bottom center */
        .tlui-toolbar {
          display: flex !important;
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 9999 !important;
          background: white !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
          padding: 12px 16px !important;
          gap: 8px !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          flex-direction: row !important;
          align-items: center !important;
        }
        
        /* Ensure toolbar inner container shows all tools in a row */
        .tlui-toolbar__inner {
          display: flex !important;
          flex-direction: row !important;
          gap: 4px !important;
          align-items: center !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Make toolbar tools visible in a single row */
        .tlui-toolbar__tools {
          display: flex !important;
          flex-direction: row !important;
          gap: 4px !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        
        /* Ensure all toolbar buttons are visible */
        .tlui-toolbar__tools > *,
        .tlui-button {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
          min-width: 48px !important;
          min-height: 48px !important;
        }
        
        /* Keep style panel visible when tool is selected - positioned near toolbar */
        .tlui-style-panel {
          display: flex !important;
          position: fixed !important;
          bottom: 90px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          z-index: 9999 !important;
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
          padding: 12px !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        
        /* Ensure the main canvas allows interactions */
        .tl-canvas {
          touch-action: none !important;
        }
        
        /* Make sure buttons stay visible when selected */
        .tlui-button:active,
        .tlui-button:focus,
        .tlui-button[data-state="selected"],
        .tlui-button[data-state="hinted"] {
          opacity: 1 !important;
          visibility: visible !important;
          display: flex !important;
        }
        
        /* Keep the layout visible */
        .tlui-layout,
        .tlui-layout__bottom {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
  );
}
