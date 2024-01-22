const optionsOverlay_el = document.getElementById('optionsOverlay');
const optionsClose_el = document.getElementById('optionsClose');
const backupDirectoryText_el = document.getElementById('backupDirectoryText');
const selectBackupDirectory_el = document.getElementById('selectBackupDirectory');
const backupSettingsButton_el = document.getElementById('backupSettingsButton');
const compressionLevelSelect_el = document.getElementById('compressionLevelSelect');

const backupFrequencySelect_el = document.getElementById('backupFrequencySelect');
const backupRetentionInput_el = document.getElementById('backupRetentionInput');
const saveOptionsButton_el = document.getElementById('saveOptionsButton');

let options;

document.addEventListener('DOMContentLoaded', async () => {
    options = await api.getOptions();
    if (options.fileDirectory === ''){
        toggleOptions();
    }
});

async function populateSettings(){
    if (options.fileDirectory === ''){
        backupDirectoryText_el.textContent = 'No backup location selected';
    } else {
        backupDirectoryText_el.textContent = options.fileDirectory;
    }
    backupFrequencySelect_el.value = options.backupFrequency;
    backupRetentionInput_el.value = options.backupLimit;
    compressionLevelSelect_el.value = options.compression;
}

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
        populateSettings();
    }
}

selectBackupDirectory_el.addEventListener('click', async () => {
    backupDirectory = await api.selectBackupDirectory();
    if (backupDirectory !== null){
        backupDirectoryText_el.textContent = backupDirectory;
    }
});

saveOptionsButton_el.addEventListener('click', async () => {
    if (backupDirectory === ''){
        backupDirectoryText_el.classList.add('error');
        setTimeout(() => {
            backupDirectoryText_el.classList.remove('error');
        }, 2000);
        return;
    }
    const frequency = backupFrequencySelect_el.value;
    const limit = backupRetentionInput_el.value;
    const compression = compressionLevelSelect_el.value;
    const saveResult = await api.updateOptions({directory: backupDirectory, frequency, limit, compression});
    if (saveResult.success){
        options = saveResult.options;
        toggleOptions();
    } else {
        console.log('error');
    }
});