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
      uploadProductSerial: () => Promise<{
        success: boolean;
        folderName?: string;
        targetPath?: string;
        error?: string;
      }>;
      getPresetConfigs: () => Promise<{
        success: boolean;
        configs?: { [key: string]: string[] };
        error?: string;
      }>;
      applyPresetConfig: (fileName: string, backupName?: string) => Promise<{
        success: boolean;
        appliedFile?: string;
        error?: string;
      }>;
      getConfigFolders: () => Promise<{
        success: boolean;
        folders?: string[];
        error?: string;
      }>;
      switchConfigFolder: (folderName: string, backupName?: string) => Promise<{
        success: boolean;
        appliedFolder?: string;
        needRestart?: boolean;
        error?: string;
      }>;
      getMesTypes: () => Promise<{
        success: boolean;
        mesTypes?: string[];
        currentMesType?: string;
        error?: string;
      }>;
      applyMesType: (mesType: string) => Promise<{
        success: boolean;
        mesType?: string;
        error?: string;
      }>;
      selectAndReadFile: () => Promise<{
        canceled: boolean;
        filePath?: string;
        content?: string;
        error?: string;
      }>;
    };
  }
}
