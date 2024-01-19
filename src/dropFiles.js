let isDragging = false;

contentContainer_el.addEventListener('dragenter', (e) => {
    if (directoryLocation.length === 0) {
        contentContainer_el.classList.add('drop');
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            isDragging = true;
        }    
    }
});

contentContainer_el.addEventListener('dragover', (e) => {
    if (directoryLocation.length === 0) {
        e.preventDefault();
        e.stopPropagation();            
    }
});

contentContainer_el.addEventListener('dragleave', (e) => {
    if (directoryLocation.length === 0) {
        contentContainer_el.classList.remove('drop');
        e.preventDefault();
        e.stopPropagation();
        if (isDragging) {
            isDragging = false;
        }            
    }
});

contentContainer_el.addEventListener('drop', async (e) => {
    if (directoryLocation.length === 0) {
        contentContainer_el.classList.remove('drop');
        e.preventDefault();
        isDragging = false;

        let paths = [];
        for (const f of e.dataTransfer.files) {
            paths.push(f.path);
        }
        const allSaveSuccess = await api.dropSaveHandler({ paths: paths });
        if (allSaveSuccess === 'Failed'){
            contentContainer_el.classList.add('error');
            setTimeout(() => {
                contentContainer_el.classList.remove('error');
            }, 2000);
        }
        const data = await api.getContent();
        await populateFolderContent(data);
    }
});
