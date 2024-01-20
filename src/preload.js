const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    isFileOrDirectory: (data) => ipcRenderer.invoke('is-file-or-directory', data),
    openFileDialog: (data) => ipcRenderer.invoke('open-file-dialog', data),
    openDirectoryDialog: (data) => ipcRenderer.invoke('open-directory-dialog', data),
    getContent: () => ipcRenderer.invoke('get-content'),
    getCurrentFolderContents: (data) => ipcRenderer.invoke('get-current-folder-contents', data),
    dropSaveHandler: (data) => ipcRenderer.invoke('drop-save-handler', data),
    openFileBrowser: (data) => ipcRenderer.invoke('open-file-browser', data),
    findFileBrowser: (data) => ipcRenderer.invoke('find-file-browser', data),
    removeFromStored: (data) => ipcRenderer.invoke('remove-from-stored', data),

    getOptions: () => ipcRenderer.invoke('get-options'),
    selectBackupDirectory: () => ipcRenderer.invoke('select-backup-directory'),
    updateOptions: (data) => ipcRenderer.invoke('update-options', data),

    // Backup
    fullBackup: (data) => ipcRenderer.invoke('full-backup', data),

    onBackupProgress: (callback) => {
        ipcRenderer.on('backup-progress', (_, percent) => {
          callback(percent);
        });
    },
});