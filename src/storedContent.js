const contentContainer_el = document.getElementById('contentContainer');
const locationHeader_el = document.getElementById('locationHeader');
const searchForContentDiv_el = document.getElementById('searchForContentDiv');
const refreshButton_el = document.getElementById('refreshButton');
//const acceptedExtensions = ['.txt', '.py', '.js', '.html', '.css', '.json', '.xml', '.md'];

const addLocationButton_el = document.getElementById('addLocationButton');

const directoryLocation = [];
let currentDirectoryLocation = '';
let storedContent;

document.addEventListener('DOMContentLoaded', async () => {
    if (directoryLocation.length >= 1) {
        const result = await api.getCurrentFolderContents({ folderLocation: currentDirectoryLocation });
        await populateFolderContent(result);
    } else {
        const data = await api.getContent();
        await populateFolderContent(data);
    }
});

addLocationButton_el.addEventListener('click', async () => {
    const hasFailed = await api.openDirectoryDialog();
    if (!hasFailed){
        const data = await api.getAllContent();
        await populateFolderContent(data);
    } else {
        contentContainer_el.classList.add('error');
        setTimeout(() => {
            contentContainer_el.classList.remove('error');
        }, 2000);
        console.log('Error adding file!');
    }
});


refreshButton_el.addEventListener('click', async () => {
    if (directoryLocation.length >= 1) {
        const result = await api.getCurrentFolderContents({ folderLocation: currentDirectoryLocation });
        await populateFolderContent(result);
    } else {
        const data = await api.getContent();
        await populateFolderContent(data);
    }
});

contentContainer_el.addEventListener('contextmenu', async (event) => {
    rightClickItem = 'Background';
    rightClickMenu(event);
})

async function populateFolderContent(contents){
    storedContent = await api.getContent();
    if (contentContainer_el.innerHTML !== ''){
        contentContainer_el.innerHTML = '';
    }
    if (directoryLocation.length > 0){
        searchForContentDiv_el.style.display = 'none';
        populateBackButtonFolder();
    } else {
        searchForContentDiv_el.style.display = 'flex';
        currentDirectoryLocation = '';
    }
    for (const content of contents){
        const filePathArray = content.split('\\');
        const fileName = filePathArray[filePathArray.length -1];

        const icon = isFileOrFolder(fileName);

        const itemContainer_el = document.createElement('div');
        itemContainer_el.classList = 'button-container';
    
        const itemIcon_el = document.createElement('i');
        itemIcon_el.classList = `${icon} content-item`;
   
        const itemHeader_el = document.createElement('h6');
        itemHeader_el.classList = 'file-content-header';
        itemHeader_el.textContent = fileName;
    
    
        itemContainer_el.append(itemIcon_el);
        itemContainer_el.append(itemHeader_el);
    
        contentContainer_el.append(itemContainer_el);

        await contentItemClick(itemContainer_el, content, fileName);
    }
}

async function contentItemClick(itemContainer, path, locationName) {
    const result = await api.isFileOrDirectory({ path: path });

    itemContainer.addEventListener('click', async () => {
        if (result === 'Directory') {
            folderClick(path, locationName);
        } else {
            return;
        }
    });

    itemContainer.addEventListener('contextmenu', async (event) => {
        rightClickItem = result;
        rightClickMenu(event, path);
        event.stopPropagation();
    })
}


async function folderClick(path, locationName){
    directoryLocation.push(locationName);
    currentDirectoryLocation = path;
    locationHeader_el.textContent = locationName;
    const result = await api.getCurrentFolderContents({folderLocation: path});
    await populateFolderContent(result);
}






function populateBackButtonFolder(){
    const itemContainer_el = document.createElement('div');
    itemContainer_el.classList = 'button-container';

    const itemIcon_el = document.createElement('i');
    itemIcon_el.classList = 'fas fa-arrow-left content-item';

    const itemHeader_el = document.createElement('h6');
    itemHeader_el.classList = 'file-content-header';
    itemHeader_el.textContent = 'Back';
    
    itemContainer_el.append(itemIcon_el);
    itemContainer_el.append(itemHeader_el);

    contentContainer_el.append(itemContainer_el);

    if (storedContent.includes(currentDirectoryLocation)){
        itemIcon_el.classList.add('linked');
    }
    backButtonClick(itemContainer_el);
}

function backButtonClick(container) {
    container.addEventListener('click', async () => {
        directoryLocation.pop();

        if (directoryLocation.length < 1) {
            locationHeader_el.textContent = 'Overview';
            const data = await api.getContent();
            await populateFolderContent(data);
        } else {
            try {
                const directory = backDirectory(currentDirectoryLocation);
                const result = await api.getCurrentFolderContents({folderLocation: directory});
                await populateFolderContent(result);
            } catch (error) {
                console.error(error);
            }
        }
    });
}

function backDirectory(fileLocation){
    const directorySplit = fileLocation.split(/[\\/]/);
    const directory = directorySplit.slice(0, -1).join('\\');
    currentDirectoryLocation = directory;
    return directory
}

function isFileOrFolder(file) {
    if (file.includes('.')) {
        const fileExtSplit = file.split('.');
        const fileExt = fileExtSplit[fileExtSplit.length - 1];
        return 'fas fa-file';
    } else {
        return 'fas fa-folder';
    }
}
