// Importa las funciones que necesitas de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJ28WLzSlja8PvLlWIRACVCq8c3ZMc7Aw",
  authDomain: "multiuniversalgato.firebaseapp.com",
  projectId: "multiuniversalgato",
  storageBucket: "multiuniversalgato.firebasestorage.app",
  messagingSenderId: "82793408721",
  appId: "1:82793408721:web:956d91d8e4776d0468fdf0"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);

// Función para enviar el puntaje a Firestore
async function enviarPuntaje(alias, tiempo, movimientos, dificultad) {
    try {
      const fecha = Timestamp.now();
      await addDoc(collection(db, "rankings"), {
        alias: alias,
        tiempo: tiempo, // tiempo en segundos
        movimientos: movimientos,
        dificultad: dificultad,
        fecha: fecha
      });
      alert("¡Puntaje enviado exitosamente!");
    } catch (e) {
      console.error("Error al agregar el puntaje: ", e);
    }
  }

  // Función para obtener los puntajes filtrados por dificultad
async function obtenerPuntajes(dificultad) {
    try {
      const q = query(
        collection(db, "rankings"),
        where("dificultad", "==", dificultad),
        orderBy("tiempo", "asc"),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      let resultados = [];
      querySnapshot.forEach((doc) => {
        resultados.push(doc.data());
      });
      return resultados;
    } catch (e) {
      console.error("Error al obtener los puntajes: ", e);
      return [];
    }
  }
  

  // Función para registrar el puntaje
function registrarPuntaje() {
    const aliasInput = document.getElementById('player-alias');
    const alias = aliasInput.value.trim();
  
    if (alias === '') {
      alert("Por favor, ingresa un alias válido.");
      return;
    }
  
    if (alias.length > 16) {
      alert("El alias no puede tener más de 16 caracteres.");
      return;
    }
  
    // Obtener los datos de la partida
    const tiempo = calculateTotalTimeInSeconds();
    const movimientos = moveCount;
    const dificultadActual = difficulty;
  
    // Enviar el puntaje a Firebase
    enviarPuntaje(alias, tiempo, movimientos, dificultadActual);
  
    // Cerrar el modal
    toggleDisplay('alias-modal', false);
  
    // Mostrar el modal de fin de juego
    showGameOverModal(
      'X', // Asumiendo que el jugador es 'X'
      formatTime(tiempo),
      movimientos,
      calculateAverageTimePerMove(),
      movimientos,
      countWonBoards().boardsX,
      countWonBoards().boardsO
    );
  }
  
  // Función para cerrar el modal sin registrar el puntaje
  function cerrarAliasModal() {
    toggleDisplay('alias-modal', false);
  
    // Mostrar el modal de fin de juego
    showGameOverModal(
      'X', // Asumiendo que el jugador es 'X'
      formatTime(calculateTotalTimeInSeconds()),
      moveCount,
      calculateAverageTimePerMove(),
      moveCount,
      countWonBoards().boardsX,
      countWonBoards().boardsO
    );
  }
  
  

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
let lastPlacedElement = null;

// Estadisticas del jugador
let playerStats = {
    p1_vs_ai: {
        easy: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            bestTime: null,
            winStreak: 0,
            bestWinStreak: 0,
            totalMoves: 0,
            totalTime: 0,
        },
        medium: {
            // Mismos campos que easy
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            bestTime: null,
            winStreak: 0,
            bestWinStreak: 0,
            totalMoves: 0,
            totalTime: 0,
        },
        hard: {
            // Mismos campos que easy
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            bestTime: null,
            winStreak: 0,
            bestWinStreak: 0,
            totalMoves: 0,
            totalTime: 0,
        }
    },
    p1_vs_p2: {
        gamesPlayed: 0,
        winsX: 0,
        winsO: 0,
        draws: 0,
        longestGameMoves: 0,
        highestBoardsWon: 0,
        totalMoves: 0,
        totalTime: 0,
    }
};


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
    loadPlayerStats();
    playMainMenuBGM();
};

// Función para cargar estadísticas desde localStorage
function loadPlayerStats() {
    const stats = JSON.parse(localStorage.getItem('playerStats'));
    if (stats) {
        playerStats = stats;
    }
}



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

// ==================== FUNCIONES DE GUARDADO Y CARGA ====================

// Guardar estadísticas en localStorage
function savePlayerStats() {
    localStorage.setItem('playerStats', JSON.stringify(playerStats));
}


