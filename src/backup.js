const manualBackupButton_el = document.getElementById('manualBackupButton');

manualBackupButton_el.addEventListener('click', async () => {
    const backupContent = await api.getContent();
    const backupDirectory = options.fileDirectory;
    const backupResult = await api.manualBackup({backupDirectory, backupContent});
    console.log(backupResult);
});