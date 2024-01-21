const fullBackupButton_el = document.getElementById('fullBackupButton');
const backupProgressDiv_el = document.getElementById('backupProgressDiv');
const backupProgressBar_el = document.getElementById('backupProgressBar');
const backupControlsDiv_el = document.getElementById('backupControlsDiv');
const openBackupButton_el = document.getElementById('openBackupButton');

let backupDirectory;
let backupLimit;
let compression;

fullBackupButton_el.addEventListener('click', async () => {
    backupControlsDiv_el.style.display = 'none';
    backupProgressDiv_el.style.display = 'grid';
    await api.fullBackup({backupDirectory, backupLimit, compression});
    backupControlsDiv_el.style.display = 'grid';
    backupProgressDiv_el.style.display = 'none';
});

api.onBackupProgress((percent) => {
    backupProgressBar_el.style.width = `${percent}%`;
});

document.addEventListener('DOMContentLoaded', async () => {
    const options = await api.getOptions();
    backupDirectory = options.fileDirectory;
    backupLimit = options.backupLimit;
    compression = options.compression;
});

openBackupButton_el.addEventListener('click', async () => {
    await api.openBackupFolder();
});