// ==================== VARIABLES GLOBALES ====================

// Estado del juego
let gameMode = '';
let difficulty = 'medium';
let currentPlayer = 'X';
let mainBoard = [];
let activeBoard = null;
let gameActive = true;
let isGamePaused = false;
let moveCount = 0;
let gameStartTime = null;
let timerInterval = null;

// Configuración de audio
let sfxEnabled = true;
let bgmEnabled = true;
let audio = new Audio();
let isPlaying = false;
let currentSongIndex = 0;
const songs = [
    'music/bgm/song1.ogg',
    'music/bgm/song2.ogg',
    'music/bgm/song3.ogg',
    'music/bgm/song4.ogg',
    'music/bgm/song5.ogg',
    'music/bgm/song6.ogg'
];

// Elementos de audio y música
let mainMenuBGM;
let placeSound;
let winSound;
let drawSound;
let clickSound;

// ==================== INICIALIZACIÓN ====================

// Se ejecuta cuando la ventana se ha cargado completamente
window.onload = function() {
    setupAudioElements();
    playMainMenuBGM();
};

// Configura los elementos de audio
function setupAudioElements() {
    mainMenuBGM = document.getElementById('bgm-main-menu');
    placeSound = document.getElementById('place-sound');
    winSound = document.getElementById('win-sound');
    drawSound = document.getElementById('draw-sound');
    clickSound = document.getElementById('click-sound');

    mainMenuBGM.loop = true;
    audio.addEventListener('ended', nextSong);
}

// ==================== FUNCIONES DE NAVEGACIÓN Y MENÚ ====================

// Muestra el menú de selección de dificultad
function showDifficulty(mode) {
    gameMode = mode;
    toggleDisplay('main-menu', false);
    toggleDisplay('difficulty-menu', true);
    playClickSound();
}

// Inicia el juego con el modo y dificultad seleccionados
function startGame(mode, selectedDifficulty) {
    if (selectedDifficulty) {
        difficulty = selectedDifficulty;
    }
    gameMode = mode;
    resetGameState();
    toggleDisplay('main-menu', false);
    toggleDisplay('difficulty-menu', false);
    toggleDisplay('game-container', true);
    playClickSound();
    stopMainMenuBGM();
    initializeRandomSong();
    initGame();
}

// Regresa al menú principal y reinicia el estado del juego
function backToMainMenu() {
    hideAllModals();
    toggleDisplay('game-container', false);
    toggleDisplay('main-menu', true);
    resetGameState();
    playClickSound();
    stopAudio();
    playMainMenuBGM();
}

// ==================== FUNCIONES DEL JUEGO ====================

// Inicializa el estado del juego
function initGame() {
    isGamePaused = false;
    gameActive = true;
    currentPlayer = 'X';
    moveCount = 0;
    activeBoard = null;
    gameStartTime = Date.now();
    mainBoard = Array(9).fill(null).map(() => ({
        cells: Array(9).fill(''),
        winner: null
    }));
    startTimer();
    drawBoard();
    updateMessage(`Turno de ${currentPlayer}`);
}

// Dibuja el tablero principal y los mini-tableros
function drawBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    mainBoard.forEach((miniBoard, index) => {
        const miniBoardElement = document.createElement('div');
        miniBoardElement.classList.add('mini-board');
        if (activeBoard === index || activeBoard === null) {
            miniBoardElement.classList.add('active');
        }
        if (miniBoard.winner) {
            miniBoardElement.classList.add(`winner-${miniBoard.winner}`);
            miniBoardElement.innerHTML = `<span>${miniBoard.winner}</span>`;
        } else {
            drawMiniBoardCells(miniBoard, miniBoardElement, index);
        }
        boardElement.appendChild(miniBoardElement);
    });
}

// Dibuja las celdas de un mini-tablero
function drawMiniBoardCells(miniBoard, miniBoardElement, boardIndex) {
    miniBoard.cells.forEach((cell, cellIndex) => {
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');
        if (cell !== '') {
            cellElement.innerHTML = `<span>${cell}</span>`;
            cellElement.classList.add('disabled');
        } else if (gameActive && (activeBoard === boardIndex || activeBoard === null)) {
            cellElement.addEventListener('click', () => handleCellClick(boardIndex, cellIndex));
        } else {
            cellElement.classList.add('disabled');
        }
        miniBoardElement.appendChild(cellElement);
    });
}

