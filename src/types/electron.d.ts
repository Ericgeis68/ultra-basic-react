// Types pour l'API Electron
declare global {
  interface Window {
    electronAPI?: {
      printContent: (options: any) => Promise<{ success: boolean; result?: any; error?: string }>;
      printToPDF: (options: any) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
      getPrinters: () => Promise<{ success: boolean; printers?: any[]; error?: string }>;
      platform: string;
      isElectron: boolean;
    };
    electronEvents?: {
      onPrintComplete: (callback: (event: any, ...args: any[]) => void) => void;
      onPrintError: (callback: (event: any, ...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};
