let gameMode = '';
let currentPlayer = 'X';
let mainBoard = [];
let activeBoard = null;
let gameActive = true;

function startGame(mode) {
    gameMode = mode;
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    initGame();
}

function exitGame() {
    window.close();
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
    } else if (isBoardFull(mainBoardState)) {
        gameActive = false;
        updateMessage('¡Es un empate!');
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
}

function cpuMove() {
    let boardIndex = activeBoard !== null ? activeBoard : getRandomBoardIndex();
    let cellIndex = getBestMove(mainBoard[boardIndex]);
    if (cellIndex === null) {
        boardIndex = getRandomBoardIndex();
        cellIndex = getBestMove(mainBoard[boardIndex]);
    }
    handleCellClick(boardIndex, cellIndex);
}

function getRandomBoardIndex() {
    const availableBoards = mainBoard
        .map((board, index) => board.winner || isBoardFull(board.cells) ? null : index)
        .filter(index => index !== null);
    return availableBoards[Math.floor(Math.random() * availableBoards.length)];
}

function getBestMove(board) {
    // Implementación básica de IA (Minimax simplificado)
    const cells = board.cells;
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] === '') {
            cells[i] = 'O';
            if (calculateWinner(cells) === 'O') {
                cells[i] = '';
                return i;
            }
            cells[i] = '';
        }
    }
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] === '') {
            cells[i] = 'X';
            if (calculateWinner(cells) === 'X') {
                cells[i] = '';
                return i;
            }
            cells[i] = '';
        }
    }
    const availableCells = cells
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    return availableCells.length > 0 ? availableCells[0] : null;
}
