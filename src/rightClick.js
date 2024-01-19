const customContextMenu_el = document.getElementById('customContextMenu');
// Background Click Elements
const contextMenuBackground_el = document.getElementById('contextMenuBackground');
const contextBGAddFile_el = document.getElementById('contextBGAddFile');
const contextBGAddFolder_el = document.getElementById('contextBGAddFolder');

// Folder/File Click Elements
const contextMenuFileFolder_el = document.getElementById('contextMenuFileFolder');
const rcFileExplorer_el = document.getElementById('rcFileExplorer');
const rcRemove_el = document.getElementById('rcRemove');

// For right clicking background
const bgrcFileExplorer_el = document.getElementById('bgrcFileExplorer');

let rightClickedPath = '';
let rightClickItem = '';

function rightClickMenu(e, path){
    hideContextMenuContent();
    menuDisplay(e);
    rightClickedPath = path;
    switch (rightClickItem){
        case 'Background':
            contextMenuBackground_el.style.display = 'grid';
            if (directoryLocation.length !== 0){
                bgrcFileExplorer_el.style.display = 'grid';
            }
            break;
        case 'File':
            contextMenuFileFolder_el.style.display = 'grid';
            if (storedContent.includes(path) && directoryLocation.length === 0){
                rcRemove_el.style.display = 'grid';
            }
            break;
        case 'Directory':
            contextMenuFileFolder_el.style.display = 'grid';
            if (storedContent.includes(path) && directoryLocation.length === 0){
                rcRemove_el.style.display = 'grid';
            }
            break;
    }
}

function hideContextMenuContent() {
    const elementsToHide = [contextMenuBackground_el, contextMenuFileFolder_el, rcRemove_el];
    elementsToHide.forEach(element => {
        if (element.style.display === 'grid') {
            element.style.display = 'none';
        }
    });
}

function menuDisplay(e) {
    e.preventDefault();

    customContextMenu_el.style.display = 'block';

    // Reset position and size properties
    customContextMenu_el.style.right = 'auto';
    customContextMenu_el.style.bottom = 'auto';
    customContextMenu_el.style.width = 'auto'; // e.g., '200px'
    customContextMenu_el.style.height = 'auto'; // e.g., '150px'

    // Get the dimensions of the window
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the adjusted position to ensure the menu stays within the window
    const adjustedRight = windowWidth - e.clientX;
    const adjustedBottom = windowHeight - e.clientY;

    // Adjust the position based on the mouse click
    customContextMenu_el.style.left = e.clientX <= windowWidth / 2 ? `${e.clientX}px` : 'auto';
    customContextMenu_el.style.right = e.clientX > windowWidth / 2 ? `${adjustedRight}px` : 'auto';
    customContextMenu_el.style.top = e.clientY <= windowHeight / 2 ? `${e.clientY}px` : 'auto';
    customContextMenu_el.style.bottom = e.clientY > windowHeight / 2 ? `${adjustedBottom}px` : 'auto';
}




document.addEventListener('click', () => {
    customContextMenu_el.style.display = 'none';
    rightClickedPath = '';
    hideContextMenuContent();
});

rcFileExplorer_el.addEventListener('click', () => {
    api.revealFileBrowser({path: rightClickedPath});
});

rcRemove_el.addEventListener('click', async () => {
    removeOverlay_el.style.display = 'flex';
    fileManagerRemove(rightClickedPath);
});

bgrcFileExplorer_el.addEventListener('click', () => {
    console.log(currentDirectoryLocation);
    api.revealFileBrowser({path: currentDirectoryLocation});
});