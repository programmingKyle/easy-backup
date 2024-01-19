const manualBackupButton_el = document.getElementById('manualBackupButton');
const backupProgressDiv_el = document.getElementById('backupProgressDiv');
const backupProgressBar_el = document.getElementById('backupProgressBar');
const backupControlsDiv_el = document.getElementById('backupControlsDiv');

manualBackupButton_el.addEventListener('click', async () => {
    backupControlsDiv_el.style.display = 'none';
    backupProgressDiv_el.style.display = 'grid';
    const backupContent = await api.getContent();
    const backupDirectory = options.fileDirectory;
    await api.manualBackup({backupDirectory, backupContent});
    backupControlsDiv_el.style.display = 'grid';
    backupProgressDiv_el.style.display = 'none';
});

api.onBackupProgress((percent) => {
    backupProgressBar_el.style.width = `${percent}%`;
});