// Función para reiniciar las estadísticas del jugador
function resetPlayerStats() {
    if (confirm('¿Estás seguro de que deseas reiniciar tus estadísticas? Esta acción no se puede deshacer.')) {
        playerStats = {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            bestTime: null,
            winStreak: 0,
            bestWinStreak: 0,
            totalMoves: 0,
            totalTime: 0,
        };
        savePlayerStats();
        alert('Tus estadísticas han sido reiniciadas.');
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
        totalPausedTime = 0;
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

// Verifica si hay un ganador en el mini-tablerox|
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
            handleGameOver(winner); // Pasamos el ganador directamente
        } else if (mainBoardState.every(cell => cell !== '')) {
            handleGameOver('Empate'); // En caso de empate
        }
    } catch (error) {
        console.error("Error en checkGameWinner:", error);
    }
}


// Maneja el final del juego
function handleGameOver(winner) {
    try {
        gameActive = false;
        clearInterval(timerInterval);
        playWinSound();

        // Calcular estadísticas de la partida actual
        const timeElapsedInSeconds = calculateTotalTimeInSeconds(); // Obtener tiempo en segundos
        let totalMoves = moveCount;

        // Obtener el conteo de mini-tableros ganados por cada jugador
        const { boardsX, boardsO } = countWonBoards();

        // Actualizar estadísticas según el modo de juego
        if (gameMode === 'cpu') {
            let stats = playerStats.p1_vs_ai[difficulty];

            stats.gamesPlayed++;
            stats.totalMoves += totalMoves;
            stats.totalTime += timeElapsedInSeconds;

            if (winner === 'Empate') {
                stats.draws++;
                stats.winStreak = 0;
            } else if (winner === 'X') {
                // El jugador gana
                stats.wins++;
                stats.winStreak++;
                if (stats.winStreak > stats.bestWinStreak) {
                    stats.bestWinStreak = stats.winStreak;
                }
                // Actualizar mejor tiempo si es la partida ganada más rápida
                if (!stats.bestTime || timeElapsedInSeconds < stats.bestTime) {
                    stats.bestTime = timeElapsedInSeconds;
                }
            } else {
                // El jugador pierde
                stats.losses++;
                stats.winStreak = 0;
            }
        } else if (gameMode === 'pvp') {
            let stats = playerStats.p1_vs_p2;

            stats.gamesPlayed++;
            stats.totalMoves += totalMoves;
            stats.totalTime += timeElapsedInSeconds;

            if (winner === 'Empate') {
                stats.draws++;
            } else if (winner === 'X') {
                stats.winsX++;
            } else if (winner === 'O') {
                stats.winsO++;
            }

            // Actualizar partida más larga
            if (totalMoves > stats.longestGameMoves) {
                stats.longestGameMoves = totalMoves;
            }

            // Actualizar mayor número de mini-tableros ganados
            const totalBoardsWon = boardsX + boardsO;
            if (totalBoardsWon > stats.highestBoardsWon) {
                stats.highestBoardsWon = totalBoardsWon;
            }
        }

        savePlayerStats();

        // Si el modo es contra CPU y el jugador ganó
        if (gameMode === 'cpu' && winner === 'X') {
            // Mostrar modal para ingresar alias
            toggleDisplay('alias-modal', true);
        } else {
            // Mostrar estadísticas en el modal
            showGameOverModal(
                winner,
                formatTime(timeElapsedInSeconds),
                totalMoves,
                calculateAverageTimePerMove(),
                totalMoves,
                boardsX,
                boardsO
            );
        }
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
                                handleGameOver(winner);
                            } else {
                                handleGameOver('¡Empate!');
                            }
                        }
                        return;
                    }
                }

                if (move) {
                    handleCellClick(move.boardIndex, move.cellIndex);
                }

            }, 100); // 0.1 seconds delay before CPU makes its move

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
                // Remove path and .ogg extension from song name
                const songName = songs[index].split('/').pop().replace('.ogg', '');
                songNameElement.textContent = songName;
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

// Formatea la fecha de firebase
function formatDate(timestamp) {
    const fecha = timestamp.toDate();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Los meses empiezan en 0
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
}


// Formatea el tiempo en segundos a mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
}


// Calcula el tiempo total transcurrido en segundos
function calculateTotalTimeInSeconds() {
    try {
        const totalTimeInSeconds = Math.floor((Date.now() - gameStartTime - totalPausedTime) / 1000);
        return totalTimeInSeconds;
    } catch (error) {
        console.error("Error en calculateTotalTimeInSeconds:", error);
        return 0;
    }
}

