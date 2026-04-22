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
      checkTcpPort: (host: string, port: number) => Promise<boolean>;
      checkMinioBucket: (
        endpoint: string,
        accessKey: string,
        secretKey: string,
        bucketName: string,
      ) => Promise<{
        exists: boolean;
        accessible: boolean;
        error?: string;
      }>;
      getMinioConfig: (bucketName: string) => Promise<{
        success: boolean;
        dataPath?: string;
        bucketExists?: boolean;
        bucketPath?: string;
        error?: string;
      }>;
      getAppConfigPath: () => Promise<{
        success: boolean;
        configPath: string;
      }>;
      openConfigFolder: () => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}
