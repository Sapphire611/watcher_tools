// src/global.d.ts
export {};

declare global {
  interface Window {
    api: {
      getAppVersion: () => Promise<string>;
      ping: () => Promise<string>;
      asyncOperation: (data: string) => Promise<string>;
      httpPost: (
        url: string,
        data: any,
      ) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;
    };
  }
}
