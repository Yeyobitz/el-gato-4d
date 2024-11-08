// Variables globales
let gameMode = '';
let difficulty = 'medium';
let currentPlayer = 'X';
let mainBoard = [];
let activeBoard = null;
let gameActive = true;
let history = [];
let highScores = [];
let moveCount = 0;
let gameStartTime = null;
let timerInterval = null;
let sfxEnabled = true;
let bgmEnabled = true;
let score = 0;
let formattedTime = '00:00';

// Variables para manejo de audio
let mainMenuBGM;
let gameBGM;
const songs = [
    'music/bgm/song1.mp3',
    'music/bgm/song2.mp3',
    'music/bgm/song3.mp3',
    'music/bgm/song4.mp3'
];

let currentSongIndex = 0;
let audio = new Audio();
let isPlaying = false;

window.onload = function() {
    // Main menu music setup
    mainMenuBGM = document.getElementById('bgm-main-menu');
    mainMenuBGM.src = 'music/main_menu.mp3';
    mainMenuBGM.loop = true;  // Main menu music should loop

    // Game music setup
    audio = new Audio();
    audio.addEventListener('ended', function() {
        nextSong();
    });

    // Start with main menu music
    playMainMenuBGM();
};

// Initialize the first random song
function initializeRandomSong() {
    currentSongIndex = Math.floor(Math.random() * songs.length);
    loadSong(currentSongIndex);
}

// Load and play the selected song
function loadSong(index) {
    audio.src = songs[index];
    document.getElementById('song-name').textContent = songs[index].split('/').pop(); // Display file name
    audio.load();
    audio.play();
    isPlaying = true;
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
}

// Play the next song
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
}

// Play the previous song
function previousSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
}

// Stop and reset audio when returning to main menu
function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
}

// Funciones de navegación y menú
function showDifficulty(mode) {
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'block';
    playClickSound();
}

// Initialize music when game starts
function startGame(mode, selectedDifficulty) {
    isGamePaused = false;
    if (selectedDifficulty) {
        difficulty = selectedDifficulty;
    }
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    playClickSound();
    stopMainMenuBGM();
    initializeRandomSong(); // Start a random song when the game begins
    initGame();
}

function handleWinningGame(winner) {
    gameActive = false;
    clearInterval(timerInterval);
    calculateScore();
    
    if (winner === 'empate') {
        playDrawSound();
        showGameOverModal('¡Es un empate!');
    } else {
        playWinSound();
        showGameOverModal(`${winner} ha ganado el juego`);
    }
}

function backToMainMenu() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('highscore-container').style.display = 'none';
    document.getElementById('draw-modal').style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('instructions-modal').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('pause-modal').style.display = 'none';
    clearInterval(timerInterval);
    playClickSound();
    stopAudio();  // Stop game music
    playMainMenuBGM();  // Start menu music
}

function exitGame() {
    // No se puede cerrar la ventana en navegadores por seguridad
    backToMainMenu();
}

// Funciones del juego
function initGame() {
    isGamePaused = false;
    document.getElementById('game-over-modal').style.display = 'none';
    
    mainBoard = [];
    for (let i = 0; i < 9; i++) {
        mainBoard.push({
            cells: Array(9).fill(''),
            element: null,
            winner: null
        });
    }
    activeBoard = null;
    gameActive = true;
    currentPlayer = 'X';
    moveCount = 0;
    gameStartTime = Date.now();
    score = 0;
    formattedTime = '00:00';
    document.getElementById('score').style.display = 'none';
    document.getElementById('current-score').textContent = '0';
    document.getElementById('time-elapsed').textContent = '00:00';
    document.getElementById('game-over-modal').style.display = 'none';
    startTimer();
    drawBoard();
    updateMessage(`Turno de ${currentPlayer}`);
}

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
            miniBoard.cells.forEach((cell, cellIndex) => {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                if (cell !== '') {
                    cellElement.innerHTML = `<span>${cell}</span>`;
                    cellElement.classList.add('disabled');
                }
                if (gameActive && (activeBoard === index || activeBoard === null) && cell === '') {
                    cellElement.addEventListener('click', () => handleCellClick(index, cellIndex));
                } else {
                    cellElement.classList.add('disabled');
                }
                miniBoardElement.appendChild(cellElement);
            });
        }
        boardElement.appendChild(miniBoardElement);
        miniBoard.element = miniBoardElement;
    });
}

