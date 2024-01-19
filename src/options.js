const optionsOverlay_el = document.getElementById('optionsOverlay');
const optionsClose_el = document.getElementById('optionsClose');
const backupDirectoryText_el = document.getElementById('backupDirectoryText');
const selectBackupDirectory_el = document.getElementById('selectBackupDirectory');
const backupSettingsButton_el = document.getElementById('backupSettingsButton');

backupSettingsButton_el.addEventListener('click', () => {
    toggleOptions();
});

optionsClose_el.addEventListener('click', () => {
    toggleOptions();
});

function toggleOptions(){
    if (optionsOverlay_el.style.display === 'flex'){
        optionsOverlay_el.style.display = 'none';
    } else {
        optionsOverlay_el.style.display = 'flex';
    }
}