import sqlite3 from 'sqlite3'
import path from 'path'
import { app } from 'electron'

/**
 * 数据库管理类
 * 负责数据库的初始化、连接管理和基本操作
 */
export class DatabaseManager {
  private db: sqlite3.Database | null = null
  private dbPath: string

  constructor() {
    // 数据库文件路径
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'barbershop.db')
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err)
          reject(err)
          return
        }
        console.log('数据库连接成功')
        this.createTables()
          .then(() => resolve())
          .catch(reject)
      })
    })
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const tables = [
      // 会员表
      `CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        level TEXT DEFAULT '普通会员',
        balance DECIMAL(10,2) DEFAULT 0.00,
        register_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT '正常',
        avatar TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 服务项目表
      `CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        vip_price DECIMAL(10,2),
        diamond_price DECIMAL(10,2),
        status TEXT DEFAULT '启用',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 消费记录表
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        balance_before DECIMAL(10,2) NOT NULL,
        balance_after DECIMAL(10,2) NOT NULL,
        transaction_type TEXT NOT NULL,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      )`,

      // 充值记录表
      `CREATE TABLE IF NOT EXISTS recharges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method TEXT DEFAULT '现金',
        operator TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id)
      )`
    ]

    for (const table of tables) {
      await this.run(table)
    }

    // 插入默认服务项目
    await this.insertDefaultServices()
  }

  /**
   * 插入默认服务项目
   */
  private async insertDefaultServices(): Promise<void> {
    const defaultServices = [
      { name: '剪发', category: '剪发', price: 30.00, vip_price: 25.00, diamond_price: 20.00 },
      { name: '染发', category: '染发', price: 150.00, vip_price: 130.00, diamond_price: 110.00 },
      { name: '烫发', category: '烫发', price: 200.00, vip_price: 180.00, diamond_price: 160.00 },
      { name: '护理', category: '护理', price: 80.00, vip_price: 70.00, diamond_price: 60.00 },
      { name: '造型', category: '造型', price: 50.00, vip_price: 45.00, diamond_price: 40.00 }
    ]

    // 检查是否已有默认服务项目
    const existingServices = await this.all('SELECT name FROM services WHERE name IN (?, ?, ?, ?, ?)', 
      defaultServices.map(s => s.name))
    
    const existingNames = existingServices.map(s => s.name)
    const newServices = defaultServices.filter(s => !existingNames.includes(s.name))

    if (newServices.length > 0) {
      console.log(`插入 ${newServices.length} 个新的默认服务项目`)
      for (const service of newServices) {
        await this.run(
          'INSERT INTO services (name, category, price, vip_price, diamond_price) VALUES (?, ?, ?, ?, ?)',
          [service.name, service.category, service.price, service.vip_price, service.diamond_price]
        )
      }
    } else {
      console.log('所有默认服务项目已存在，跳过插入')
    }
  }

  /**
   * 执行SQL语句
   */
  async run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL执行错误:', err)
          reject(err)
          return
        }
        resolve({ id: this.lastID, changes: this.changes })
      })
    })
  }

  /**
   * 查询单条记录
   */
  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('SQL查询错误:', err)
          reject(err)
          return
        }
        resolve(row)
      })
    })
  }

  /**
   * 查询多条记录
   */
  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'))
        return
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL查询错误:', err)
          reject(err)
          return
        }
        resolve(rows)
      })
    })
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err)
        } else {
          console.log('数据库连接已关闭')
        }
      })
    }
  }
}

// 创建全局数据库实例
export const dbManager = new DatabaseManager() 