const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const util = require('util');
const readdir = util.promisify(fs.readdir);
const archiver = require('archiver');

const baseFileLocation = './src/baseFiles';
const stored = './src/baseFiles/stored.txt';
const optionsFilePath = './src/baseFiles/options.json';

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
async function getBackupDirectories() {
  const alreadySavedContent = await fs.promises.readFile(stored, 'utf-8');
  const savedLines = alreadySavedContent.split('\n').filter((line) => line.trim() !== '');
  return savedLines;
};

// Backup Functionality
ipcMain.handle('full-backup', async (event, data) => {
  if (!data || !data.backupDirectory || !data.backupLimit || !data.compression) return;
  if (parseInt(data.backupLimit) !== 0){
    const isWithinLimit = await checkBackupLimit(data.backupDirectory, data.backupLimit);
    if (!isWithinLimit) {
      await deleteOldestBackup(data.backupDirectory);
    }  
  }
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    const timestamp = `${year}_${month}_${day}`;
    let index = await findHighestIndex(data.backupDirectory) + 1; // Start from the next index

    let compressedFilePath = path.join(data.backupDirectory, `backup_${timestamp}(${index}).zip`);

    // Check if the file already exists
    while (await fileExists(compressedFilePath)) {
      index++;
      compressedFilePath = path.join(data.backupDirectory, `backup_${timestamp}(${index}).zip`);
    }

    const archive = archiver('zip', { zlib: { level: parseInt(data.compression) } });
    const output = fs.createWriteStream(compressedFilePath);

    // Call the progressBar function
    await progressBar(archive, output, event, data, compressedFilePath);

    archive.pipe(output);

    const backupContent = await getBackupDirectories();

    for (const directory of backupContent) {
      const fullDirectoryPath = path.resolve(directory.trim());
      archive.directory(fullDirectoryPath, path.basename(fullDirectoryPath));
    }

    await archive.finalize();

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
});

// Function to find the highest index in the backup directory
async function findHighestIndex(directory) {
  const files = await fs.promises.readdir(directory);
  const backupFiles = files.filter((file) => /^backup_\d{4}_\d{2}_\d{2}\((\d+)\)\.zip$/.test(file));
  const indices = backupFiles.map((file) => parseInt(file.match(/\((\d+)\)\.zip$/)[1], 10));
  return indices.length > 0 ? Math.max(...indices) : 0;
}

async function deleteOldestBackup(directory) {
  try {
    const files = await fs.readdir(directory);
    const backupFiles = files.filter((file) => /^backup_\d{4}_\d{2}_\d{2}(\(\d{1,}\))?\.zip$/.test(file));
    const fileStats = await Promise.all(
      backupFiles.map(async (file) => {
        const stat = await fs.stat(path.join(directory, file));
        return { file, createdAt: stat.birthtime };
      })
    );
    fileStats.sort((a, b) => a.createdAt - b.createdAt);
    const oldestBackupPath = path.join(directory, fileStats[0].file);
    await fs.unlink(oldestBackupPath);
    return true;
  } catch (error) {
    console.error('Error deleting oldest backup:', error);
    return false;
  }
}

async function checkBackupLimit(directory, backupLimit) {
  try {
    const files = await fs.readdir(directory);
    const backupFiles = files.filter((file) => /^backup_\d{4}_\d{2}_\d{2}(\(\d{1,}\))?\.zip$/.test(file));
    if (backupFiles.length >= parseInt(backupLimit, 10)) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking backup limit:', error);
    return false;
  }
}

async function progressBar(archive, output, event, data, compressedFilePath) {
  let totalSize = 0;

  const backupContent = await getBackupDirectories();

  // Calculate total size of files
  for (const directory of backupContent) {
    const files = await getAllFiles(directory.trim());
    for (const file of files) {
      const stats = await fsPromises.stat(file);
      totalSize += stats.size;
    }
  }

  // Set up event listeners for archiver
  output.on('close', () => {
    event.sender.send('backup-progress', 0);
  });

  archive.on('error', (err) => {
    throw err;
  });

  let processedBytes = 0;

  archive.on('progress', (progress) => {
    processedBytes = progress.fs.processedBytes;
    const percent = Math.round((processedBytes / totalSize) * 100);
    // Send the progress information to the renderer process
    event.sender.send('backup-progress', percent);
  });
}

async function getAllFiles(dir) {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getAllFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}











ipcMain.handle('select-backup-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Backup Directory',
    });

    const selectedPath = result.filePaths[0];

    return selectedPath || null;
  } catch (err) {
    console.error('Error opening directory dialog:', err);
    return null;
  }
});

ipcMain.handle('update-options', async (event, data) => {
  if (!data) return { success: false, options: null };

  try {
    // Read existing options from the file
    const existingOptionsContent = await fs.readFile(optionsFilePath, 'utf-8');
    const existingOptions = JSON.parse(existingOptionsContent);

    // Update relevant fields with the new data
    existingOptions.fileDirectory = data.directory || existingOptions.fileDirectory;
    existingOptions.backupFrequency = data.frequency || existingOptions.backupFrequency;
    existingOptions.backupLimit = data.limit || existingOptions.backupLimit;
    existingOptions.compression = data.compression || existingOptions.compression;

    // Write the updated options back to the file
    await fs.writeFile(optionsFilePath, JSON.stringify(existingOptions, null, 2), 'utf-8');

    return { success: true, options: existingOptions };
  } catch (err) {
    console.error('Error updating options:', err);
    return { success: false, options: null };
  }
});

ipcMain.handle('get-options', async () => {
  try {
    // Check if options file exists
    await fs.access(optionsFilePath);

    // If the file exists, read and return its content
    const optionsContent = await fs.readFile(optionsFilePath, 'utf-8');
    const options = JSON.parse(optionsContent);
    return options;
  } catch (err) {
    const defaultOptions = {
      fileDirectory: '',
      backupFrequency: 'off',
      backupLimit: 20,
      compression: 5,
    };
    await fs.writeFile(optionsFilePath, JSON.stringify(defaultOptions, null, 2), 'utf-8');
    return defaultOptions;
  }
});







async function setupPrerequisites() {
  try {
    await fs.ensureDir(baseFileLocation);
    try {
      await fs.readFile(stored, 'utf-8');
    } catch (err) {
      await fs.writeFile(stored, '', 'utf-8');
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
  shell.openPath(data.path);
});

ipcMain.handle('find-file-browser', (req, data) => {
  if (!data || !data.path) return;
  const splitPath = data.path.split(path.sep);
  splitPath.pop();
  const updatedPath = path.join(...splitPath);
  shell.openPath(updatedPath);
});

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
