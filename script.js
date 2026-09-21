import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBIx6rNHweMMCXEjcdNujfpmocEtr4YIro",
  authDomain: "fotosconfra-bc3dc.firebaseapp.com",
  projectId: "fotosconfra-bc3dc",
  storageBucket: "fotosconfra-bc3dc.firebasestorage.app",
  messagingSenderId: "848263858145",
  appId: "1:848263858145:web:073a0e4d4d016baff7b4a0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referências HTML
const homeScreen = document.getElementById('homeScreen');
const uploadScreen = document.getElementById('uploadScreen');
const presentationScreen = document.getElementById('presentationScreen');

const btnUploadMode = document.getElementById('btnUploadMode');
const btnPresentationMode = document.getElementById('btnPresentationMode');
const btnBackFromUpload = document.getElementById('btnBackFromUpload');
const btnExitPresentation = document.getElementById('btnExitPresentation');
const btnAdminMode = document.getElementById('btnAdminMode');
const btnBackFromAdmin = document.getElementById('btnBackFromAdmin');
const adminScreen = document.getElementById('adminScreen');
const adminGrid = document.getElementById('adminGrid');
const watermark = document.getElementById('watermark');
const nomeInput = document.getElementById('nomeInput');

const btnQrMode = document.getElementById('btnQrMode');
const qrGeneratorScreen = document.getElementById('qrGeneratorScreen');
const btnBackFromQr = document.getElementById('btnBackFromQr');
const desafioInput = document.getElementById('desafioInput');
const btnGenerateQr = document.getElementById('btnGenerateQr');
const qrResultContainer = document.getElementById('qrResultContainer');
const qrCodeImage = document.getElementById('qrCodeImage');
const btnDownloadQr = document.getElementById('btnDownloadQr');

const challengeScreen = document.getElementById('challengeScreen');
const challengeTextDisplay = document.getElementById('challengeTextDisplay');
const nomeDesafioInput = document.getElementById('nomeDesafioInput');
const btnAcceptChallenge = document.getElementById('btnAcceptChallenge');
const btnSkipChallenge = document.getElementById('btnSkipChallenge');
const challengeBadge = document.getElementById('challengeBadge');

let currentChallenge = null;

const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const btnSubmitPhoto = document.getElementById('btnSubmitPhoto');
const uploadStatus = document.getElementById('uploadStatus');

const carouselContainer = document.getElementById('carouselContainer');
const emptyState = document.getElementById('emptyState');
const carouselImg = document.getElementById('carouselImg');

let currentBase64Image = null;
let carouselImages = [];
let currentCarouselIndex = 0;
let carouselInterval = null;
const CAROUSEL_INTERVAL_MS = 5000; // Troca de foto a cada 5 segundos

// Verificação de URL para Desafio
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const desafio = urlParams.get('desafio');
    
    if (desafio) {
        currentChallenge = desafio;
        challengeTextDisplay.textContent = `"${desafio}"`;
        showScreen(challengeScreen);
    }
});

// --- NAVEGAÇÃO ---
function showScreen(screen) {
    homeScreen.classList.add('hidden');
    uploadScreen.classList.add('hidden');
    presentationScreen.classList.add('hidden');
    adminScreen.classList.add('hidden');
    qrGeneratorScreen.classList.add('hidden');
    challengeScreen.classList.add('hidden');
    
    screen.classList.remove('hidden');
}

btnUploadMode.addEventListener('click', () => {
    if (!nomeInput.value.trim()) {
        alert('Por favor, digite seu nome antes de enviar fotos!');
        nomeInput.focus();
        return;
    }
    showScreen(uploadScreen);
    resetUploadForm();
});

btnPresentationMode.addEventListener('click', () => {
    showScreen(presentationScreen);
    startPresentationMode();
});

btnAdminMode.addEventListener('click', () => {
    showScreen(adminScreen);
    startAdminMode();
});

btnBackFromUpload.addEventListener('click', () => showScreen(homeScreen));
btnBackFromAdmin.addEventListener('click', () => {
    showScreen(homeScreen);
    stopAdminMode();
});

