// 游戏配置
const config = {
    gameTime: 30, // 游戏时长（秒）
    itemSpeed: 5, // 物品下落速度
    itemInterval: 200, // 物品生成间隔（毫秒）
    playerSpeed: 10, // 玩家移动速度
    items: [
        { type: 'yuanbao', score: 10, image: 'yuanbao.png', sound: 'music1' },
        { type: 'hongbao', score: 10, image: 'hongbao.png', sound: 'music1' },
        { type: 'fudai', score: 10, image: 'fudai.png', sound: 'music2' },
        { type: 'jintiao', score: 10, image: 'jintiao.png', sound: 'music2' },
        { type: 'zhuanshi', score: 10, image: 'zhuanshi.png', sound: 'music3' },
        { type: 'zhihongbao', score: 10, image: 'zhihongbao.png', sound: 'music3' },
        { type: 'dahongbao', score: 10, image: 'dahongbao.png', sound: 'music4' },
        { type: 'bomb', score: -1, image: 'bomb.png', sound: 'bombSound' } // 炸弹
    ]
};

// 游戏状态
let gameState = {
    score: 0,
    timeLeft: config.gameTime,
    isPlaying: false,
    items: [],
    playerPosition: 50, // 玩家位置（百分比）
    gameLoop: null,
    itemGenerator: null
};

// DOM 元素
const elements = {
    welcomePage: document.getElementById('welcomePage'),
    gamePage: document.getElementById('gamePage'),
    resultModal: document.getElementById('resultModal'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    player: document.getElementById('player'),
    score: document.getElementById('score'),
    timer: document.getElementById('timer'),
    finalScore: document.getElementById('finalScore'),
    gameArea: document.getElementById('gameArea'),
    bgMusic: document.getElementById('bgMusic'),
    buttonSound: document.getElementById('buttonSound'),
    bombSound: document.getElementById('bombSound'),
    music1: document.getElementById('music1'),
    music2: document.getElementById('music2'),
    music3: document.getElementById('music3'),
    music4: document.getElementById('music4')
};

// 初始化游戏
function initGame() {
    // 绑定按钮事件
    elements.startButton.addEventListener('click', startGame);
    elements.restartButton.addEventListener('click', restartGame);

    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyPress);

    // 绑定触摸事件
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        movePlayer(diff > 0 ? 'right' : 'left');
        touchStartX = touchX;
    });
}

// 开始游戏
function startGame() {
    playSound('buttonSound');
    elements.welcomePage.classList.remove('active');
    elements.gamePage.classList.add('active');
    elements.bgMusic.play();

    resetGameState();
    gameState.isPlaying = true;

    // 开始游戏循环
    gameState.gameLoop = setInterval(updateGame, 16); // 约60fps
    gameState.itemGenerator = setInterval(generateItem, config.itemInterval);

    // 开始倒计时
    const timerInterval = setInterval(() => {
        if (gameState.timeLeft > 0) {
            gameState.timeLeft--;
            elements.timer.textContent = gameState.timeLeft;
        } else {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// 重置游戏状态
function resetGameState() {
    gameState.score = 0;
    gameState.timeLeft = config.gameTime;
    gameState.items = [];
    gameState.playerPosition = 50;
    elements.score.textContent = '0';
    elements.timer.textContent = config.gameTime;
    elements.player.style.left = '50%';
    
    // 清除所有掉落物
    const items = elements.gameArea.getElementsByClassName('item');
    while (items.length > 0) {
        items[0].remove();
    }
}

// 生成掉落物
function generateItem() {
    if (!gameState.isPlaying) return;

    const item = config.items[Math.floor(Math.random() * config.items.length)];
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.dataset.type = item.type;
    itemElement.style.backgroundImage = `url(image/${item.image})`;
    itemElement.style.left = Math.random() * (elements.gameArea.clientWidth - 50) + 'px';
    itemElement.style.top = '-50px';
    elements.gameArea.appendChild(itemElement);
    gameState.items.push({
        element: itemElement,
        type: item.type,
        score: item.score,
        sound: item.sound
    });
}

// 更新游戏状态
function updateGame() {
    if (!gameState.isPlaying) return;

    // 更新掉落物位置
    gameState.items.forEach((item, index) => {
        const top = parseFloat(item.element.style.top);
        item.element.style.top = (top + config.itemSpeed) + 'px';

        // 检查碰撞
        if (checkCollision(item.element, elements.player)) {
            handleCollision(item);
            item.element.remove();
            gameState.items.splice(index, 1);
        }
        // 检查是否超出屏幕
        else if (top > elements.gameArea.clientHeight) {
            item.element.remove();
            gameState.items.splice(index, 1);
        }
    });
}

// 检查碰撞
function checkCollision(item, player) {
    const itemRect = item.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    return !(itemRect.right < playerRect.left || 
             itemRect.left > playerRect.right || 
             itemRect.bottom < playerRect.top || 
             itemRect.top > playerRect.bottom);
}

// 处理碰撞
function handleCollision(item) {
    if (item.type === 'bomb') {
        playSound(item.sound);
        endGame();
    } else {
        playSound(item.sound);
        gameState.score += item.score;
        elements.score.textContent = gameState.score;
    }
}

// 移动玩家
function movePlayer(direction) {
    if (!gameState.isPlaying) return;

    const moveAmount = direction === 'left' ? -config.playerSpeed : config.playerSpeed;
    gameState.playerPosition = Math.max(0, Math.min(100, gameState.playerPosition + moveAmount));
    elements.player.style.left = gameState.playerPosition + '%';
}

// 处理键盘输入
function handleKeyPress(e) {
    if (!gameState.isPlaying) return;

    if (e.key === 'ArrowLeft') {
        movePlayer('left');
    } else if (e.key === 'ArrowRight') {
        movePlayer('right');
    }
}

// 播放音效
function playSound(soundId) {
    const sound = elements[soundId];
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

// 结束游戏
function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.gameLoop);
    clearInterval(gameState.itemGenerator);
    elements.finalScore.textContent = gameState.score;
    elements.resultModal.style.display = 'block';
}

// 重新开始游戏
function restartGame() {
    playSound('buttonSound');
    elements.resultModal.style.display = 'none';
    elements.gamePage.classList.remove('active');
    elements.welcomePage.classList.add('active');
    elements.bgMusic.currentTime = 0;
    elements.bgMusic.pause();
}

// 初始化游戏
initGame(); 