// ==================== VARIABLES GLOBALES ====================

// Estado del juego
let pauseStartTime = null;
let totalPausedTime = 0;
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
    try {
        mainMenuBGM = document.getElementById('bgm-main-menu');
        placeSound = document.getElementById('place-sound');
        winSound = document.getElementById('win-sound');
        drawSound = document.getElementById('draw-sound');
        clickSound = document.getElementById('click-sound');

        if (mainMenuBGM) {
            mainMenuBGM.loop = true;
        } else {
            console.error("Elemento 'bgm-main-menu' no encontrado.");
        }

        audio.addEventListener('ended', nextSong);
    } catch (error) {
        console.error("Error en setupAudioElements:", error);
    }
}

// ==================== FUNCIONES DE NAVEGACIÓN Y MENÚ ====================

// Muestra el menú de selección de dificultad
function showDifficulty(mode) {
    try {
        gameMode = mode;
        toggleDisplay('main-menu', false);
        toggleDisplay('difficulty-menu', true);
        playClickSound();
    } catch (error) {
        console.error("Error en showDifficulty:", error);
    }
}

// Inicia el juego con el modo y dificultad seleccionados
function startGame(mode, selectedDifficulty) {
    try {
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
    } catch (error) {
        console.error("Error en startGame:", error);
    }
}

// Regresa al menú principal y reinicia el estado del juego
function backToMainMenu() {
    try {
        hideAllModals();
        toggleDisplay('game-container', false);
        toggleDisplay('main-menu', true);
        toggleDisplay('difficulty-menu', false);
        resetGameState();
        playClickSound();
        stopAudio();
        playMainMenuBGM();
    } catch (error) {
        console.error("Error en backToMainMenu:", error);
    }
}

// ==================== FUNCIONES DEL JUEGO ====================

// Inicializa el estado del juego
function initGame() {
    try {
        isGamePaused = false;
        gameActive = true;
        currentPlayer = 'X';
        moveCount = 0;
        activeBoard = null;
        hideAllModals();
        gameStartTime = Date.now();
        const timeElement = document.getElementById('time-elapsed');
        if (timeElement) {
            timeElement.textContent = '00:00';
        }
        mainBoard = Array(9).fill(null).map(() => ({
            cells: Array(9).fill(''),
            winner: null
        }));
        startTimer();
        drawBoard();
        updateMessage(`Turno de ${currentPlayer}`);
        updateBodyClass(); 
    } catch (error) {
        console.error("Error en initGame:", error);
    }
}

// Dibuja el tablero principal y los mini-tableros
function drawBoard() {
    try {
        const boardElement = document.getElementById('board');
        if (!boardElement) {
            console.error("Elemento 'board' no encontrado.");
            return;
        }
        boardElement.innerHTML = '';

        mainBoard.forEach((miniBoard, boardIndex) => {
            const miniBoardElement = document.createElement('div');
            miniBoardElement.classList.add('mini-board');

            // Determinar si el mini-tablero está activo
            const isActiveBoard = activeBoard === boardIndex || activeBoard === null;

            if (isActiveBoard) {
                miniBoardElement.classList.add('active');
            } else {
                miniBoardElement.classList.add('locked'); 
            }

            if (miniBoard.winner) {
                miniBoardElement.classList.add(`winner-${miniBoard.winner}`);
                miniBoardElement.innerHTML = `<span>${miniBoard.winner}</span>`;
            } else {
                drawMiniBoardCells(miniBoard, miniBoardElement, boardIndex, isActiveBoard);
            }
            boardElement.appendChild(miniBoardElement);
        });
    } catch (error) {
        console.error("Error en drawBoard:", error);
    }
}


// Dibuja las celdas de un mini-tablero
function drawMiniBoardCells(miniBoard, miniBoardElement, boardIndex, isActiveBoard) {
    try {
        miniBoard.cells.forEach((cell, cellIndex) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');

            if (cell !== '') {
                cellElement.innerHTML = `<span>${cell}</span>`;
                cellElement.classList.add('disabled', 'locked'); // Añade 'locked' para celdas ocupadas
            } else if (gameActive && isActiveBoard) {
                cellElement.classList.add(`player-${currentPlayer}`); // Añade la clase del jugador
                cellElement.addEventListener('click', () => handleCellClick(boardIndex, cellIndex));
            } else {
                cellElement.classList.add('disabled', 'locked'); // Añade 'locked' para celdas inactivas
            }
            miniBoardElement.appendChild(cellElement);
        });
    } catch (error) {
        console.error("Error en drawMiniBoardCells:", error);
    }
}