function handleCellClick(boardIndex, cellIndex) {
    if (!gameActive || isGamePaused) return; // Añade isGamePaused aquí
    if (activeBoard !== null && activeBoard !== boardIndex) {
        updateMessage(`Debes jugar en el tablero ${activeBoard + 1}`);
        return;
    }
    const miniBoard = mainBoard[boardIndex];
    if (miniBoard.cells[cellIndex] !== '') return;
    miniBoard.cells[cellIndex] = currentPlayer;
    moveCount++;
    playPlaceSound();

    const cellElement = miniBoard.element.children[cellIndex];
    const symbolSpan = document.createElement('span');
    symbolSpan.textContent = currentPlayer;
    symbolSpan.classList.add('new-symbol');
    cellElement.appendChild(symbolSpan);

    // Remove the 'new-symbol' class after the animation completes
    setTimeout(() => {
        symbolSpan.classList.remove('new-symbol');
    }, 500);

    checkMiniBoardWinner(miniBoard, boardIndex);
    activeBoard = mainBoard[cellIndex].winner || isBoardFull(mainBoard[cellIndex].cells) ? null : cellIndex;
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
        showAIThinkingModal();
        setTimeout(() => {
            cpuMove();
            hideAIThinkingModal();
        }, 3000); // 3000 milisegundos = 3 segundos
    }
}
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

function updateMessage(message) {
    document.getElementById('message').textContent = message;
}

function checkMiniBoardWinner(miniBoard, index) {
    const winner = calculateWinner(miniBoard.cells);
    if (winner) {
        miniBoard.winner = winner;
        miniBoard.element.classList.add(`winner-${winner}`);
        miniBoard.element.innerHTML = `<span>${winner}</span>`; // Centrado
    }
}

function checkGameWinner() {
    const mainBoardState = mainBoard.map(board => board.winner || '');
    const winner = calculateWinner(mainBoardState);
    
    if (winner) {
        handleWinningGame(winner);
    } else if (isBoardFull(mainBoardState)) {
        const countX = mainBoardState.filter(cell => cell === 'X').length;
        const countO = mainBoardState.filter(cell => cell === 'O').length;
        
        let finalWinner;
        if (countX > countO) {
            finalWinner = 'X';
        } else if (countO > countX) {
            finalWinner = 'O';
        } else {
            finalWinner = 'empate';
        }
        
        handleWinningGame(finalWinner);
    }
}

function handleWinningGame(winner) {
    gameActive = false;
    clearInterval(timerInterval);
    calculateScore();
    
    if (winner === 'empate') {
        playDrawSound();
        showGameOverModal('¡Es un empate!');
        addToHistory('Empate', Math.round(score), formattedTime);
    } else {
        playWinSound();
        showGameOverModal(`${winner} ha ganado el juego`);
        addToHistory(`${winner} ha ganado`, Math.round(score), formattedTime);
    }
}


function isBoardFull(board) {
    return board.every(cell => cell !== '');
}

function isDrawImminent() {
    // Comprueba si no hay posibilidades de ganar para ninguno
    const mainBoardState = mainBoard.map(board => board.winner || '');
    const availableBoards = mainBoard.filter(board => !board.winner && !isBoardFull(board.cells));

    if (availableBoards.length === 0 && !calculateWinner(mainBoardState)) {
        return true;
    }
    return false;
}

function showDrawModal() {
    const modal = document.getElementById('draw-modal');
    modal.style.display = 'block';
}

function showGameOverModal(message) {
    const modal = document.getElementById('game-over-modal');
    const messageElement = document.getElementById('game-over-message');
    const detailsElement = document.getElementById('game-over-details');

    messageElement.textContent = message;
    detailsElement.innerHTML = `Puntuación: ${Math.round(score)}<br>Tiempo: ${formattedTime}`;

    modal.style.display = 'block';
}

function retryGame() {
    document.getElementById('draw-modal').style.display = 'none';
    resetGame();
}

function calculateWinner(cells) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8], // Filas
        [0,3,6], [1,4,7], [2,5,8], // Columnas
        [0,4,8], [2,4,6]           // Diagonales
    ];
    for (let line of lines) {
        const [a,b,c] = line;
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            return cells[a];
        }
    }
    return null;
}

function resetGame() {
    clearInterval(timerInterval);
    initGame();
    playClickSound();
}

