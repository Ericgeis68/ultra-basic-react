// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Torch } from '@capawesome/capacitor-torch';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

const TorchTest: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    checkTorchAvailability();
  }, []);

  const checkTorchAvailability = async () => {
    try {
      addLog('Checking torch availability...');
      addLog(`Platform: ${Capacitor.getPlatform()}`);
      addLog(`Is native: ${Capacitor.isNativePlatform()}`);
      
      if (Capacitor.isNativePlatform()) {
        const { available } = await Torch.isAvailable();
        addLog(`Torch available: ${available}`);
        setIsAvailable(available);
      } else {
        addLog('Web platform - torch not available');
        setIsAvailable(false);
      }
    } catch (error) {
      addLog(`Error checking torch: ${error.message}`);
      setIsAvailable(false);
    }
  };

  const toggleTorch = async () => {
    try {
      if (isOn) {
        addLog('Turning off torch...');
        await Torch.disable();
        setIsOn(false);
        addLog('Torch turned off');
      } else {
        addLog('Turning on torch...');
        await Torch.enable();
        setIsOn(true);
        addLog('Torch turned on');
      }
    } catch (error) {
      addLog(`Error toggling torch: ${error.message}`);
    }
  };

  const checkCameraPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      addLog(`Camera permissions: ${JSON.stringify(permissions)}`);
    } catch (error) {
      addLog(`Error checking camera permissions: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Torch Test</h2>
      
      <div className="space-y-2">
        <Button onClick={checkTorchAvailability}>
          Check Torch Availability
        </Button>
        
        <Button onClick={checkCameraPermissions}>
          Check Camera Permissions
        </Button>
        
        <Button 
          onClick={toggleTorch}
          disabled={!isAvailable}
          variant={isOn ? "destructive" : "default"}
        >
          {isOn ? "Turn Off Torch" : "Turn On Torch"}
        </Button>
      </div>

      <div className="space-y-2">
        <p>Status: {isAvailable === null ? "Checking..." : isAvailable ? "Available" : "Not Available"}</p>
        <p>Torch: {isOn ? "ON" : "OFF"}</p>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default TorchTest;
