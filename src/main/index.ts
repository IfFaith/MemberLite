import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset' // 不再使用此行
import { registerWebHandles } from './handles'
import { dbManager } from './database'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 825,
    minHeight: 500,
    minWidth: 500,
    show: false,
    frame: true,
    autoHideMenuBar: true,
    title: '貔貅会员消费管理系统',
    icon: join(__dirname, '../../resources/lixp.jpg'), // 统一设置icon
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.maximize()
  // mainWindow.webContents.openDevTools() // 自动打开控制台
  
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  
  registerWebHandles()

  // 1. 先加载loading页面
  const loadingPath = join(__dirname, '../renderer/loading.html')
  mainWindow.loadFile(loadingPath)

  // 2. 延迟加载主页面，避免白屏
  setTimeout(() => {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      console.log('Loading development URL:', process.env['ELECTRON_RENDERER_URL'])
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      const rendererPath = join(__dirname, '../renderer/index.html')
      console.log('Loading production file:', rendererPath)
      mainWindow.loadFile(rendererPath)
    }
  }, 800) // 800ms后加载主页面
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 初始化数据库
  try {
    await dbManager.initialize()
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出时关闭数据库连接
app.on('before-quit', () => {
  dbManager.close()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