// Maneja el evento de clic en una celda
function handleCellClick(boardIndex, cellIndex) {
    if (!gameActive || isGamePaused) return;
    if (activeBoard !== null && activeBoard !== boardIndex) {
        updateMessage(`Debes jugar en el tablero ${activeBoard + 1}`);
        return;
    }
    const miniBoard = mainBoard[boardIndex];
    if (miniBoard.cells[cellIndex] !== '') return;

    miniBoard.cells[cellIndex] = currentPlayer;
    moveCount++;
    playPlaceSound();
    animateCellPlacement(miniBoard, cellIndex);
    checkMiniBoardWinner(miniBoard, boardIndex);
    updateActiveBoard(cellIndex);
    drawBoard();
    checkGameWinner();
    if (!gameActive) return;
    if (isDrawImminent()) {
        gameActive = false;
        clearInterval(timerInterval);
        showDrawModal();
        return;
    }
    switchPlayer();
    updateMessage(`Turno de ${currentPlayer}`);
    if (gameMode === 'cpu' && currentPlayer === 'O') {
        cpuMove();
    }
}

// Cambia al siguiente jugador
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

// Actualiza el mensaje de estado del juego
function updateMessage(message) {
    document.getElementById('message').textContent = message;
}

// Verifica si hay un ganador en el mini-tablero
function checkMiniBoardWinner(miniBoard, boardIndex) {
    const winner = calculateWinner(miniBoard.cells);
    if (winner) {
        miniBoard.winner = winner;
    }
}

// Actualiza el tablero activo basado en el último movimiento
function updateActiveBoard(cellIndex) {
    const nextBoard = mainBoard[cellIndex];
    activeBoard = nextBoard.winner || isBoardFull(nextBoard.cells) ? null : cellIndex;
}

// Verifica si hay un ganador en el juego principal
function checkGameWinner() {
    const mainBoardState = mainBoard.map(board => board.winner || '');
    const winner = calculateWinner(mainBoardState);

    if (winner) {
        handleGameOver(`${winner} ha ganado el juego`);
    } else if (mainBoardState.every(cell => cell !== '')) {
        handleGameOver('¡Es un empate!');
    }
}

// Maneja el final del juego
function handleGameOver(message) {
    gameActive = false;
    clearInterval(timerInterval);
    playWinSound();
    showGameOverModal(message);
}

// Calcula si hay un ganador en un conjunto de celdas
function calculateWinner(cells) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8], // Filas
        [0,3,6], [1,4,7], [2,5,8], // Columnas
        [0,4,8], [2,4,6]           // Diagonales
    ];
    for (let [a, b, c] of lines) {
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            return cells[a];
        }
    }
    return null;
}

// Verifica si un tablero está lleno
function isBoardFull(cells) {
    return cells.every(cell => cell !== '');
}

// Verifica si el empate es inminente
function isDrawImminent() {
    const mainBoardState = mainBoard.map(board => board.winner || '');
    const availableBoards = mainBoard.filter(board => !board.winner && !isBoardFull(board.cells));
    return availableBoards.length === 0 && !calculateWinner(mainBoardState);
}

// Reinicia el juego
function resetGame() {
    clearInterval(timerInterval);
    initGame();
    playClickSound();
}

// ==================== FUNCIONES DE IA ====================

// Realiza el movimiento de la IA
function cpuMove() {
    showAIThinkingModal();
    setTimeout(() => {
        const gameState = {
            mainBoard: mainBoard.map(board => ({
                cells: board.cells.slice(),
                winner: board.winner,
            })),
            activeBoard: activeBoard,
            currentPlayer: currentPlayer,
        };
        const isMaximizingPlayer = (currentPlayer === 'O');
        const depth = getDepthByDifficulty();
        const result = minimaxGame(gameState, depth, -Infinity, Infinity, isMaximizingPlayer);
        if (result.move) {
            handleCellClick(result.move.boardIndex, result.move.cellIndex);
        }
        hideAIThinkingModal();
    }, 500);
}

// Obtiene la profundidad de búsqueda basada en la dificultad
function getDepthByDifficulty() {
    switch (difficulty) {
        case 'easy':
            return 1;
        case 'medium':
            return 2;
        case 'hard':
            return 3;
        default:
            return 2;
    }
}

// Implementación del algoritmo Minimax con poda alfa-beta
function minimaxGame(gameState, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || isGameOver(gameState)) {
        return { score: evaluateGameState(gameState), move: null };
    }
    const possibleMoves = generatePossibleMoves(gameState);
    let bestMove = null;

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const newGameState = applyMove(gameState, move);
            const result = minimaxGame(newGameState, depth - 1, alpha, beta, false);
            if (result.score > maxEval) {
                maxEval = result.score;
                bestMove = move;
            }
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const newGameState = applyMove(gameState, move);
            const result = minimaxGame(newGameState, depth - 1, alpha, beta, true);
            if (result.score < minEval) {
                minEval = result.score;
                bestMove = move;
            }
            beta = Math.min(beta, minEval);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
}

