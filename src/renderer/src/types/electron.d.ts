declare global {
  interface Window {
    electronAPI: {
      // 会员管理
      getMembers: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>
      getMembersBySearchform: (searchForm: {
        [key: string]: any
      }) => Promise<{ success: boolean; data?: any[]; error?: string }>
      getMemberById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
      getMemberByPhone: (phone: string) => Promise<{ success: boolean; data?: any; error?: string }>
      addMember: (member: any) => Promise<{ success: boolean; data?: any; error?: string }>
      updateMember: (id: number, member: any) => Promise<{ success: boolean; data?: any; error?: string }>
      deleteMember: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
      getMemberTransactions: (
        id: number
      ) => Promise<{ success: boolean; data?: any; error?: string }>
      // 服务项目管理
      getServices: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>
      getServiceById: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>
      addService: (service: any) => Promise<{ success: boolean; data?: any; error?: string }>
      updateService: (id: number, service: any) => Promise<{ success: boolean; data?: any; error?: string }>
      deleteService: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>

      // 交易记录
      getTransactions: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>
      createTransaction: (transaction: any) => Promise<{ success: boolean; data?: any; error?: string }>

      // 充值记录
      getRecharges: (filters?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>
      createRecharge: (recharge: any) => Promise<{ success: boolean; data?: any; error?: string }>

      // 统计报表
      getStatistics: (dateRange?: any) => Promise<{ success: boolean; data?: any; error?: string }>

      // 数据管理
      backupDatabase: () => Promise<{ success: boolean; data?: any; error?: string }>
      getBackupFiles: () => Promise<{ success: boolean; data?: any[]; error?: string }>
      restoreDatabase: (backupFilePath: string) => Promise<{ success: boolean; data?: any; error?: string }>
      deleteBackup: (backupFilePath: string) => Promise<{ success: boolean; data?: any; error?: string }>

      // 通知功能
      showNotification: (options: { title?: string; message: string; icon?: string; silent?: boolean; duration?: number }) => Promise<{ success: boolean; error?: string }>
      showToast: (options: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => Promise<{ success: boolean; error?: string }>

      // 应用控制
      app: {
        close: () => void
        minimize: () => void
        maximize: () => void
      }
    }
  }
}

export {}
