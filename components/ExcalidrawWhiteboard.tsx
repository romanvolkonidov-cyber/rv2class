"use client";

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface ExcalidrawWhiteboardProps {
  roomId: string;
  onClose: () => void;
  jitsiApi?: any;
  isTutor?: boolean;
}

export default function ExcalidrawWhiteboard({ roomId, onClose, jitsiApi, isTutor = false }: ExcalidrawWhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when whiteboard is open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    if (!excalidrawAPI) return;

    const savedData = localStorage.getItem(`excalidraw-${roomId}`);
    if (savedData) {
      try {
        const { elements, appState } = JSON.parse(savedData);
        excalidrawAPI.updateScene({
          elements,
          appState,
        });
      } catch (error) {
        console.error('Failed to load saved whiteboard:', error);
      }
    }
  }, [excalidrawAPI, roomId]);

  // Auto-save to localStorage
  const handleChange = useCallback(
    (elements: any, appState: any) => {
      const dataToSave = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemFontFamily: appState.currentItemFontFamily,
          currentItemFontSize: appState.currentItemFontSize,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
          currentItemFillStyle: appState.currentItemFillStyle,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          currentItemRoughness: appState.currentItemRoughness,
          currentItemOpacity: appState.currentItemOpacity,
        },
      };
      
      localStorage.setItem(`excalidraw-${roomId}`, JSON.stringify(dataToSave));

      // Broadcast changes via Jitsi data channel for real-time collaboration
      if (jitsiApi && isCollaborating) {
        try {
          jitsiApi.executeCommand('sendEndpointTextMessage', '', JSON.stringify({
            type: 'excalidraw-update',
            roomId,
            elements: elements.slice(-1), // Only send the last changed element
            timestamp: Date.now(),
          }));
        } catch (error) {
          console.error('Failed to broadcast whiteboard update:', error);
        }
      }
    },
    [roomId, jitsiApi, isCollaborating]
  );

  // Receive real-time updates from other participants
  useEffect(() => {
    if (!jitsiApi || !excalidrawAPI) return;

    const handleDataChannelMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'excalidraw-update' && data.roomId === roomId) {
          // Update the canvas with received elements
          const currentElements = excalidrawAPI.getSceneElements();
          excalidrawAPI.updateScene({
            elements: [...currentElements, ...data.elements],
          });
        }
      } catch (error) {
        console.error('Failed to handle whiteboard update:', error);
      }
    };

    jitsiApi.addListener('endpointTextMessageReceived', handleDataChannelMessage);

    return () => {
      jitsiApi.removeListener('endpointTextMessageReceived', handleDataChannelMessage);
    };
  }, [jitsiApi, excalidrawAPI, roomId]);

  // Don't render on server
  if (!isClient) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-white flex flex-col"
      style={{ 
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      {/* Header with close button and collaboration status */}
      <div className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Collaborative Whiteboard
          </h2>
          {isCollaborating && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 mr-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTutor && (
            <Button
              onClick={() => setIsCollaborating(!isCollaborating)}
              variant="outline"
              size="sm"
              className="text-xs"
              title={isCollaborating ? "Disable real-time sync" : "Enable real-time sync"}
            >
              {isCollaborating ? "🔗 Syncing" : "⛓️ Sync Off"}
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100"
            title="Close whiteboard"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="flex-1 overflow-hidden">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={handleChange}
          theme="light"
          name="rv2class-whiteboard"
          UIOptions={{
            canvasActions: {
              loadScene: true,
              export: { saveFileToDisk: true },
              saveAsImage: true,
            },
          }}
        />
      </div>
    </div>
  );
}