// Genera todos los movimientos posibles en el estado actual del juego
function generatePossibleMoves(gameState) {
    let moves = [];
    if (gameState.activeBoard !== null) {
        moves = getMovesForBoard(gameState, gameState.activeBoard);
        if (moves.length > 0) return moves;
        gameState.activeBoard = null;
    }
    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        moves = moves.concat(getMovesForBoard(gameState, boardIndex));
    }
    return moves;
}

// Obtiene los movimientos posibles para un mini-tablero específico
function getMovesForBoard(gameState, boardIndex) {
    const moves = [];
    const board = gameState.mainBoard[boardIndex];
    if (!board.winner && !isBoardFull(board.cells)) {
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            if (board.cells[cellIndex] === '') {
                moves.push({ boardIndex, cellIndex });
            }
        }
    }
    return moves;
}

// Aplica un movimiento y devuelve un nuevo estado del juego
function applyMove(gameState, move) {
    const newGameState = JSON.parse(JSON.stringify(gameState)); // Clona el estado
    const { boardIndex, cellIndex } = move;
    const board = newGameState.mainBoard[boardIndex];
    board.cells[cellIndex] = newGameState.currentPlayer;
    const winner = calculateWinner(board.cells);
    if (winner) {
        board.winner = winner;
    }
    const nextBoard = newGameState.mainBoard[cellIndex];
    newGameState.activeBoard = nextBoard.winner || isBoardFull(nextBoard.cells) ? null : cellIndex;
    newGameState.currentPlayer = newGameState.currentPlayer === 'X' ? 'O' : 'X';
    return newGameState;
}

// Verifica si el juego ha terminado
function isGameOver(gameState) {
    const mainBoardState = gameState.mainBoard.map(board => board.winner || '');
    return calculateWinner(mainBoardState) || mainBoardState.every(cell => cell !== '');
}

// Evalúa el estado del juego para la IA
function evaluateGameState(gameState) {
    const mainBoardState = gameState.mainBoard.map(board => board.winner || '');
    const winner = calculateWinner(mainBoardState);
    if (winner === 'O') {
        return Infinity;
    } else if (winner === 'X') {
        return -Infinity;
    } else {
        let score = 0;
        for (let i = 0; i < 9; i++) {
            const board = gameState.mainBoard[i];
            if (board.winner === 'O') {
                score += 100;
            } else if (board.winner === 'X') {
                score -= 100;
            } else {
                score += evaluateMiniBoard(board.cells);
            }
        }
        score += evaluateMainBoard(mainBoardState);
        return score;
    }
}

// Evalúa un mini-tablero
function evaluateMiniBoard(cells) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    let score = 0;
    for (let [a, b, c] of lines) {
        score += evaluateLine([cells[a], cells[b], cells[c]]);
    }
    return score;
}

// Evalúa el tablero principal
function evaluateMainBoard(mainBoardState) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    let score = 0;
    for (let [a, b, c] of lines) {
        score += evaluateMainLine([mainBoardState[a], mainBoardState[b], mainBoardState[c]]);
    }
    return score;
}

// Evalúa una línea en el mini-tablero
function evaluateLine(line) {
    let score = 0;
    if (line.filter(cell => cell === 'O').length === 3) {
        score += 10;
    } else if (line.filter(cell => cell === 'O').length === 2 && line.includes('')) {
        score += 5;
    } else if (line.filter(cell => cell === 'O').length === 1 && line.filter(cell => cell === '').length === 2) {
        score += 1;
    }
    if (line.filter(cell => cell === 'X').length === 3) {
        score -= 10;
    } else if (line.filter(cell => cell === 'X').length === 2 && line.includes('')) {
        score -= 5;
    } else if (line.filter(cell => cell === 'X').length === 1 && line.filter(cell => cell === '').length === 2) {
        score -= 1;
    }
    return score;
}

// Evalúa una línea en el tablero principal
function evaluateMainLine(line) {
    let score = 0;
    if (line.filter(cell => cell === 'O').length === 3) {
        score += 1000;
    } else if (line.filter(cell => cell === 'O').length === 2 && line.includes('')) {
        score += 100;
    } else if (line.filter(cell => cell === 'O').length === 1 && line.filter(cell => cell === '').length === 2) {
        score += 10;
    }
    if (line.filter(cell => cell === 'X').length === 3) {
        score -= 1000;
    } else if (line.filter(cell => cell === 'X').length === 2 && line.includes('')) {
        score -= 100;
    } else if (line.filter(cell => cell === 'X').length === 1 && line.filter(cell => cell === '').length === 2) {
        score -= 10;
    }
    return score;
}

// ==================== FUNCIONES DE AUDIO ====================

// Reproduce el sonido de colocar ficha
function playPlaceSound() {
    if (sfxEnabled) {
        placeSound.currentTime = 0;
        placeSound.play();
    }
}

// Reproduce el sonido de victoria
function playWinSound() {
    if (sfxEnabled) {
        winSound.currentTime = 0;
        winSound.play();
    }
}

