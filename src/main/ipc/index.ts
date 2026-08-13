import { register as ping } from './system/ping'
import { register as getAppVersion } from './system/get-app-version'
import { register as asyncOperation } from './system/async-operation'
import { register as selectAndReadFile } from './system/select-and-read-file'
import { register as httpPost } from './network/http-post'
import { register as checkTcpPort } from './network/check-tcp-port'
import { register as checkMinioBucket } from './network/check-minio-bucket'
import { register as getMinioConfig } from './minio/get-minio-config'
import { register as getAppConfigPath } from './config/get-app-config-path'
import { register as openConfigFolder } from './config/open-config-folder'
import { register as getPresetConfigs } from './config/get-preset-configs'
import { register as applyPresetConfig } from './config/apply-preset-config'
import { register as getConfigFolders } from './config/get-config-folders'
import { register as switchConfigFolder } from './config/switch-config-folder'
import { register as uploadProductSerial } from './product/upload-product-serial'
import { register as getMesTypes } from './mes/get-mes-types'
import { register as applyMesType } from './mes/apply-mes-type'

export function createIPCHandlers(): void {
  // system
  ping()
  getAppVersion()
  asyncOperation()
  selectAndReadFile()
  // network
  httpPost()
  checkTcpPort()
  checkMinioBucket()
  // minio
  getMinioConfig()
  // config
  getAppConfigPath()
  openConfigFolder()
  getPresetConfigs()
  applyPresetConfig()
  getConfigFolders()
  switchConfigFolder()
  // product
  uploadProductSerial()
  // mes
  getMesTypes()
  applyMesType()
}