// Calcula el tiempo promedio por movimiento
function calculateAverageTimePerMove() {
    try {
        const totalTimeInSeconds = calculateTotalTimeInSeconds();
        let moves = moveCount;
        if (gameMode === 'cpu') {
            moves = Math.ceil(moveCount / 2);
        }
        if (moves === 0) return '0s';
        const averageTime = (totalTimeInSeconds / moves).toFixed(1);
        return `${averageTime}s`;
    } catch (error) {
        console.error("Error en calculateAverageTimePerMove:", error);
        return '0s';
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

// Muestra el modal de fin de juego y actualiza las estadísticas
function showGameOverModal(winner, timeElapsed, totalMoves, averageTimePerMove, totalTurns, boardsX, boardsO) {
    try {
        const titleElement = document.getElementById('game-over-title');
        if (titleElement) {
            if (winner === 'Empate') {
                titleElement.textContent = '¡Es un empate!';
            } else {
                titleElement.textContent = `¡Felicidades, ${winner}!`;
            }
        }

        // Actualizar estadísticas de la partida
        updateModalStatistic('game-over-turns', totalTurns);
        updateModalStatistic('game-over-time', timeElapsed);
        updateModalStatistic('game-over-average-time', averageTimePerMove);
        updateModalStatistic('game-over-boards-x', boardsX);
        updateModalStatistic('game-over-boards-o', boardsO);

        // Mostrar dificultad si el modo es P1 vs IA
        const difficultyElement = document.getElementById('game-over-difficulty');
        if (gameMode === 'cpu' && difficultyElement) {
            difficultyElement.style.display = 'flex';
            difficultyElement.querySelector('.value').textContent = capitalizeFirstLetter(difficulty);
        } else if (difficultyElement) {
            difficultyElement.style.display = 'none';
        }

        // Mostrar botón para alternar entre contenido y estadísticas
        const toggleStatsButton = document.getElementById('toggle-stats-button');
        if (toggleStatsButton) {
            toggleStatsButton.style.display = 'block';
            toggleStatsButton.onclick = toggleGameOverStats;
        }

        // Inicialmente, mostrar el contenido del juego
        showGameOverContent();

        toggleDisplay('game-over-modal', true);
    } catch (error) {
        console.error("Error en showGameOverModal:", error);
    }
}

// Función para alternar entre el contenido y las estadísticas en el modal de fin de juego
function toggleGameOverStats() {
    const statsContainer = document.getElementById('game-over-stats');
    const contentContainer = document.getElementById('game-over-content');
    const toggleButton = document.getElementById('toggle-stats-button');

    if (statsContainer.style.display === 'none') {
        showGameOverStats();
        toggleButton.textContent = 'Ver Resumen de Partida';
    } else {
        showGameOverContent();
        toggleButton.textContent = 'Ver Estadísticas Generales';
    }
}

// Función para mostrar el contenido del juego en el modal
function showGameOverContent() {
    const statsContainer = document.getElementById('game-over-stats');
    const contentContainer = document.getElementById('game-over-content');
    statsContainer.style.display = 'none';
    contentContainer.style.display = 'block';
}

// Función para actualizar un elemento de estadística en el modal
function updateModalStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        const valueElement = element.querySelector('.value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
}

// Función para mostrar las estadísticas en el modal
function showGameOverStats() {
    const statsContainer = document.getElementById('game-over-stats');
    const contentContainer = document.getElementById('game-over-content');
    statsContainer.style.display = 'block';
    contentContainer.style.display = 'none';

    // Actualizar estadísticas generales según el modo
    const overallStatsContainer = statsContainer.querySelector('.overall-statistics');
    overallStatsContainer.innerHTML = ''; // Limpiar contenido anterior

    if (gameMode === 'cpu') {
        const stats = playerStats.p1_vs_ai[difficulty];

        overallStatsContainer.innerHTML += `<h3>P1 vs IA - ${capitalizeFirstLetter(difficulty)}</h3>`;
        overallStatsContainer.innerHTML += generateStatisticLine('Partidas Jugadas', stats.gamesPlayed);
        overallStatsContainer.innerHTML += generateStatisticLine('Victorias', stats.wins);
        overallStatsContainer.innerHTML += generateStatisticLine('Derrotas', stats.losses);
        overallStatsContainer.innerHTML += generateStatisticLine('Empates', stats.draws);

        const winPercentage = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(2) + '%' : '0%';
        overallStatsContainer.innerHTML += generateStatisticLine('% de Victorias', winPercentage);

        const bestTime = stats.bestTime ? formatTime(stats.bestTime) : 'N/A';
        overallStatsContainer.innerHTML += generateStatisticLine('Mejor Tiempo', bestTime);

        overallStatsContainer.innerHTML += generateStatisticLine('Mejor Racha', stats.bestWinStreak);
    } else if (gameMode === 'pvp') {
        const stats = playerStats.p1_vs_p2;

        overallStatsContainer.innerHTML += `<h3>P1 vs P2</h3>`;
        overallStatsContainer.innerHTML += generateStatisticLine('Partidas Jugadas', stats.gamesPlayed);
        overallStatsContainer.innerHTML += generateStatisticLine('Victorias de X', stats.winsX);
        overallStatsContainer.innerHTML += generateStatisticLine('Victorias de O', stats.winsO);
        overallStatsContainer.innerHTML += generateStatisticLine('Empates', stats.draws);
        overallStatsContainer.innerHTML += generateStatisticLine('Partida más Larga (Movimientos)', stats.longestGameMoves);
        overallStatsContainer.innerHTML += generateStatisticLine('Mayor número de Mini-Tableros Ganados', stats.highestBoardsWon);
    }
}


// Genera una línea de estadística en formato HTML
function generateStatisticLine(label, value) {
    return `
    <p>
        <span class="label"><strong>${label}</strong></span>
        <span class="separator">· · · · · · ·</span>
        <span class="value">${value}</span>
    </p>`;
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
        
        // Gestionar el resaltado del último símbolo
        if (lastPlacedElement) {
            lastPlacedElement.classList.remove('last-symbol');
        }
        symbolSpan.classList.add('last-symbol');
        lastPlacedElement = symbolSpan;
        
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
        totalPausedTime = 0;   // Reiniciar el tiempo total pausado
        pauseStartTime = null; // Reiniciar el tiempo de inicio de pausa
        if (lastPlacedElement) {
            lastPlacedElement.classList.remove('last-symbol');
            lastPlacedElement = null;
        }
    } catch (error) {
        console.error("Error en resetGameState:", error);
    }
}


// Función para contar los mini-tableros ganados por cada jugador
function countWonBoards() {
    try {
        let boardsX = 0;
        let boardsO = 0;
        mainBoard.forEach(miniBoard => {
            if (miniBoard.winner === 'X') boardsX++;
            if (miniBoard.winner === 'O') boardsO++;
        });
        return { boardsX, boardsO };
    } catch (error) {
        console.error("Error en countWonBoards:", error);
        return { boardsX: 0, boardsO: 0 };
    }
}

// Función para capitalizar la primera letra de una cadena
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Función para mostrar el modal de estadísticas generales desde el menú principal
function showGeneralStats() {
    // Ocultar otros menús
    toggleDisplay('main-menu', false);
    toggleDisplay('difficulty-menu', false);

    // Mostrar el modal de estadísticas generales
    toggleDisplay('general-stats-modal', true);

    // Mostrar estadísticas de ambos modos
    showOverallStats();
}

// Función para mostrar las estadísticas generales
function showOverallStats() {
    const overallStatsContainer = document.querySelector('#general-stats-modal .overall-statistics');
    overallStatsContainer.innerHTML = ''; // Limpiar contenido anterior

    // Actualizar estadísticas de P1 vs IA por dificultad
    ['easy', 'medium', 'hard'].forEach(diff => {
        const stats = playerStats.p1_vs_ai[diff];

        overallStatsContainer.innerHTML += `<h3>P1 vs IA - ${capitalizeFirstLetter(diff)}</h3>`;
        overallStatsContainer.innerHTML += generateStatisticLine('Partidas Jugadas', stats.gamesPlayed);
        overallStatsContainer.innerHTML += generateStatisticLine('Victorias', stats.wins);
        overallStatsContainer.innerHTML += generateStatisticLine('Derrotas', stats.losses);
        overallStatsContainer.innerHTML += generateStatisticLine('Empates', stats.draws);

        const winPercentage = stats.gamesPlayed > 0 ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(2) + '%' : '0%';
        overallStatsContainer.innerHTML += generateStatisticLine('% de Victorias', winPercentage);

        const bestTime = stats.bestTime ? formatTime(stats.bestTime) : 'N/A';
        overallStatsContainer.innerHTML += generateStatisticLine('Mejor Tiempo', bestTime);

        overallStatsContainer.innerHTML += generateStatisticLine('Mejor Racha', stats.bestWinStreak);
    });

    // Actualizar estadísticas de P1 vs P2
    const statsPVP = playerStats.p1_vs_p2;

    overallStatsContainer.innerHTML += `<h3>P1 vs P2</h3>`;
    overallStatsContainer.innerHTML += generateStatisticLine('Partidas Jugadas', statsPVP.gamesPlayed);
    overallStatsContainer.innerHTML += generateStatisticLine('Victorias de X', statsPVP.winsX);
    overallStatsContainer.innerHTML += generateStatisticLine('Victorias de O', statsPVP.winsO);
    overallStatsContainer.innerHTML += generateStatisticLine('Empates', statsPVP.draws);
    overallStatsContainer.innerHTML += generateStatisticLine('Partida más Larga (Movimientos)', statsPVP.longestGameMoves);
    overallStatsContainer.innerHTML += generateStatisticLine('Mayor número de Mini-Tableros Ganados', statsPVP.highestBoardsWon);
}

// Función para cerrar el modal de estadísticas generales
function closeGeneralStats() {
    toggleDisplay('general-stats-modal', false);
    toggleDisplay('main-menu', true);
}


// Función para mostrar el modal de ranking
function mostrarRanking() {
    toggleDisplay('ranking-modal', true);
    // Remove any pre-selection
    document.getElementById('ranking-medium').style.display = 'none';
    document.getElementById('ranking-hard').style.display = 'none';
    document.getElementById('btn-medium').classList.remove('active');
    document.getElementById('btn-hard').classList.remove('active');
}
  
  // Función para cerrar el modal de ranking
  function cerrarRanking() {
    toggleDisplay('ranking-modal', false);
  }
  
  // Función para cargar los puntajes desde Firebase y mostrarlos en las tablas
  function mostrarRankingPorDificultad(dificultad) {
    // Actualizar botones
    document.getElementById('btn-medium').classList.remove('active');
    document.getElementById('btn-hard').classList.remove('active');
    document.getElementById(`btn-${dificultad}`).classList.add('active');

    // Mostrar/ocultar secciones
    document.getElementById('ranking-medium').style.display = dificultad === 'medium' ? 'flex' : 'none';
    document.getElementById('ranking-hard').style.display = dificultad === 'hard' ? 'flex' : 'none';

    // Cargar datos
    cargarRanking(dificultad);
}

async function cargarRanking(dificultad) {
    try {
        console.log("Cargando ranking para dificultad:", dificultad);
        const rankings = await obtenerPuntajes(dificultad);
        console.log("Rankings obtenidos:", rankings);
        
        const rankingContainer = document.getElementById(`ranking-${dificultad}`);
        if (!rankingContainer) {
            console.error(`Container ranking-${dificultad} no encontrado`);
            return;
        }
        
        rankingContainer.innerHTML = '';
        
        if (rankings.length === 0) {
            rankingContainer.innerHTML = '<div class="ranking-item">No hay puntajes registrados para esta dificultad</div>';
            return;
        }

        rankings.forEach((puntaje, index) => {
            const rankingClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${rankingClass}`;
            rankingItem.innerHTML = `
                <div class="ranking-row">
                    <span class="ranking-key">Posición:</span>
                    <span class="ranking-value">${index + 1}</span>
                </div>
                <div class="ranking-row">
                    <span class="ranking-key">Alias:</span>
                    <span class="ranking-value">${puntaje.alias}</span>
                </div>
                <div class="ranking-row">
                    <span class="ranking-key">Tiempo:</span>
                    <span class="ranking-value">${formatTime(puntaje.tiempo)}</span>
                </div>
                <div class="ranking-row">
                    <span class="ranking-key">Movimientos:</span>
                    <span class="ranking-value">${puntaje.movimientos}</span>
                </div>
                <div class="ranking-row">
                    <span class="ranking-key">Fecha:</span>
                    <span class="ranking-value">${formatDate(puntaje.fecha)}</span>
                </div>
            `;
            rankingContainer.appendChild(rankingItem);
        });
    } catch (error) {
        console.error("Error en cargarRanking:", error);
    }
}


// ==================== FIN DEL SCRIPT ====================

// Expose required functions to the global scope
window.showDifficulty = showDifficulty;
window.startGame = startGame;
window.backToMainMenu = backToMainMenu;
window.showInstructions = showInstructions;
window.showGeneralStats = showGeneralStats;
window.mostrarRanking = mostrarRanking;
window.pauseGame = pauseGame;
window.retryGame = resetGame;
window.resumeGame = resumeGame;
window.hideInstructions = hideInstructions;
window.closeGeneralStats = closeGeneralStats;
window.togglePlayPause = togglePlayPause;
window.setBGMVolume = setBGMVolume;
window.previousSong = previousSong;
window.nextSong = nextSong;
window.registrarPuntaje = registrarPuntaje;
window.cerrarAliasModal = cerrarAliasModal;
window.cerrarRanking = cerrarRanking;
window.mostrarRankingPorDificultad = mostrarRankingPorDificultad;
window.resetGame = resetGame;