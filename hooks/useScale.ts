import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Navigator interface for Web Serial API types
declare global {
  interface Navigator {
    serial: {
      requestPort: (options?: any) => Promise<any>;
      getPorts: () => Promise<any[]>;
    };
  }
}

export interface UseScaleResult {
  weightKg: number;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  resetWeight: () => void;
}

export const useScale = (): UseScaleResult => {
  const [weightKg, setWeightKg] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Refs to maintain connection state across renders
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const bufferRef = useRef<string>('');

  // Process the buffer to extract the latest valid weight
  const processBuffer = useCallback(() => {
    const buffer = bufferRef.current;
    // Split data by newlines (common in serial devices)
    const lines = buffer.split(/[\r\n]+/);
    
    // Check if the buffer ends with a delimiter to safely determine split integrity
    const endsWithDelimiter = /[\r\n]+$/.test(buffer);
    
    // If it doesn't end with a delimiter, keep the last chunk for the next read
    let incomplete = '';
    if (!endsWithDelimiter) {
        incomplete = lines.pop() || '';
    }

    // Iterate through complete lines to find the weight
    for (const line of lines) {
        if (!line.trim()) continue;
        
        // Regex to match decimal numbers (e.g. 1.23, 0.500, 0.00)
        // Matches typical scale outputs like "ST,GS,+  0.500kg" or "0.000kg"
        // Updated to match 0.00 and other decimal values including zero
        const match = line.match(/([0-9]+\.?[0-9]*|0\.0+)/);
        if (match && match[1]) {
            const val = parseFloat(match[1]);
            // Accept all values including 0.00 (real-time weight reading)
            if (!isNaN(val)) {
                setWeightKg(val);
            }
        }
    }

    // Update buffer with the remaining incomplete fragment
    bufferRef.current = incomplete;
  }, []);

  // Main read loop
  const readLoop = async () => {
    if (!portRef.current?.readable) return;

    while (portRef.current.readable && keepReadingRef.current) {
      try {
        readerRef.current = portRef.current.readable.getReader();
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) {
            break; // Stream closed
          }
          if (value) {
            const chunk = new TextDecoder().decode(value);
            bufferRef.current += chunk;
            processBuffer();
          }
        }
      } catch (error) {
        console.error("Scale read error:", error);
        break;
      } finally {
        readerRef.current?.releaseLock();
      }
    }
  };

  const openPort = async (port: any) => {
    try {
      // 9600 baud rate is standard for most digital scales
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setIsConnected(true);
      keepReadingRef.current = true;
      
      // Start reading
      readLoop();
      
      // Handle disconnection (e.g. USB unplugged)
      port.addEventListener('disconnect', () => {
          setIsConnected(false);
          keepReadingRef.current = false;
          portRef.current = null;
      });

    } catch (error) {
      console.error("Failed to open scale port:", error);
      setIsConnected(false);
    }
  };

  const connect = async () => {
    if (!('serial' in navigator)) {
      console.warn("Browser does not support Web Serial API");
      return;
    }

    try {
      // Request user to select a port
      const port = await navigator.serial.requestPort();
      await openPort(port);
    } catch (error) {
      console.error("User cancelled or failed to select port:", error);
    }
  };

  const autoConnect = async () => {
      if (!('serial' in navigator)) return;
      
      try {
          const ports = await navigator.serial.getPorts();
          if (ports.length > 0) {
              const port = ports[0];
              
              // Check if port is already open and connected
              if (portRef.current && portRef.current === port) {
                  // Port already connected - don't reconnect
                  return;
              }
              
              // Check if port is already open (readable) but not in our ref
              if (port.readable) {
                  // Port is open but we don't have reference - reuse it
                  portRef.current = port;
                  setIsConnected(true);
                  keepReadingRef.current = true;
                  readLoop();
                  return;
              }
              
              // Open port if not already open
              await openPort(port);
          }
      } catch (err) {
          console.error("Auto connect failed", err);
      }
  };

  const disconnect = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
          await readerRef.current.cancel();
      } catch (e) { /* ignore */ }
    }
    if (portRef.current) {
        try {
            await portRef.current.close();
        } catch (e) { /* ignore */ }
    }
    portRef.current = null;
    setIsConnected(false);
  };

  const resetWeight = useCallback(() => {
    setWeightKg(0);
  }, []);

  useEffect(() => {
    autoConnect();
    return () => {
        // Cleanup: Don't disconnect port, just stop reading temporarily
        // This allows connection to persist across screen changes
        keepReadingRef.current = false;
        if (readerRef.current) {
            readerRef.current.cancel().catch(() => {});
        }
    };
  }, []);

  return { weightKg, isConnected, connect, disconnect, resetWeight };
};
