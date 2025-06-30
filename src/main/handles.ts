import { ipcMain } from 'electron'
import { dbManager } from './database'

/**
 * 注册所有IPC处理器
 */
export function registerWebHandles(): void {
  // 会员管理相关
  registerMemberHandles()

  // 服务项目管理相关
  registerServiceHandles()

  // 交易记录相关
  registerTransactionHandles()

  // 充值记录相关
  registerRechargeHandles()

  // 统计报表相关
  registerReportHandles()

  // 数据管理相关
  registerDataHandles()

  // 通知相关
  registerNotificationHandles()
}

/**
 * 会员管理IPC处理器
 */
function registerMemberHandles(): void {
  // 获取所有会员
  ipcMain.handle('get-members', async () => {
    try {
      const members = await dbManager.all('SELECT * FROM members ORDER BY created_at DESC')
      return { success: true, data: members }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 根据查询条件获取会员
  ipcMain.handle(
    'get-members-by-searchform',
    async (
      _,
      filters: {
        name?: string // 姓名（模糊）
        phone?: string // 手机号（模糊）
        level?: string // 会员等级（精确）
        status?: string // 状态（精确）
      }
    ) => {
      try {
        // 基础查询
        let query = 'SELECT * FROM members WHERE 1=1'
        const params: any[] = []

        // 动态添加条件
        if (filters.name) {
          query += ' AND name LIKE ?'
          params.push(`%${filters.name}%`) // 模糊匹配姓名
        }
        if (filters.phone) {
          query += ' AND phone LIKE ?'
          params.push(`%${filters.phone}%`) // 模糊匹配手机号
        }
        if (filters.level) {
          query += ' AND level = ?' // 精确匹配等级
          params.push(filters.level)
        }
        if (filters.status) {
          query += ' AND status = ?' // 精确匹配状态
          params.push(filters.status)
        }

        // 排序
        query += ' ORDER BY created_at DESC'

        // 执行查询
        const members = await dbManager.all(query, params)
        return { success: true, data: members }
      } catch (error:any) {
        return { success: false, error: (error as Error).message }
      }
    }
  )

  // 根据ID获取会员
  ipcMain.handle('get-member-by-id', async (_, id: number) => {
    try {
      const member = await dbManager.get('SELECT * FROM members WHERE id = ?', [id])
      return { success: true, data: member }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 根据手机号获取会员
  ipcMain.handle('get-member-by-phone', async (_, phone: string) => {
    try {
      const member = await dbManager.get('SELECT * FROM members WHERE phone = ?', [phone])
      return { success: true, data: member }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 添加会员
  ipcMain.handle('add-member', async (_, memberData: any) => {
    try {
      const result = await dbManager.run(
        'INSERT INTO members (name, phone, level, balance, status, remark) VALUES (?, ?, ?, ?, ?, ?)',
        [
          memberData.name,
          memberData.phone,
          memberData.level,
          memberData.balance || 0,
          memberData.status || '正常',
          memberData.remark
        ]
      )
      return { success: true, data: { id: result.id } }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 更新会员
  ipcMain.handle('update-member', async (_, memberData: any) => {
    try {
      await dbManager.run(
        'UPDATE members SET name = ?, phone = ?, level = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          memberData.name,
          memberData.phone,
          memberData.level,
          memberData.status,
          memberData.remark,
          memberData.id
        ]
      )
      return { success: true }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除会员
  ipcMain.handle('delete-member', async (_, id: number) => {
    try {
      await dbManager.run('DELETE FROM members WHERE id = ?', [id])
      return { success: true }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })
}
// 获取会员消费记录
ipcMain.handle('get-member-transactions', async (_, memberId: number) => {
  try {
    const query = `
      SELECT 
        t.*,
        s.name as service_name,
        s.price as service_price,
        m.name as member_name
      FROM 
        transactions t
      LEFT JOIN 
        services s ON t.service_id = s.id
      JOIN 
        members m ON t.member_id = m.id
      WHERE 
        t.member_id = ?
      ORDER BY 
        t.created_at DESC
    `

    const transactions = await dbManager.all(query, [memberId])
    return { success: true, data: transactions }
  } catch (error:any) {
    return { success: false, error: (error as Error).message }
  }
})

/**
 * 服务项目管理IPC处理器
 */
function registerServiceHandles(): void {
  // 获取所有服务项目
  ipcMain.handle('get-services', async () => {
    try {
      const services = await dbManager.all('SELECT * FROM services ORDER BY category, name')
      return { success: true, data: services }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })

  // 添加服务项目
  ipcMain.handle('add-service', async (_, serviceData: any) => {
    try {
      const result = await dbManager.run(
        'INSERT INTO services (name, category, price, vip_price, diamond_price, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          serviceData.name,
          serviceData.category,
          serviceData.price,
          serviceData.vip_price,
          serviceData.diamond_price,
          serviceData.status || '启用'
        ]
      )
      return { success: true, data: { id: result.id } }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })

  // 更新服务项目
  ipcMain.handle('update-service', async (_, serviceData: any) => {
    try {
      await dbManager.run(
        'UPDATE services SET name = ?, category = ?, price = ?, vip_price = ?, diamond_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          serviceData.name,
          serviceData.category,
          serviceData.price,
          serviceData.vip_price,
          serviceData.diamond_price,
          serviceData.status,
          serviceData.id
        ]
      )
      return { success: true }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })

  // 删除服务项目
  ipcMain.handle('delete-service', async (_, id: number) => {
    try {
      await dbManager.run('DELETE FROM services WHERE id = ?', [id])
      return { success: true }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * 交易记录IPC处理器
 */
function registerTransactionHandles(): void {
  // 获取交易记录
  ipcMain.handle('get-transactions', async (_, filters: any = {}) => {
    try {
      let sql = `
        SELECT t.*, m.name as member_name, m.phone as member_phone, s.name as service_name 
        FROM transactions t 
        LEFT JOIN members m ON t.member_id = m.id 
        LEFT JOIN services s ON t.service_id = s.id 
        WHERE 1=1
      `
      const params: any[] = []

      if (filters.memberId) {
        sql += ' AND t.member_id = ?'
        params.push(filters.memberId)
      }

      if (filters.startDate) {
        sql += ' AND DATE(t.created_at) >= ?'
        params.push(filters.startDate)
      }

      if (filters.endDate) {
        sql += ' AND DATE(t.created_at) <= ?'
        params.push(filters.endDate)
      }

      sql += ' ORDER BY t.created_at DESC'

      const transactions = await dbManager.all(sql, params)
      return { success: true, data: transactions }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })

  // 创建消费记录
  ipcMain.handle('create-transaction', async (_, transactionData: any) => {
    try {
      // 开始事务
      await dbManager.run('BEGIN TRANSACTION')

      // 获取会员当前余额
      const member = await dbManager.get('SELECT balance FROM members WHERE id = ?', [
        transactionData.memberId
      ])
      if (!member) {
        throw new Error('会员不存在')
      }

      const balanceBefore = member.balance
      const balanceAfter = balanceBefore - transactionData.amount

      if (balanceAfter < 0) {
        throw new Error('余额不足')
      }

      // 更新会员余额
      await dbManager.run('UPDATE members SET balance = ? WHERE id = ?', [
        balanceAfter,
        transactionData.memberId
      ])

      // 创建交易记录
      const result = await dbManager.run(
        'INSERT INTO transactions (member_id, service_id, amount, balance_before, balance_after, transaction_type, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          transactionData.memberId,
          transactionData.serviceId,
          transactionData.amount,
          balanceBefore,
          balanceAfter,
          '消费',
          transactionData.remark
        ]
      )

      // 提交事务
      await dbManager.run('COMMIT')

      return { success: true, data: { id: result.id, balanceAfter } }
    } catch (error:any) {
      // 回滚事务
      await dbManager.run('ROLLBACK')
      return { success: false, error: error.message }
    }
  })
}

/**
 * 充值记录IPC处理器
 */
function registerRechargeHandles(): void {
  // 获取充值记录
  ipcMain.handle('get-recharges', async (_, filters: any = {}) => {
    try {
      let sql = `
        SELECT r.*, m.name as member_name, m.phone as member_phone 
        FROM recharges r 
        LEFT JOIN members m ON r.member_id = m.id 
        WHERE 1=1
      `
      const params: any[] = []

      if (filters.memberId) {
        sql += ' AND r.member_id = ?'
        params.push(filters.memberId)
      }

      sql += ' ORDER BY r.created_at DESC'

      const recharges = await dbManager.all(sql, params)
      return { success: true, data: recharges }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })

  // 创建充值记录
  ipcMain.handle('create-recharge', async (_, rechargeData: any) => {
    try {
      // 开始事务
      await dbManager.run('BEGIN TRANSACTION')

      // 获取会员当前余额
      const member = await dbManager.get('SELECT balance FROM members WHERE id = ?', [
        rechargeData.memberId
      ])
      if (!member) {
        throw new Error('会员不存在')
      }

      const balanceBefore = member.balance
      const balanceAfter = balanceBefore + rechargeData.amount

      // 更新会员余额
      await dbManager.run('UPDATE members SET balance = ? WHERE id = ?', [
        balanceAfter,
        rechargeData.memberId
      ])

      // 创建充值记录
      const result = await dbManager.run(
        'INSERT INTO recharges (member_id, amount, payment_method, operator, remark) VALUES (?, ?, ?, ?, ?)',
        [
          rechargeData.memberId,
          rechargeData.amount,
          rechargeData.paymentMethod,
          rechargeData.operator,
          rechargeData.remark
        ]
      )

      // 创建余额变动记录
      await dbManager.run(
        'INSERT INTO transactions (member_id, service_id, amount, balance_before, balance_after, transaction_type, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          rechargeData.memberId,
          0,
          rechargeData.amount,
          balanceBefore,
          balanceAfter,
          '充值',
          rechargeData.remark
        ]
      )

      // 提交事务
      await dbManager.run('COMMIT')

      return { success: true, data: { id: result.id, balanceAfter } }
    } catch (error:any) {
      // 回滚事务
      await dbManager.run('ROLLBACK')
      return { success: false, error: error.message }
    }
  })
}

/**
 * 统计报表IPC处理器
 */
function registerReportHandles(): void {
  // 获取统计数据
  ipcMain.handle('get-statistics', async (_, dateRange: any = {}) => {
    try {
      // 会员统计
      const memberStats = await dbManager.get(`
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN status = '正常' THEN 1 END) as active_members,
          SUM(balance) as total_balance
        FROM members
      `)

      // 消费统计
      let consumptionWhereClause = 'WHERE transaction_type = "消费"'
      const consumptionParams: any[] = []

      if (dateRange.startDate) {
        consumptionWhereClause += ' AND DATE(created_at) >= ?'
        consumptionParams.push(dateRange.startDate)
      }

      if (dateRange.endDate) {
        consumptionWhereClause += ' AND DATE(created_at) <= ?'
        consumptionParams.push(dateRange.endDate)
      }

      const consumptionStats = await dbManager.get(
        `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(amount) as total_consumption
        FROM transactions 
        ${consumptionWhereClause}
      `,
        consumptionParams
      )

      // 充值统计
      let rechargeWhereClause = 'WHERE 1=1'
      const rechargeParams: any[] = []

      if (dateRange.startDate) {
        rechargeWhereClause += ' AND DATE(created_at) >= ?'
        rechargeParams.push(dateRange.startDate)
      }

      if (dateRange.endDate) {
        rechargeWhereClause += ' AND DATE(created_at) <= ?'
        rechargeParams.push(dateRange.endDate)
      }

      const rechargeStats = await dbManager.get(
        `
        SELECT 
          COUNT(*) as total_recharges,
          SUM(amount) as total_recharge_amount
        FROM recharges 
        ${rechargeWhereClause}
      `,
        rechargeParams
      )

      // 服务项目统计
      let serviceWhereClause = 'WHERE t.transaction_type = "消费"'
      const serviceParams: any[] = []

      if (dateRange.startDate) {
        serviceWhereClause += ' AND DATE(t.created_at) >= ?'
        serviceParams.push(dateRange.startDate)
      }

      if (dateRange.endDate) {
        serviceWhereClause += ' AND DATE(t.created_at) <= ?'
        serviceParams.push(dateRange.endDate)
      }

      const serviceStats = await dbManager.all(
        `
        SELECT 
          s.name,
          COUNT(t.id) as usage_count,
          SUM(t.amount) as total_amount
        FROM services s
        LEFT JOIN transactions t ON s.id = t.service_id 
        ${serviceWhereClause}
        GROUP BY s.id, s.name
        ORDER BY usage_count DESC
      `,
        serviceParams
      )

      return {
        success: true,
        data: {
          memberStats,
          consumptionStats,
          rechargeStats,
          serviceStats
        }
      }
    } catch (error:any) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * 数据管理IPC处理器
 */
function registerDataHandles(): void {
  // 数据备份
  ipcMain.handle('backup-database', async () => {
    try {
      const fs = require('fs')
      const path = require('path')
      const { app } = require('electron')

      // 获取数据库文件路径
      const userDataPath = app.getPath('userData')
      const dbPath = path.join(userDataPath, 'barbershop.db')

      // 创建备份目录
      const backupDir = path.join(userDataPath, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      // 生成备份文件名（包含时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFileName = `barbershop_backup_${timestamp}.db`
      const backupPath = path.join(backupDir, backupFileName)

      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath)

      return {
        success: true,
        data: {
          backupPath,
          backupFileName,
          fileSize: fs.statSync(backupPath).size
        }
      }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取备份文件列表
  ipcMain.handle('get-backup-files', async () => {
    try {
      const fs = require('fs')
      const path = require('path')
      const { app } = require('electron')

      const userDataPath = app.getPath('userData')
      const backupDir = path.join(userDataPath, 'backups')

      if (!fs.existsSync(backupDir)) {
        return { success: true, data: [] }
      }

      const files = fs
        .readdirSync(backupDir)
        .filter((file) => file.endsWith('.db'))
        .map((file) => {
          const filePath = path.join(backupDir, file)
          const stats = fs.statSync(filePath)
          return {
            fileName: file,
            filePath: filePath,
            fileSize: stats.size,
            createTime: stats.birthtime,
            modifyTime: stats.mtime
          }
        })
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())

      return { success: true, data: files }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 数据恢复
  ipcMain.handle('restore-database', async (_, backupFilePath: string) => {
    try {
      const fs = require('fs')
      const path = require('path')
      const { app } = require('electron')

      // 验证备份文件是否存在
      if (!fs.existsSync(backupFilePath)) {
        throw new Error('备份文件不存在')
      }

      // 获取当前数据库路径
      const userDataPath = app.getPath('userData')
      const dbPath = path.join(userDataPath, 'barbershop.db')

      // 创建当前数据库的备份（以防恢复失败）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const currentBackupPath = path.join(userDataPath, `barbershop_before_restore_${timestamp}.db`)

      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, currentBackupPath)
      }

      // 关闭当前数据库连接
      if (dbManager) {
        dbManager.close()
      }

      // 复制备份文件到数据库位置
      fs.copyFileSync(backupFilePath, dbPath)

      // 重新初始化数据库连接
      await dbManager.initialize()

      return {
        success: true,
        data: {
          message: '数据恢复成功',
          currentBackupPath
        }
      }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除备份文件
  ipcMain.handle('delete-backup', async (_, backupFilePath: string) => {
    try {
      const fs = require('fs')

      if (!fs.existsSync(backupFilePath)) {
        throw new Error('备份文件不存在')
      }

      fs.unlinkSync(backupFilePath)

      return { success: true, data: { message: '备份文件删除成功' } }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })
}

/**
 * 通知相关IPC处理器
 */
function registerNotificationHandles(): void {
  // 显示通知
  ipcMain.handle('show-notification', async (_, options: any) => {
    try {
      const { Notification } = require('electron')

      if (Notification.isSupported()) {
        const notification = new Notification({
          title: options.title || '理发店管理系统',
          body: options.message,
          icon: options.icon || undefined,
          silent: options.silent || false
        })

        notification.show()

        // 设置自动关闭
        if (options.duration !== 0) {
          setTimeout(() => {
            notification.close()
          }, options.duration || 3000)
        }

        return { success: true }
      } else {
        return { success: false, error: '系统不支持通知' }
      }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 显示自定义提示
  ipcMain.handle('show-toast', async (_, options: any) => {
    try {
      // 这里可以创建一个自定义的BrowserWindow作为toast
      const { BrowserWindow } = require('electron')

      const toastWindow = new BrowserWindow({
        width: 300,
        height: 60,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      // 设置窗口位置（右上角）
      const { screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width } = primaryDisplay.workAreaSize

      toastWindow.setPosition(width - 320, 100)

      // 加载toast内容
      toastWindow.loadURL(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 12px 16px;
              background: ${
                options.type === 'error'
                  ? '#ff4d4f'
                  : options.type === 'warning'
                    ? '#faad14'
                    : options.type === 'success'
                      ? '#52c41a'
                      : '#1890ff'
              };
              color: white;
              border-radius: 6px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              user-select: none;
            }
          </style>
        </head>
        <body>
          ${options.message}
        </body>
        </html>
      `)

      // 自动关闭
      setTimeout(() => {
        toastWindow.close()
      }, options.duration || 3000)

      return { success: true }
    } catch (error:any) {
      return { success: false, error: (error as Error).message }
    }
  })
}
