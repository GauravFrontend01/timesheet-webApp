import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { execSync } from 'child_process'
import * as path from 'path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('extract-git-commits', async (event, { since, until }) => {
    const projects = ['D:/sapper-unified-ui-react', 'D:/apaas-3-ui']
    const author = 'gaurav.sharma@sapper.ai'
    let allCommits: { date: string; message: string; project: string }[] = []
    function parseLine(line: string) {
      const [date, ...rest] = line.split(' | ')
      return { date, message: rest.join(' | ') }
    }
    for (const projectPath of projects) {
      const cmd = `git log --all --since="${since}" --until="${until}" --pretty=format:"%ad | %s" --date=short --author="${author}"`
      try {
        const output = execSync(cmd, { cwd: projectPath, encoding: 'utf8' })
        const lines = output.split('\n').filter(Boolean)
        allCommits = allCommits.concat(
          lines.map((line) => ({ project: path.basename(projectPath), ...parseLine(line) }))
        )
      } catch (e) {
        // Ignore errors for missing repos, etc.
      }
    }
    // Group by date
    const grouped: Record<string, string[]> = {}
    allCommits.forEach(({ date, message, project }) => {
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(`[${project}] ${message}`)
    })
    // Prepare table rows
    const tableRows = Object.keys(grouped)
      .sort()
      .map((date) => {
        const summary = grouped[date].join('; ')
        return {
          date,
          task: 'Development Work',
          summary,
          hours: 8,
          extra1: '',
          extra2: ''
        }
      })
    // Prepare raw output
    const raw = allCommits.map((c) => `${c.date} | [${c.project}] ${c.message}`).join('\n')
    return { raw, tableRows }
  })

  createWindow()

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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