// Maneja el evento de clic en una celda
function handleCellClick(boardIndex, cellIndex) {
    try {
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
        switchPlayer();
        drawBoard();
        checkGameWinner();
        if (!gameActive) return;
        if (isDrawImminent()) {
            gameActive = false;
            clearInterval(timerInterval);
            showDrawModal();
            return;
        }
        updateMessage(`Turno de ${currentPlayer}`);
        if (gameMode === 'cpu' && currentPlayer === 'O') {
            cpuMove();
        }
    } catch (error) {
        console.error("Error en handleCellClick:", error);
    }
}


// Cambia al siguiente jugador
function switchPlayer() {
    try {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateBodyClass(); 
    } catch (error) {
        console.error("Error en switchPlayer:", error);
    }
}

// Actualiza el body según el jugador actual
function updateBodyClass() {
    const body = document.body;
    body.classList.remove('player-X', 'player-O');
    body.classList.add(`player-${currentPlayer}`);
}

// Actualiza el mensaje de estado del juego
function updateMessage(message) {
    try {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = message;
        } else {
            console.error("Elemento 'message' no encontrado.");
        }
    } catch (error) {
        console.error("Error en updateMessage:", error);
    }
}

// Verifica si hay un ganador en el mini-tablero
function checkMiniBoardWinner(miniBoard, boardIndex) {
    try {
        const winner = calculateWinner(miniBoard.cells);
        if (winner) {
            miniBoard.winner = winner;
        }
    } catch (error) {
        console.error("Error en checkMiniBoardWinner:", error);
    }
}

// Actualiza el tablero activo basado en el último movimiento
function updateActiveBoard(cellIndex) {
    try {
        const nextBoard = mainBoard[cellIndex];
        activeBoard = nextBoard.winner || isBoardFull(nextBoard.cells) ? null : cellIndex;
    } catch (error) {
        console.error("Error en updateActiveBoard:", error);
    }
}

// Verifica si hay un ganador en el juego principal
function checkGameWinner() {
    try {
        const mainBoardState = mainBoard.map(board => board.winner || '');
        const winner = calculateWinner(mainBoardState);

        if (winner) {
            handleGameOver(`${winner} ha ganado el juego`);
        } else if (mainBoardState.every(cell => cell !== '')) {
            handleGameOver('¡Es un empate!');
        }
    } catch (error) {
        console.error("Error en checkGameWinner:", error);
    }
}

// Maneja el final del juego
function handleGameOver(message) {
    try {
        gameActive = false;
        clearInterval(timerInterval);
        playWinSound();
        showGameOverModal(message);
    } catch (error) {
        console.error("Error en handleGameOver:", error);
    }
}

// Calcula si hay un ganador en un conjunto de celdas
function calculateWinner(cells) {
    try {
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
    } catch (error) {
        console.error("Error en calculateWinner:", error);
        return null;
    }
}

// Verifica si un tablero está lleno
function isBoardFull(cells) {
    try {
        return cells.every(cell => cell !== '');
    } catch (error) {
        console.error("Error en isBoardFull:", error);
        return false;
    }
}

// Verifica si el empate es inminente
function isDrawImminent() {
    try {
        const mainBoardState = mainBoard.map(board => board.winner || '');
        const availableBoards = mainBoard.filter(board => !board.winner && !isBoardFull(board.cells));
        return availableBoards.length === 0 && !calculateWinner(mainBoardState);
    } catch (error) {
        console.error("Error en isDrawImminent:", error);
        return false;
    
}
}
// Reinicia el juego
function resetGame() {
    try {
        clearInterval(timerInterval);
        resetGameState();
        playClickSound();
        initGame();
        initializeRandomSong();
    } catch (error) {
        console.error("Error en resetGame:", error);
    }
}

// ==================== FUNCIONES DE IA ====================

