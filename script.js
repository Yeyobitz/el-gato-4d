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

function showDifficulty(mode) {
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'block';
    playClickSound();
}

function startGame(mode, selectedDifficulty) {
    if (selectedDifficulty) {
        difficulty = selectedDifficulty;
    }
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    if (gameMode === 'cpu') {
        document.getElementById('score').style.display = 'block';
    } else {
        document.getElementById('score').style.display = 'none';
    }
    initGame();
    playClickSound();
}

function backToMainMenu() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('difficulty-menu').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('history-container').style.display = 'none';
    document.getElementById('highscore-container').style.display = 'none';
    playClickSound();
}

function exitGame() {
    // window.close(); // No funciona en navegadores por seguridad
    backToMainMenu();
}

function initGame() {
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
    document.getElementById('current-score').textContent = '0';
    drawBoard();
    updateMessage(`Turno de ${currentPlayer}`);
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
            miniBoardElement.style.backgroundColor = miniBoard.winner === 'X' ? '#0f0' : '#f00';
            miniBoardElement.innerHTML = `<span style="font-size:72px;">${miniBoard.winner}</span>`;
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
    if (!gameActive) return;
    if (activeBoard !== null && activeBoard !== boardIndex) {
        updateMessage(`Debes jugar en el tablero ${activeBoard + 1}`);
        return;
    }
    const miniBoard = mainBoard[boardIndex];
    if (miniBoard.cells[cellIndex] !== '') return;
    miniBoard.cells[cellIndex] = currentPlayer;
    moveCount++;
    playPlaceSound();
    checkMiniBoardWinner(miniBoard, boardIndex);
    activeBoard = mainBoard[cellIndex].winner || isBoardFull(mainBoard[cellIndex].cells) ? null : cellIndex;
    drawBoard();
    checkGameWinner();
    if (!gameActive) return;
    switchPlayer();
    updateMessage(`Turno de ${currentPlayer}`);
    if (gameMode === 'cpu' && currentPlayer === 'O') {
        setTimeout(cpuMove, 500);
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
        miniBoard.element.style.backgroundColor = winner === 'X' ? '#0f0' : '#f00';
        miniBoard.element.innerHTML = `<span style="font-size:72px;">${winner}</span>`;
    }
}

function checkGameWinner() {
    const mainBoardState = mainBoard.map(board => board.winner || '');
    const winner = calculateWinner(mainBoardState);
    if (winner) {
        gameActive = false;
        updateMessage(`¡${winner} ha ganado el juego!`);
        playWinSound();
        if (gameMode === 'cpu' && winner === 'X') {
            calculateScore();
            addToHistory(`Ganaste contra la CPU (${difficulty})`);
        } else if (gameMode === 'cpu' && winner === 'O') {
            addToHistory(`Perdiste contra la CPU (${difficulty})`);
        } else {
            addToHistory(`¡${winner} ha ganado!`);
        }
    } else if (isBoardFull(mainBoardState)) {
        gameActive = false;
        updateMessage('¡Es un empate!');
        playDrawSound();
        addToHistory('Empate');
    }
}

function isBoardFull(board) {
    return board.every(cell => cell !== '');
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
        return getRandomCellIndex(cells);
    } else if (difficultyLevel === 'medium') {
        return mediumAIMove(cells);
    } else {
        return minimax(cells, 'O').index;
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

// Funciones para sonidos
function playPlaceSound() {
    document.getElementById('place-sound').play();
}

function playWinSound() {
    document.getElementById('win-sound').play();
}

function playDrawSound() {
    document.getElementById('draw-sound').play();
}

function playClickSound() {
    document.getElementById('click-sound').play();
}

// Historial de partidas
function addToHistory(result) {
    history.push(result);
    updateHistory();
}

function updateHistory() {
    const historyContainer = document.getElementById('history-container');
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.forEach((result, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Partida ${index + 1}: ${result}`;
        historyList.appendChild(listItem);
    });
    historyContainer.style.display = 'block';
}

// Sistema de puntuación
function calculateScore() {
    const timeTaken = (Date.now() - gameStartTime) / 1000; // Tiempo en segundos
    const score = Math.max(10000 - (moveCount * 100 + timeTaken * 10), 0);
    document.getElementById('current-score').textContent = Math.round(score);
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
    // No mostramos el contenedor aquí para que solo se muestre cuando el usuario lo solicite
}

function showHighScores() {
    document.getElementById('main-menu').style.display = 'none';
    updateHighScores(); // Actualizamos la lista antes de mostrarla
    const highscoreContainer = document.getElementById('highscore-container');
    highscoreContainer.style.display = 'block';
    playClickSound();
}
