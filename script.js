/**
 * Frame to Animation - JavaScript
 * Author: ByKaizenES
 * Copyright © 2025 ByKaizenES. Todos los derechos reservados.
 */

let frames = [];
let currentBlob = null;
let currentFormat = '';

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const framesPreview = document.getElementById('framesPreview');
const framesContainer = document.getElementById('framesContainer');
const controls = document.getElementById('controls');
const actions = document.getElementById('actions');
const fpsSlider = document.getElementById('fpsSlider');
const fpsValue = document.getElementById('fpsValue');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const previewArea = document.getElementById('previewArea');
const previewContent = document.getElementById('previewContent');
const downloadBtn = document.getElementById('downloadBtn');
const statusMessage = document.getElementById('statusMessage');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});
uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

fpsSlider.addEventListener('input', (e) => {
    fpsValue.textContent = e.target.value;
});

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 4000);
}

function handleFiles(files) {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    frames.push({
                        image: img,
                        src: e.target.result
                    });
                    updateFramesPreview();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateFramesPreview() {
    framesPreview.innerHTML = '';
    frames.forEach((frame, index) => {
        const frameDiv = document.createElement('div');
        frameDiv.className = 'frame-item';
        frameDiv.draggable = true;
        frameDiv.dataset.index = index;
        frameDiv.innerHTML = `
            <img src="${frame.src}" alt="Frame ${index + 1}">
            <div class="frame-number">${index + 1}</div>
            <button class="remove-frame" onclick="removeFrame(${index})">×</button>
        `;
        
        // Event listeners para drag & drop
        frameDiv.addEventListener('dragstart', handleDragStart);
        frameDiv.addEventListener('dragover', handleDragOver);
        frameDiv.addEventListener('drop', handleDrop);
        frameDiv.addEventListener('dragend', handleDragEnd);
        frameDiv.addEventListener('dragenter', handleDragEnter);
        frameDiv.addEventListener('dragleave', handleDragLeave);
        
        framesPreview.appendChild(frameDiv);
    });

    document.getElementById('frameCount').textContent = frames.length;
    
    if (frames.length > 0) {
        framesContainer.style.display = 'block';
        controls.style.display = 'block';
        actions.style.display = 'block';
    }
}

function removeFrame(index) {
    frames.splice(index, 1);
    updateFramesPreview();
    
    if (frames.length === 0) {
        framesContainer.style.display = 'none';
        controls.style.display = 'none';
        actions.style.display = 'none';
        previewArea.style.display = 'none';
    }
}

function clearFrames() {
    frames = [];
    framesPreview.innerHTML = '';
    framesContainer.style.display = 'none';
    controls.style.display = 'none';
    actions.style.display = 'none';
    previewArea.style.display = 'none';
    fileInput.value = '';
}

// Variables para drag & drop
let draggedIndex = null;
let draggedElement = null;

function handleDragStart(e) {
    // Asegurarse de que tenemos el frame-item
    const frameItem = e.target.closest('.frame-item');
    if (frameItem) {
        draggedIndex = parseInt(frameItem.dataset.index);
        draggedElement = frameItem;
        frameItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', frameItem.outerHTML);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const frameItem = e.target.closest('.frame-item');
    if (frameItem && frameItem !== draggedElement) {
        frameItem.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const frameItem = e.target.closest('.frame-item');
    if (frameItem) {
        frameItem.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Buscar el frame-item más cercano
    const targetElement = e.target.closest('.frame-item');
    
    if (targetElement && targetElement !== draggedElement) {
        targetElement.classList.remove('drag-over');
        const targetIndex = parseInt(targetElement.dataset.index);
        
        // Reordenar el array de frames
        const draggedFrame = frames[draggedIndex];
        frames.splice(draggedIndex, 1);
        frames.splice(targetIndex, 0, draggedFrame);
        
        // Actualizar la vista
        updateFramesPreview();
        showStatus('Frames reordenados correctamente', 'success');
    }
    
    return false;
}

function handleDragEnd(e) {
    const frameItem = e.target.closest('.frame-item');
    if (frameItem) {
        frameItem.classList.remove('dragging');
    }
    
    // Limpiar todas las clases de drag-over
    document.querySelectorAll('.frame-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    draggedIndex = null;
    draggedElement = null;
}

function showProgress(show = true) {
    progress.style.display = show ? 'block' : 'none';
    if (!show) {
        progressBar.style.width = '0%';
    }
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
}

async function generateWebM() {
    if (frames.length === 0) {
        showStatus('Carga al menos una imagen', 'error');
        return;
    }

    showProgress(true);
    updateProgress(10);
    showStatus('Generando video...', 'info');

    const fps = parseInt(fpsSlider.value);
    const transparent = document.getElementById('transparentBg').checked;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
        alpha: transparent,
        willReadFrequently: false 
    });

    canvas.width = frames[0].image.width;
    canvas.height = frames[0].image.height;

    const stream = canvas.captureStream(fps);
    
    let mimeType = 'video/webm;codecs=vp8';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        currentBlob = blob;
        currentFormat = 'webm';
        showPreview(blob, 'video/webm');
        showProgress(false);
        showStatus('Video generado correctamente', 'info');
    };

    mediaRecorder.start();
    updateProgress(20);

    let frameIndex = 0;
    const frameDuration = 1000 / fps;

    const drawFrame = () => {
        if (frameIndex < frames.length) {
            if (!transparent) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(frames[frameIndex].image, 0, 0, canvas.width, canvas.height);
            frameIndex++;
            updateProgress(20 + (frameIndex / frames.length) * 70);
            setTimeout(drawFrame, frameDuration);
        } else {
            setTimeout(() => {
                mediaRecorder.stop();
                updateProgress(100);
            }, 500);
        }
    };

    drawFrame();
}

function showPreview(blob, type) {
    previewArea.style.display = 'block';
    const url = URL.createObjectURL(blob);

    previewContent.innerHTML = `<video src="${url}" controls autoplay loop></video>`;

    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => downloadFile(blob, currentFormat);
    
    previewArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function downloadFile(blob, format) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('Descarga iniciada', 'info');
}