// Realiza el movimiento de la IA
function cpuMove() {
    try {
        showAIThinkingModal();
        const thinkingTime = Math.random() * 1000 + 2000; // Random time between 2000ms - 3000ms

        setTimeout(() => {
            hideAIThinkingModal();

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

                let move = result.move;

                if (!move) {
                    // Si Minimax no encuentra un movimiento, seleccionar uno al azar
                    const possibleMoves = generatePossibleMoves(gameState);
                    if (possibleMoves.length > 0) {
                        move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    } else {
                        // No hay movimientos posibles; manejar el fin del juego
                        if (isGameOver(gameState)) {
                            const mainBoardState = mainBoard.map(board => board.winner || '');
                            const winner = calculateWinner(mainBoardState);
                            if (winner) {
                                handleGameOver(`${winner} ha ganado el juego`);
                            } else {
                                handleGameOver('¡Es un empate!');
                            }
                        }
                        return;
                    }
                }

                if (move) {
                    handleCellClick(move.boardIndex, move.cellIndex);
                }

            }, 500); // 0.5 seconds delay before CPU makes its move

        }, thinkingTime);

    } catch (error) {
        console.error("Error en cpuMove:", error);
    }
}



// Obtiene la profundidad de búsqueda basada en la dificultad
function getDepthByDifficulty() {
    try {
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
    } catch (error) {
        console.error("Error en getDepthByDifficulty:", error);
        return 2;
    }
}

// Implementación del algoritmo Minimax con poda alfa-beta
function minimaxGame(gameState, depth, alpha, beta, isMaximizingPlayer) {
    try {
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
    } catch (error) {
        console.error("Error en minimaxGame:", error);
        return { score: 0, move: null };
    }
}

// Genera todos los movimientos posibles en el estado actual del juego
function generatePossibleMoves(gameState) {
    try {
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
    } catch (error) {
        console.error("Error en generatePossibleMoves:", error);
        return [];
    }
}

// Obtiene los movimientos posibles para un mini-tablero específico
function getMovesForBoard(gameState, boardIndex) {
    try {
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
    } catch (error) {
        console.error("Error en getMovesForBoard:", error);
        return [];
    }
}

// Aplica un movimiento y devuelve un nuevo estado del juego
function applyMove(gameState, move) {
    try {
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
    } catch (error) {
        console.error("Error en applyMove:", error);
        return gameState;
    }
}

// Verifica si el juego ha terminado
function isGameOver(gameState) {
    try {
        const mainBoardState = gameState.mainBoard.map(board => board.winner || '');
        return calculateWinner(mainBoardState) || mainBoardState.every(cell => cell !== '');
    } catch (error) {
        console.error("Error en isGameOver:", error);
        return false;
    }
}

// Evalúa el estado del juego para la IA
function evaluateGameState(gameState) {
    try {
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
    } catch (error) {
        console.error("Error en evaluateGameState:", error);
        return 0;
    }
}

// Evalúa un mini-tablero
function evaluateMiniBoard(cells) {
    try {
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
    } catch (error) {
        console.error("Error en evaluateMiniBoard:", error);
        return 0;
    }
}

// Evalúa el tablero principal
function evaluateMainBoard(mainBoardState) {
    try {
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
    } catch (error) {
        console.error("Error en evaluateMainBoard:", error);
        return 0;
    }
}

// Evalúa una línea en el mini-tablero
function evaluateLine(line) {
    try {
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
    } catch (error) {
        console.error("Error en evaluateLine:", error);
        return 0;
    }
}

// Evalúa una línea en el tablero principal
function evaluateMainLine(line) {
    try {
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
    } catch (error) {
        console.error("Error en evaluateMainLine:", error);
        return 0;
    }
}

// ==================== FUNCIONES DE AUDIO ====================

// Reproduce el sonido de colocar ficha
function playPlaceSound() {
    try {
        if (sfxEnabled && placeSound) {
            placeSound.currentTime = 0;
            placeSound.play();
        }
    } catch (error) {
        console.error("Error en playPlaceSound:", error);
    }
}

// Reproduce el sonido de victoria
function playWinSound() {
    try {
        if (sfxEnabled && winSound) {
            winSound.currentTime = 0;
            winSound.play();
        }
    } catch (error) {
        console.error("Error en playWinSound:", error);
    }
}

