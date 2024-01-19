const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const util = require('util');
const readdir = util.promisify(fs.readdir);

const baseFileLocation = './src/baseFiles';
const stored = './src/baseFiles/stored.txt';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  setupPrerequisites();

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
async function setupPrerequisites() {
  try {
    await fs.ensureDir(baseFileLocation);
    try {
      await fs.readFile(stored, 'utf-8');
      console.log('File already exists.');
    } catch (err) {
      await fs.writeFile(stored, '', 'utf-8');
      console.log('File created successfully.');
    }
  } catch (err) {
    console.error('Error ensuring directory:', err);
  }
}

ipcMain.handle('open-directory-dialog', async () => {
  let isSaveSuccessful = false;

  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      title: 'Select files and/or folders',
    });

    const selectedPaths = result.filePaths;

    if (selectedPaths.length > 0) {
      isSaveSuccessful = await saveSelected(selectedPaths);
    }

    return isSaveSuccessful;
  } catch (err) {
    console.error('Error opening directory dialog:', err);
    return isSaveSuccessful;
  }
});

async function saveSelected(paths){
  const alreadySavedContent = await fs.promises.readFile(stored, 'utf-8');
  const savedLines = alreadySavedContent.split('\n').filter((line) => line.trim() !== '');

  let saveFailed = false;

  paths.forEach(path => {
    if (!savedLines.includes(path)){
      savedLines.push(path);
    } else {
      saveFailed = true;
    }
  });

  const newContent = savedLines.join('\n');
  fs.writeFileSync(stored, newContent + '\n', 'utf-8');

  if (saveFailed){
    return 'Failed'; //presumed that a fail is only the result of the file or folder already existing 
  }
}

ipcMain.handle('get-content', async () => {
  const alreadySavedContent = await fs.promises.readFile(stored, 'utf-8');
  const savedLines = alreadySavedContent.split('\n').filter((line) => line.trim() !== '');
  return savedLines;
});

ipcMain.handle('get-current-folder-contents', async (event, data) => {
  if (!data || !data.folderLocation) return;

  const folderLocation = data.folderLocation;

  try {
    const files = await readdir(folderLocation);
    const returnContent = [];

    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (fileExt === '') {
        if (fs.statSync(path.join(folderLocation, file)).isDirectory()) {
          const folderDirectory = path.join(folderLocation, file);
          returnContent.push(folderDirectory);
        }
      } else {
        const fileDirectory = path.join(folderLocation, file);
        returnContent.push(fileDirectory);
      }
    }
    return returnContent;
  } catch (err) {
    console.error('Error reading folder contents:', err);
    return [];
  }
});

ipcMain.handle('is-file-or-directory', (req, data) => {
  if (!data || !data.path) return;
  try {
    const stats = fs.statSync(data.path);
    return stats.isFile() ? 'File' : stats.isDirectory() ? 'Directory' : 'Unknown';
  } catch (error) {
    // File doesn't exist
    return 'Error';
  }
});

ipcMain.handle('drop-save-handler', async (req, data) => {
  if (!data || !data.paths) return;
  const result = await saveSelected(data.paths);
  if (result === 'Failed'){
    // A file being saved already exists
    return 'Failed';
  } else {
    return 'Success';
  }
});

ipcMain.handle('open-file-browser', (event, data) => {
  if (!data || !data.path) return;
  const isAbsolute = path.isAbsolute(data.path);
  const absolutePath = isAbsolute ? path.dirname(data.path) : constructAbsolutePath(data.path);
  shell.openPath(absolutePath);
});

function constructAbsolutePath(relativePath) {
  const baseDirectory = path.join(app.getAppPath()); // Go up one level from the app directory
  const parentDirectory = path.dirname(relativePath);
  return path.join(baseDirectory, parentDirectory);
}

ipcMain.handle('remove-from-stored', async (req, data) => {
  if (!data || !data.path) return;
  await removeFromStoredFile(data.path);
});

async function removeFromStoredFile(path){
  const storedContent = await fsPromises.readFile(stored, 'utf-8');
  const savedLines = storedContent.split('\n').filter((line) => line.trim() !== '');

  if (savedLines.includes(path)) {
    const updatedLines = savedLines.filter((line) => line !== path);
    const updatedContent = updatedLines.join('\n');
    await fsPromises.writeFile(stored, updatedContent);
  } else {
    return;
  }
}
