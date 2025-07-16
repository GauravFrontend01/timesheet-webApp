import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  extractGitCommits: (since, until, projects, author) =>
    electronAPI.ipcRenderer.invoke('extract-git-commits', { since, until, projects, author }),
  fetchAISummaries: (payload) => electronAPI.ipcRenderer.invoke('fetch-ai-summaries', payload)
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(error)
}