// Reproduce el sonido de empate
function playDrawSound() {
    try {
        if (sfxEnabled && drawSound) {
            drawSound.currentTime = 0;
            drawSound.play();
        }
    } catch (error) {
        console.error("Error en playDrawSound:", error);
    }
}

// Reproduce el sonido de clic
function playClickSound() {
    try {
        if (sfxEnabled && clickSound) {
            clickSound.currentTime = 0;
            clickSound.play();
        }
    } catch (error) {
        console.error("Error en playClickSound:", error);
    }
}

// Reproduce la música del menú principal
function playMainMenuBGM() {
    try {
        if (bgmEnabled && mainMenuBGM) {
            mainMenuBGM.play();
        }
    } catch (error) {
        console.error("Error en playMainMenuBGM:", error);
    }
}

// Detiene la música del menú principal
function stopMainMenuBGM() {
    try {
        if (mainMenuBGM) {
            mainMenuBGM.pause();
            mainMenuBGM.currentTime = 0;
        }
    } catch (error) {
        console.error("Error en stopMainMenuBGM:", error);
    }
}

// Inicializa y reproduce una canción aleatoria
function initializeRandomSong() {
    try {
        currentSongIndex = Math.floor(Math.random() * songs.length);
        loadSong(currentSongIndex);
    } catch (error) {
        console.error("Error en initializeRandomSong:", error);
    }
}

// Carga y reproduce una canción por índice
function loadSong(index) {
    try {
        if (songs[index]) {
            audio.src = songs[index];
            const songNameElement = document.getElementById('song-name');
            if (songNameElement) {
                songNameElement.textContent = songs[index].split('/').pop();
            }
            audio.load();
            if (bgmEnabled) {
                audio.play();
                isPlaying = true;
            }
        } else {
            console.error("Canción no encontrada en el índice:", index);
        }
    } catch (error) {
        console.error("Error en loadSong:", error);
    }
}

// Cambia entre reproducir y pausar la música
function togglePlayPause() {
    try {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        isPlaying = !isPlaying;
    } catch (error) {
        console.error("Error en togglePlayPause:", error);
    }
}

// Reproduce la siguiente canción
function nextSong() {
    try {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
    } catch (error) {
        console.error("Error en nextSong:", error);
    }
}

// Reproduce la canción anterior
function previousSong() {
    try {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
    } catch (error) {
        console.error("Error en previousSong:", error);
    }
}

// Detiene la reproducción de música
function stopAudio() {
    try {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
    } catch (error) {
        console.error("Error en stopAudio:", error);
    }
}

// Ajusta el volumen de la música
function setBGMVolume(volume) {
    try {
        audio.volume = volume;
        if (mainMenuBGM) {
            mainMenuBGM.volume = volume;
        }
    } catch (error) {
        console.error("Error en setBGMVolume:", error);
    }
}

// ==================== FUNCIONES DE TEMPORIZADOR ====================

// Inicia el temporizador del juego
function startTimer() {
    try {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isGamePaused) {
                const currentTime = Date.now();
                const timeElapsed = Math.floor((currentTime - gameStartTime - totalPausedTime) / 1000);
                const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
                const seconds = (timeElapsed % 60).toString().padStart(2, '0');
                const timeElement = document.getElementById('time-elapsed');
                if (timeElement) {
                    timeElement.textContent = `${minutes}:${seconds}`;
                }
            }
        }, 1000);
    } catch (error) {
        console.error("Error en startTimer:", error);
    }
}


// ==================== FUNCIONES DE INTERFAZ DE USUARIO ====================

// Muestra u oculta un elemento por su ID
function toggleDisplay(elementId, show) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        } else {
            console.error(`Elemento '${elementId}' no encontrado.`);
        }
    } catch (error) {
        console.error("Error en toggleDisplay:", error);
    }
}

// Muestra el modal de fin de juego
function showGameOverModal(message) {
    try {
        const messageElement = document.getElementById('game-over-message');
        if (messageElement) {
            messageElement.textContent = message;
        } else {
            console.error("Elemento 'game-over-message' no encontrado.");
        }
        toggleDisplay('game-over-modal', true);
    } catch (error) {
        console.error("Error en showGameOverModal:", error);
    }
}