btnExitPresentation.addEventListener('click', () => {
    showScreen(homeScreen);
    stopPresentationMode();
});

// Lógica QR Code
btnQrMode.addEventListener('click', () => {
    showScreen(qrGeneratorScreen);
});

btnBackFromQr.addEventListener('click', () => {
    showScreen(homeScreen);
    qrResultContainer.classList.add('hidden');
    desafioInput.value = '';
});

btnGenerateQr.addEventListener('click', () => {
    const desafioText = desafioInput.value.trim();
    if (!desafioText) {
        alert('Por favor, defina um desafio.');
        return;
    }
    
    const baseUrl = window.location.origin + window.location.pathname;
    const finalUrl = `${baseUrl}?desafio=${encodeURIComponent(desafioText)}`;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalUrl)}&margin=10`;
    qrCodeImage.src = qrUrl;
    qrResultContainer.classList.remove('hidden');
});

btnDownloadQr.addEventListener('click', async () => {
    try {
        const qrUrl = qrCodeImage.src;
        if (!qrUrl) return;
        
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Criar nome sugestivo com o nome do desafio
        const desafioText = desafioInput.value.trim();
        const safeName = desafioText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `desafio_${safeName || 'qrcode'}.png`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Erro ao baixar o QR Code:", e);
        // Fallback: se o navegador bloquear o fetch (CORS), abre em nova aba
        window.open(qrCodeImage.src, '_blank');
    }
});

// Lógica Desafio Modal
btnAcceptChallenge.addEventListener('click', () => {
    if (!nomeDesafioInput.value.trim()) {
        alert('Por favor, digite seu nome.');
        nomeDesafioInput.focus();
        return;
    }
    nomeInput.value = nomeDesafioInput.value;
    showScreen(uploadScreen);
    resetUploadForm();
});

btnSkipChallenge.addEventListener('click', () => {
    if (!nomeDesafioInput.value.trim()) {
        alert('Por favor, digite seu nome.');
        nomeDesafioInput.focus();
        return;
    }
    nomeInput.value = nomeDesafioInput.value;
    currentChallenge = null; // Ignora o desafio
    showScreen(uploadScreen);
    resetUploadForm();
});

// --- LÓGICA DE UPLOAD ---
const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Converter para base64 com resize usando Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Qualidade JPEG 0.7 reduz bastante o tamanho garantindo qualidade ok pra tela
            currentBase64Image = canvas.toDataURL('image/jpeg', 0.7);
            
            // Exibir preview
            imagePreview.src = currentBase64Image;
            uploadBox.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const btnOpenCamera = document.getElementById('btnOpenCamera');
const btnOpenGallery = document.getElementById('btnOpenGallery');
const btnDiscardPhoto = document.getElementById('btnDiscardPhoto');

if(btnOpenCamera) btnOpenCamera.addEventListener('click', () => cameraInput.click());
if(btnOpenGallery) btnOpenGallery.addEventListener('click', () => galleryInput.click());

if(cameraInput) cameraInput.addEventListener('change', handleFileSelection);
if(galleryInput) galleryInput.addEventListener('change', handleFileSelection);

if(btnDiscardPhoto) {
    btnDiscardPhoto.addEventListener('click', () => {
        // Limpar preview e inputs
        imagePreview.src = '';
        currentBase64Image = null;
        if(cameraInput) cameraInput.value = '';
        if(galleryInput) galleryInput.value = '';
        
        // Voltar para caixa de escolha
        previewContainer.classList.add('hidden');
        uploadBox.classList.remove('hidden');
    });
}

btnSubmitPhoto.addEventListener('click', async () => {
    if (!currentBase64Image) return;

    btnSubmitPhoto.disabled = true;
    uploadStatus.textContent = 'Enviando...';
    uploadStatus.classList.remove('hidden');

    try {
        await addDoc(collection(db, "fotos"), {
            dataUrl: currentBase64Image,
            author: nomeInput.value.trim() || 'Desconhecido',
            desafio: currentChallenge || null,
            timestamp: serverTimestamp()
        });

        uploadStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Foto enviada!';
        uploadStatus.style.color = '#10b981'; // green-500
        uploadStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        
        setTimeout(() => {
            resetUploadForm();
        }, 2000);
    } catch (error) {
        console.error("Erro ao enviar imagem:", error);
        uploadStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro ao enviar. Tente novamente.';
        uploadStatus.style.color = '#ef4444'; // red-500
        uploadStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        btnSubmitPhoto.disabled = false;
    }
});

function resetUploadForm() {
    currentBase64Image = null;
    if(cameraInput) cameraInput.value = '';
    if(galleryInput) galleryInput.value = '';
    imagePreview.src = '';
    previewContainer.classList.add('hidden');
    uploadBox.classList.remove('hidden');
    uploadStatus.classList.add('hidden');
    btnSubmitPhoto.disabled = false;
    
    // reset status style
    uploadStatus.style.color = 'var(--primary)';
    uploadStatus.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
}

// --- LÓGICA DO CARROSSEL (APRESENTAÇÃO) ---
let unsubscribe = null;

function startPresentationMode() {
    // Pedir tela cheia opcionalmente
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => console.log(err));
    }

    // Escutar o banco de dados
    const q = query(collection(db, "fotos"), orderBy("timestamp", "desc"), limit(50));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        const newImages = [];
        snapshot.forEach((doc) => {
            newImages.push({ id: doc.id, ...doc.data() });
        });

        // Se a lista mudou e temos imagens, atualizamos o array local
        if (newImages.length > 0) {
            carouselImages = newImages;
            emptyState.classList.add('hidden');
            carouselImg.classList.remove('hidden');
            
            // Se o carrossel ainda não estava rodando, iniciar
            if (!carouselInterval) {
                currentCarouselIndex = 0;
                showNextImage();
                carouselInterval = setInterval(showNextImage, CAROUSEL_INTERVAL_MS);
            }
        } else {
            emptyState.classList.remove('hidden');
            carouselImg.classList.add('hidden');
        }
    }, (error) => {
        console.error("Erro ao escutar fotos:", error);
    });
}

function stopPresentationMode() {
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.log(err));
    }
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    carouselImages = [];
}

function showNextImage() {
    if (carouselImages.length === 0) return;

    // Efeito de fade out
    carouselImg.classList.add('fade-out');

    setTimeout(() => {
        const imgData = carouselImages[currentCarouselIndex];
        carouselImg.src = imgData.dataUrl;
        
        if (imgData.author && imgData.author !== 'Desconhecido') {
            watermark.textContent = `tirada por ${imgData.author}`;
            watermark.classList.remove('hidden');
        } else {
            watermark.classList.add('hidden');
        }

        if (imgData.desafio) {
            challengeBadge.textContent = `Desafio: ${imgData.desafio}`;
            challengeBadge.classList.remove('hidden');
        } else {
            challengeBadge.classList.add('hidden');
        }

        // Efeito de fade in
        carouselImg.classList.remove('fade-out');
        
        currentCarouselIndex++;
        if (currentCarouselIndex >= carouselImages.length) {
            currentCarouselIndex = 0;
        }
    }, 500); // tempo que deve bater com a transição do css (1s ou 0.5s)
}

// --- LÓGICA DO PAINEL ADMIN ---
let unsubscribeAdmin = null;

function startAdminMode() {
    const q = query(collection(db, "fotos"), orderBy("timestamp", "desc"));
    
    unsubscribeAdmin = onSnapshot(q, (snapshot) => {
        adminGrid.innerHTML = '';
        snapshot.forEach((documento) => {
            const data = documento.data();
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'admin-item';
            
            const img = document.createElement('img');
            img.src = data.dataUrl;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'admin-delete-btn';
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.onclick = async () => {
                if(confirm('Tem certeza que deseja excluir esta foto?')) {
                    await deleteDoc(doc(db, "fotos", documento.id));
                }
            };
            
            itemDiv.appendChild(img);
            itemDiv.appendChild(delBtn);
            adminGrid.appendChild(itemDiv);
        });
    });
}

function stopAdminMode() {
    if (unsubscribeAdmin) {
        unsubscribeAdmin();
        unsubscribeAdmin = null;
    }
}
