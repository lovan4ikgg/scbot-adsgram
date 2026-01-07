// Telegram WebApp API
const tg = window.Telegram.WebApp;

// Инициализация
tg.ready();
tg.expand();

// Получение данных пользователя
const userId = tg.initDataUnsafe?.user?.id;

// BLOCK_ID от AdGram
const ADSGRAM_BLOCK_ID = "20769";

// Элементы DOM
const loadAdButton = document.getElementById('load-ad');
const adContainer = document.getElementById('ad-container');
const statusElement = document.getElementById('status');
const loaderElement = document.getElementById('loader');

// Проверка инициализации
if (!userId) {
    statusElement.textContent = '⚠️ Ошибка: откройте Mini App из Telegram бота';
    statusElement.className = 'error';
    loadAdButton.disabled = true;
} else {
    console.log('User ID:', userId);
}

// Обработчик кнопки загрузки рекламы
loadAdButton.addEventListener('click', async () => {
    loadAdButton.disabled = true;
    loaderElement.classList.add('active');
    statusElement.textContent = '🔄 Загружаю рекламу...';
    statusElement.className = '';

    try {
        // Запрос рекламы от AdGram
        const adUrl = `https://api.adsgram.ai/advbot?tgid=${userId}&blockid=${ADSGRAM_BLOCK_ID}`;

        console.log('Requesting ad from:', adUrl);

        const response = await fetch(adUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('AdGram response:', data);

        if (data.video_url) {
            // Показать видео
            showVideo(data.video_url, data.session_id || generateSessionId());
        } else if (data.error) {
            throw new Error(data.error);
        } else {
            throw new Error('Реклама недоступна');
        }
    } catch (error) {
        console.error('Ad loading error:', error);
        statusElement.textContent = '❌ Ошибка загрузки рекламы. Попробуй еще раз.';
        statusElement.className = 'error';
        loadAdButton.disabled = false;
        loaderElement.classList.remove('active');
    }
});

function showVideo(videoUrl, sessionId) {
    loaderElement.classList.remove('active');

    // Очистить контейнер
    adContainer.innerHTML = '';

    // Создать видео элемент
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = false; // Без контролов
    video.autoplay = true;
    video.playsInline = true; // Для iOS
    video.preload = 'auto';
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.maxHeight = '400px';
    video.style.objectFit = 'contain';

    // Показать контейнер
    adContainer.classList.add('active');
    adContainer.appendChild(video);

    statusElement.textContent = '▶️ Смотри видео до конца...';
    statusElement.className = '';

    // Обработчик окончания видео
    video.addEventListener('ended', () => {
        console.log('Video ended, session:', sessionId);

        // Отправить данные боту через Telegram WebApp API
        const payload = JSON.stringify({
            action: 'ad_watched',
            session_id: sessionId,
            user_id: userId,
            timestamp: Date.now()
        });

        console.log('Sending data to bot:', payload);

        // Отправка данных боту
        tg.sendData(payload);

        // Показать успешное завершение
        statusElement.textContent = '✅ Готово! Получил 3 скачивания. Возвращайся в бота...';
        statusElement.className = 'success';

        // Закрыть Mini App через 2 секунды
        setTimeout(() => {
            tg.close();
        }, 2000);
    });

    // Обработчик ошибки видео
    video.addEventListener('error', (e) => {
        console.error('Video playback error:', e);
        statusElement.textContent = '❌ Ошибка воспроизведения видео. Попробуй еще раз.';
        statusElement.className = 'error';
        loadAdButton.disabled = false;
        adContainer.classList.remove('active');
    });

    // Обработчик готовности видео
    video.addEventListener('loadeddata', () => {
        console.log('Video loaded successfully');
        statusElement.textContent = `▶️ Видео загружено (${Math.round(video.duration)}с). Смотри до конца!`;
    });

    // Попытка запустить видео (для автоплея)
    video.play().catch(err => {
        console.warn('Autoplay prevented, showing play button:', err);
        video.controls = true; // Показать контролы если автоплей заблокирован
    });
}

// Генерация уникального session ID если AdGram не предоставил
function generateSessionId() {
    return `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Обработка кнопки "Назад" в Telegram
tg.BackButton.onClick(() => {
    tg.close();
});

// Показать кнопку "Назад"
tg.BackButton.show();

// Установить цвет заголовка
if (tg.colorScheme === 'dark') {
    tg.setHeaderColor('#1c1c1e');
} else {
    tg.setHeaderColor('#ffffff');
}

console.log('AdGram Mini App initialized');
console.log('Telegram WebApp version:', tg.version);
console.log('Platform:', tg.platform);