// Reproduce el sonido de empate
function playDrawSound() {
    if (sfxEnabled) {
        drawSound.currentTime = 0;
        drawSound.play();
    }
}

// Reproduce el sonido de clic
function playClickSound() {
    if (sfxEnabled) {
        clickSound.currentTime = 0;
        clickSound.play();
    }
}

// Reproduce la música del menú principal
function playMainMenuBGM() {
    if (bgmEnabled) {
        mainMenuBGM.play();
    }
}

// Detiene la música del menú principal
function stopMainMenuBGM() {
    mainMenuBGM.pause();
    mainMenuBGM.currentTime = 0;
}

// Inicializa y reproduce una canción aleatoria
function initializeRandomSong() {
    currentSongIndex = Math.floor(Math.random() * songs.length);
    loadSong(currentSongIndex);
}

// Carga y reproduce una canción por índice
function loadSong(index) {
    audio.src = songs[index];
    document.getElementById('song-name').textContent = songs[index].split('/').pop();
    audio.load();
    if (bgmEnabled) {
        audio.play();
        isPlaying = true;
    }
}

// Cambia entre reproducir y pausar la música
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
}

// Reproduce la siguiente canción
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
}

// Reproduce la canción anterior
function previousSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
}

// Detiene la reproducción de música
function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
}

// Ajusta el volumen de la música
function setBGMVolume(volume) {
    audio.volume = volume;
    mainMenuBGM.volume = volume;
}

// ==================== FUNCIONES DE TEMPORIZADOR ====================

// Inicia el temporizador del juego
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isGamePaused) {
            const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
            const seconds = (timeElapsed % 60).toString().padStart(2, '0');
            document.getElementById('time-elapsed').textContent = `${minutes}:${seconds}`;
        }
    }, 1000);
}

// ==================== FUNCIONES DE INTERFAZ DE USUARIO ====================

// Muestra u oculta un elemento por su ID
function toggleDisplay(elementId, show) {
    document.getElementById(elementId).style.display = show ? 'block' : 'none';
}

// Muestra el modal de fin de juego
function showGameOverModal(message) {
    document.getElementById('game-over-message').textContent = message;
    toggleDisplay('game-over-modal', true);
}

// Muestra el modal de empate
function showDrawModal() {
    toggleDisplay('draw-modal', true);
}

// Oculta todos los modales
function hideAllModals() {
    const modals = ['draw-modal', 'game-over-modal', 'instructions-modal', 'pause-modal', 'ai-thinking-modal'];
    modals.forEach(modalId => toggleDisplay(modalId, false));
}

// Muestra el modal de IA pensando
function showAIThinkingModal() {
    toggleDisplay('ai-thinking-modal', true);
}

// Oculta el modal de IA pensando
function hideAIThinkingModal() {
    toggleDisplay('ai-thinking-modal', false);
}

// Muestra el modal de instrucciones
function showInstructions() {
    hidePauseModal();
    toggleDisplay('instructions-modal', true);
    playClickSound();
}

// Oculta el modal de instrucciones
function hideInstructions() {
    toggleDisplay('instructions-modal', false);
    if (isGamePaused) {
        showPauseModal();
    }
    playClickSound();
}

// Muestra el modal de pausa
function showPauseModal() {
    toggleDisplay('pause-modal', true);
}

// Oculta el modal de pausa
function hidePauseModal() {
    toggleDisplay('pause-modal', false);
}

// ==================== FUNCIONES DE PAUSA Y EVENTOS ====================

// Pausa el juego
function pauseGame() {
    if (!gameActive || isGamePaused) return;
    isGamePaused = true;
    clearInterval(timerInterval);
    showPauseModal();
}

// Reanuda el juego
function resumeGame() {
    if (!isGamePaused) return;
    isGamePaused = false;
    startTimer();
    hidePauseModal();
}

// Evento para detectar teclas y pausar/reanudar el juego
document.addEventListener('keydown', function(event) {
    if (['Escape', 'p', 'P', ' '].includes(event.key)) {
        if (!isGamePaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    }
});

// ==================== FUNCIONES AUXILIARES ====================

// Anima la colocación de una ficha en una celda
function animateCellPlacement(miniBoard, cellIndex) {
    const cellElement = document.getElementsByClassName('mini-board')[activeBoard || 0].children[cellIndex];
    const symbolSpan = document.createElement('span');
    symbolSpan.textContent = currentPlayer;
    symbolSpan.classList.add('new-symbol');
    cellElement.appendChild(symbolSpan);
    setTimeout(() => {
        symbolSpan.classList.remove('new-symbol');
    }, 500);
}

// Reinicia el estado del juego
function resetGameState() {
    clearInterval(timerInterval);
    isGamePaused = false;
    gameActive = false;
}

// ==================== FIN DEL SCRIPT ====================
