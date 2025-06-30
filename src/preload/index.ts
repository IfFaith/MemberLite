import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // 会员管理
  getMembers: (filters?: any) => ipcRenderer.invoke('get-members', filters),
  getMembersBySearchform: (searchForm) =>
    ipcRenderer.invoke('get-members-by-searchform', searchForm),
  getMemberById: (id: number) => ipcRenderer.invoke('get-member-by-id', id),
  getMemberByPhone: (phone: string) => ipcRenderer.invoke('get-member-by-phone', phone),
  addMember: (member: any) => ipcRenderer.invoke('add-member', member),
  updateMember: (id: number, member: any) => ipcRenderer.invoke('update-member', id, member),
  deleteMember: (id: number) => ipcRenderer.invoke('delete-member', id),
  getMemberTransactions: (id: number) => ipcRenderer.invoke('get-member-transactions', id),

  // 服务项目管理
  getServices: (filters?: any) => ipcRenderer.invoke('get-services', filters),
  getServiceById: (id: number) => ipcRenderer.invoke('get-service-by-id', id),
  addService: (service: any) => ipcRenderer.invoke('add-service', service),
  updateService: (id: number, service: any) => ipcRenderer.invoke('update-service', id, service),
  deleteService: (id: number) => ipcRenderer.invoke('delete-service', id),

  // 交易记录
  getTransactions: (filters?: any) => ipcRenderer.invoke('get-transactions', filters),
  createTransaction: (transaction: any) => ipcRenderer.invoke('create-transaction', transaction),

  // 充值记录
  getRecharges: (filters?: any) => ipcRenderer.invoke('get-recharges', filters),
  createRecharge: (recharge: any) => ipcRenderer.invoke('create-recharge', recharge),

  // 统计报表
  getStatistics: (dateRange?: any) => ipcRenderer.invoke('get-statistics', dateRange),

  // 数据管理
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  getBackupFiles: () => ipcRenderer.invoke('get-backup-files'),
  restoreDatabase: (backupFilePath: string) => ipcRenderer.invoke('restore-database', backupFilePath),
  deleteBackup: (backupFilePath: string) => ipcRenderer.invoke('delete-backup', backupFilePath),

  // 通知功能
  showNotification: (options: any) => ipcRenderer.invoke('show-notification', options),
  showToast: (options: any) => ipcRenderer.invoke('show-toast', options),

  // 应用控制
  close: () => ipcRenderer.invoke('app-close'),
  minimize: () => ipcRenderer.invoke('app-minimize'),
  maximize: () => ipcRenderer.invoke('app-maximize')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = api
}

// 类型声明
declare global {
  interface Window {
    electronAPI: typeof api
  }
}