function cpuMove() {
    let boardIndex = activeBoard !== null ? activeBoard : getRandomBoardIndex();
    let cellIndex = getBestMove(mainBoard[boardIndex], difficulty);
    if (cellIndex === null) {
        boardIndex = getRandomBoardIndex();
        cellIndex = getBestMove(mainBoard[boardIndex], difficulty);
    }
    handleCellClick(boardIndex, cellIndex);
}

function getRandomBoardIndex() {
    const availableBoards = mainBoard
        .map((board, index) => board.winner || isBoardFull(board.cells) ? null : index)
        .filter(index => index !== null);
    return availableBoards[Math.floor(Math.random() * availableBoards.length)];
}

function getBestMove(board, difficultyLevel) {
    const cells = board.cells.slice();
    if (difficultyLevel === 'easy') {
        return mediumAIMove(cells);
    } else if (difficultyLevel === 'medium') {
        return minimax(cells, 'O').index;
    } else {
        return advancedAIMove(cells, 3); // Profundidad de 3
    }
}

function getRandomCellIndex(cells) {
    const availableCells = cells
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    return availableCells.length > 0 ? availableCells[Math.floor(Math.random() * availableCells.length)] : null;
}

function mediumAIMove(cells) {
    // 50% de probabilidad de hacer el mejor movimiento
    if (Math.random() > 0.5) {
        return minimax(cells, 'O').index;
    } else {
        return getRandomCellIndex(cells);
    }
}