// Muestra el modal de empate
function showDrawModal() {
    try {
        toggleDisplay('draw-modal', true);
    } catch (error) {
        console.error("Error en showDrawModal:", error);
    }
}

// Oculta todos los modales
function hideAllModals() {
    try {
        const modals = ['draw-modal', 'game-over-modal', 'instructions-modal', 'pause-modal', 'ai-thinking-modal'];
        modals.forEach(modalId => toggleDisplay(modalId, false));
    } catch (error) {
        console.error("Error en hideAllModals:", error);
    }
}

// Muestra el modal de IA pensando
function showAIThinkingModal() {
    try {
        toggleDisplay('ai-thinking-modal', true);
    } catch (error) {
        console.error("Error en showAIThinkingModal:", error);
    }
}

// Oculta el modal de IA pensando
function hideAIThinkingModal() {
    try {
        toggleDisplay('ai-thinking-modal', false);
    } catch (error) {
        console.error("Error en hideAIThinkingModal:", error);
    }
}

// Muestra el modal de instrucciones
function showInstructions() {
    try {
        hidePauseModal();
        toggleDisplay('instructions-modal', true);
        playClickSound();
    } catch (error) {
        console.error("Error en showInstructions:", error);
    }
}

// Oculta el modal de instrucciones
function hideInstructions() {
    try {
        toggleDisplay('instructions-modal', false);
        if (isGamePaused) {
            showPauseModal();
        }
        playClickSound();
    } catch (error) {
        console.error("Error en hideInstructions:", error);
    }
}

// Muestra el modal de pausa
function showPauseModal() {
    try {
        toggleDisplay('pause-modal', true);
    } catch (error) {
        console.error("Error en showPauseModal:", error);
    }
}

// Oculta el modal de pausa
function hidePauseModal() {
    try {
        toggleDisplay('pause-modal', false);
    } catch (error) {
        console.error("Error en hidePauseModal:", error);
    }
}

// ==================== FUNCIONES DE PAUSA Y EVENTOS ====================

// Pausa el juego
function pauseGame() {
    try {
        if (!gameActive || isGamePaused) return;
        isGamePaused = true;
        pauseStartTime = Date.now();
        clearInterval(timerInterval);
        showPauseModal();
    } catch (error) {
        console.error("Error en pauseGame:", error);
    }
}


// Reanuda el juego
function resumeGame() {
    try {
        if (!isGamePaused) return;
        totalPausedTime += Date.now() - pauseStartTime;
        isGamePaused = false;
        startTimer();
        hidePauseModal();
    } catch (error) {
        console.error("Error en resumeGame:", error);
    }
}

// Evento para detectar teclas y pausar/reanudar el juego
document.addEventListener('keydown', function(event) {
    try {
        if (['Escape', 'p', 'P', ' '].includes(event.key)) {
            if (!isGamePaused) {
                pauseGame();
            } else {
                resumeGame();
            }
        }
    } catch (error) {
        console.error("Error en eventListener de keydown:", error);
    }
});

// ==================== FUNCIONES AUXILIARES ====================

// Anima la colocación de una ficha en una celda
function animateCellPlacement(miniBoard, cellIndex) {
    try {
        const miniBoards = document.getElementsByClassName('mini-board');
        const activeMiniBoard = miniBoards[activeBoard || 0];
        if (!activeMiniBoard) return;
        const cellElements = activeMiniBoard.children;
        const cellElement = cellElements[cellIndex];
        if (!cellElement) return;
        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = currentPlayer;
        symbolSpan.classList.add('new-symbol');
        cellElement.appendChild(symbolSpan);
        setTimeout(() => {
            symbolSpan.classList.remove('new-symbol');
        }, 500);
    } catch (error) {
        console.error("Error en animateCellPlacement:", error);
    }
}

// Reinicia el estado del juego
function resetGameState() {
    try {
        clearInterval(timerInterval);
        isGamePaused = false;
        gameActive = false;
        gameStartTime = null; 
        currentPlayer = 'X';  
        moveCount = 0;
        activeBoard = null;   
    } catch (error) {
        console.error("Error en resetGameState:", error);
    }
}

// ==================== FIN DEL SCRIPT ====================
