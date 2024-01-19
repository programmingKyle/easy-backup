const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    isFileOrDirectory: (data) => ipcRenderer.invoke('is-file-or-directory', data),

    openFileDialog: (data) => ipcRenderer.invoke('open-file-dialog', data),
    openDirectoryDialog: (data) => ipcRenderer.invoke('open-directory-dialog', data),

    getContent: () => ipcRenderer.invoke('get-content'),

    getCurrentFolderContents: (data) => ipcRenderer.invoke('get-current-folder-contents', data),

    textFileHandler: (data) => ipcRenderer.invoke('text-file-handler', data),

    dropSaveHandler: (data) => ipcRenderer.invoke('drop-save-handler', data),

    openFileBrowser: (data) => ipcRenderer.invoke('open-file-browser', data),
    findFileBrowser: (data) => ipcRenderer.invoke('find-file-browser', data),
    
    removeFromStored: (data) => ipcRenderer.invoke('remove-from-stored', data),
});