function minimax(newBoard, player) {
    const availSpots = newBoard
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);

    if (calculateWinner(newBoard) === 'X') {
        return { score: -10 };
    } else if (calculateWinner(newBoard) === 'O') {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

function advancedAIMove(cells, depth) {
    const bestMove = minimaxAlphaBeta(cells, depth, -Infinity, Infinity, true);
    return bestMove.index;
}

function minimaxAlphaBeta(board, depth, alpha, beta, isMaximizingPlayer) {
    const availSpots = board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);

    const winner = calculateWinner(board);
    if (winner === 'O') {
        return { score: 100 - depth };
    } else if (winner === 'X') {
        return { score: -100 + depth };
    } else if (availSpots.length === 0 || depth === 0) {
        return { score: evaluateBoard(board) };
    }

    let bestMove;
    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (let i = 0; i < availSpots.length; i++) {
            const index = availSpots[i];
            board[index] = 'O';
            const eval = minimaxAlphaBeta(board, depth - 1, alpha, beta, false).score;
            board[index] = '';
            if (eval > maxEval) {
                maxEval = eval;
                bestMove = { index, score: maxEval };
            }
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return bestMove || { score: maxEval };
    } else {
        let minEval = Infinity;
        for (let i = 0; i < availSpots.length; i++) {
            const index = availSpots[i];
            board[index] = 'X';
            const eval = minimaxAlphaBeta(board, depth - 1, alpha, beta, true).score;
            board[index] = '';
            if (eval < minEval) {
                minEval = eval;
                bestMove = { index, score: minEval };
            }
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return bestMove || { score: minEval };
    }
}

function evaluateBoard(board) {
    // Evaluamos el tablero según la cantidad de líneas potenciales
    const lines = [
        [0,1,2], [3,4,5], [6,7,8], // Filas
        [0,3,6], [1,4,7], [2,5,8], // Columnas
        [0,4,8], [2,4,6]           // Diagonales
    ];
    let score = 0;

    for (let line of lines) {
        let [a, b, c] = line;
        let lineValues = [board[a], board[b], board[c]];

        score += evaluateLine(lineValues);
    }
    return score;
}

function evaluateLine(line) {
    let score = 0;

    if (line.filter(cell => cell === 'O').length === 3) {
        score += 100;
    } else if (line.filter(cell => cell === 'O').length === 2 && line.includes('')) {
        score += 10;
    } else if (line.filter(cell => cell === 'O').length === 1 && line.filter(cell => cell === '').length === 2) {
        score += 1;
    }

    if (line.filter(cell => cell === 'X').length === 3) {
        score -= 100;
    } else if (line.filter(cell => cell === 'X').length === 2 && line.includes('')) {
        score -= 10;
    } else if (line.filter(cell => cell === 'X').length === 1 && line.filter(cell => cell === '').length === 2) {
        score -= 1;
    }

    return score;
}

function getRandomCellIndex(cells) {
    const availableCells = cells
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    return availableCells.length > 0 ? availableCells[Math.floor(Math.random() * availableCells.length)] : null;
}

// Funciones para sonidos
function playPlaceSound() {
    if (sfxEnabled) {
        const sound = document.getElementById('place-sound');
        sound.currentTime = 0;
        sound.play();
    }
}

function playWinSound() {
    if (sfxEnabled) {
        const sound = document.getElementById('win-sound');
        sound.currentTime = 0;
        sound.play();
    }
}

function playDrawSound() {
    if (sfxEnabled) {
        const sound = document.getElementById('draw-sound');
        sound.currentTime = 0;
        sound.play();
    }
}

function playClickSound() {
    if (sfxEnabled) {
        const sound = document.getElementById('click-sound');
        sound.currentTime = 0;
        sound.play();
    }
}


// Sistema de puntuación
function calculateScore() {
    const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const seconds = (timeElapsed % 60).toString().padStart(2, '0');
    formattedTime = `${minutes}:${seconds}`;

    score = Math.max(10000 - (moveCount * 100 + timeElapsed * 10), 0);
    document.getElementById('current-score').textContent = Math.round(score);
    document.getElementById('score').style.display = 'block'; // Mostramos el puntaje al final
    saveHighScore(score);
}

function saveHighScore(score) {
    highScores.push(Math.round(score));
    highScores.sort((a, b) => b - a);
    if (highScores.length > 10) {
        highScores = highScores.slice(0, 10);
    }
    updateHighScores();
}

function updateHighScores() {
    const highscoreContainer = document.getElementById('highscore-container');
    const highscoreList = document.getElementById('highscore-list');
    highscoreList.innerHTML = '';
    highScores.forEach((score, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `#${index + 1}: ${score} puntos`;
        highscoreList.appendChild(listItem);
    });
}

function showHighScores() {
    document.getElementById('main-menu').style.display = 'none';
    updateHighScores(); // Actualizamos la lista antes de mostrarla
    const highscoreContainer = document.getElementById('highscore-container');
    highscoreContainer.style.display = 'block';
    playClickSound();
}

// Funciones para manejar BGM
function playMainMenuBGM() {
    mainMenuBGM.play();
}

function stopMainMenuBGM() {
    mainMenuBGM.pause();
    mainMenuBGM.currentTime = 0;
}


function stopGameBGM() {
    gameBGM.pause();
    gameBGM.currentTime = 0;
}


function showAIThinkingModal() {
    const modal = document.getElementById('ai-thinking-modal');
    modal.style.display = 'block';
}

function hideAIThinkingModal() {
    const modal = document.getElementById('ai-thinking-modal');
    modal.style.display = 'none';
}

function showInstructions() {
    // ocultar el modal de pausa si está abierto
    hidePauseModal();
    const modal = document.getElementById('instructions-modal');
    modal.style.display = 'block';

    playClickSound(); // Opcional: Si tienes una función para el sonido de clic
}

function hideInstructions() {
    const modal = document.getElementById('instructions-modal');
    modal.style.display = 'none';
    playClickSound(); // Opcional: Si tienes una función para el sonido de clic
}

// Cerrar el modal al hacer clic fuera del contenido
window.onclick = function(event) {
    const modal = document.getElementById('instructions-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Variable para controlar si el juego está en pausa
let isGamePaused = false;

// Función para pausar el juego
function pauseGame() {
    if (!gameActive || isGamePaused) return;
    isGamePaused = true;
    clearInterval(timerInterval); // Pausar el temporizador si es necesario
    showPauseModal();
}

// Función para reanudar el juego
function resumeGame() {
    if (!isGamePaused) return;
    isGamePaused = false;
    startTimer(); // Reanudar el temporizador si es necesario
    hidePauseModal();
}

// Mostrar el modal de pausa
function showPauseModal() {
    const modal = document.getElementById('pause-modal');
    modal.style.display = 'block';
}

// Ocultar el modal de pausa
function hidePauseModal() {
    const modal = document.getElementById('pause-modal');
    modal.style.display = 'none';
}

// Evento para detectar las teclas Esc, P o Espacio
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P' || event.key === ' ') {
        if (!isGamePaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    }
});

// Función para ajustar el volumen de la música
function setBGMVolume(volume) {
    // Set the volume for the current background music
    if (gameBGM) {
        gameBGM.volume = volume;
    }
}
