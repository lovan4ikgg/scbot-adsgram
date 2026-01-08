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
const debugElement = document.getElementById('debug-info');

// Функция отладки
function debugLog(msg) {
    console.log(msg);
    if (debugElement) {
        debugElement.style.display = 'block';
        const timestamp = new Date().toLocaleTimeString();
        debugElement.innerHTML += `<div>[${timestamp}] ${JSON.stringify(msg)}</div>`;
        debugElement.scrollTop = debugElement.scrollHeight;
    }
}

// Проверка инициализации
if (!userId) {
    statusElement.textContent = '⚠️ Ошибка: откройте Mini App из Telegram бота';
    statusElement.className = 'error';
    loadAdButton.disabled = true;
    debugLog('ERROR: No user ID');
} else {
    debugLog(`User ID: ${userId}`);
}

// Инициализация AdGram SDK
let AdController;

// Проверка загрузки SDK
debugLog({
    step: 'SDK Check',
    windowAdsgram: typeof window.Adsgram,
    adsgramExists: !!window.Adsgram,
    blockId: ADSGRAM_BLOCK_ID
});

if (!window.Adsgram) {
    debugLog('ERROR: AdGram SDK not loaded!');
    statusElement.textContent = '⚠️ AdGram SDK не загружен. Перезагрузи страницу.';
    statusElement.className = 'error';
    loadAdButton.disabled = true;
} else {
    try {
        AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        debugLog({ step: 'SDK Initialized', controller: typeof AdController });
    } catch (err) {
        debugLog({ step: 'SDK Init Failed', error: err.message });
        statusElement.textContent = `⚠️ Ошибка инициализации: ${err.message}`;
        statusElement.className = 'error';
        loadAdButton.disabled = true;
    }
}

// Обработчик кнопки загрузки рекламы
loadAdButton.addEventListener('click', async () => {
    if (!AdController) {
        statusElement.textContent = '❌ AdGram SDK не загружен';
        statusElement.className = 'error';
        return;
    }

    loadAdButton.disabled = true;
    loaderElement.classList.add('active');
    statusElement.textContent = '🔄 Загружаю рекламу...';
    statusElement.className = '';

    try {
        debugLog({ step: 'Showing ad', controllerType: typeof AdController });

        // Показать рекламу через AdGram SDK
        await AdController.show()
            .then(() => {
                // Реклама просмотрена успешно
                debugLog({ step: 'Ad watched successfully' });

                loaderElement.classList.remove('active');
                statusElement.textContent = '✅ Готово! Получил 3 скачивания. Возвращайся в бота...';
                statusElement.className = 'success';

                // Отправить данные боту
                const payload = JSON.stringify({
                    action: 'ad_watched',
                    user_id: userId,
                    timestamp: Date.now(),
                    session_id: `adsgram_${Date.now()}`
                });

                console.log('Sending data to bot:', payload);
                tg.sendData(payload);

                // Закрыть Mini App через 2 секунды
                setTimeout(() => {
                    tg.close();
                }, 2000);
            })
            .catch((error) => {
                // Ошибка при показе рекламы
                throw error;
            });

    } catch (error) {
        debugLog({
            step: 'Ad loading error',
            errorType: typeof error,
            message: error?.message,
            name: error?.name,
            error: String(error)
        });

        let errorMsg = '❌ ';
        if (error?.message) {
            errorMsg += error.message;
        } else if (typeof error === 'string') {
            errorMsg += error;
        } else {
            errorMsg += 'Смотри debug info ниже';
        }

        statusElement.textContent = errorMsg;
        statusElement.className = 'error';
        loadAdButton.disabled = false;
        loaderElement.classList.remove('active');
    }
});


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
