// Remove Variables
const removeOverlay_el = document.getElementById('removeOverlay');
const confirmRemoveButton_el = document.getElementById('confirmRemoveButton');
const cancelRemoveButton_el = document.getElementById('cancelRemoveButton');

async function repopulateContent(){
    if (directoryLocation.length === 0){
        const data = await api.getContent();
        await populateFolderContent(data);
    } else {
        const result = await api.getCurrentFolderContents({folderLocation: currentDirectoryLocation});
        await populateFolderContent(result);
    }
}

function fileManagerRemove(path){
    confirmRemoveButton_el.addEventListener('click', async () => {
        removeOverlay_el.style.display = 'none';
        await api.removeFromStored({path});
        await repopulateContent();
    });

    cancelRemoveButton_el.addEventListener('click', async () => {
        removeOverlay_el.style.display = 'none';
    });

}