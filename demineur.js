// ============================================================
//  demineur.js — Démineur Pokémon avec Fantominus
// ============================================================

// -------------------------------------------------------
// RÉCUPÉRATION DES ÉLÉMENTS DU DOM
// -------------------------------------------------------
const difficultySelectDemineur = document.getElementById("difficultySelectDemineur");
const newGameBtn = document.getElementById("newGameBtn");
const deminerurBoard = document.getElementById("demineur-board");
const minesCountDisplay = document.getElementById("mines-count");
const timerDisplay = document.getElementById("timer");
const bestTimeDisplay = document.getElementById("best-time");
const demineurMessage = document.getElementById("demineur-message");
const demineurResultText = document.getElementById("demineur-result-text");
const restartDemineurBtn = document.getElementById("restart-demineur-btn");

// -------------------------------------------------------
// CONFIGURATION DES NIVEAUX
// -------------------------------------------------------
const difficulties = {
    facile: { size: 8, mines: 10 },
    moyen: { size: 12, mines: 20 },
    difficile: { size: 16, mines: 40 }
};

// -------------------------------------------------------
// VARIABLES GLOBALES DU JEU
// -------------------------------------------------------
let board = [];           // Grille du jeu (valeurs : 99 = mine, 0-8 = nombre de mines adjacentes)
let revealed = [];        // Cases révélées (true/false)
let flagged = [];         // Cases avec drapeaux (true/false)
let boardSize = 12;       // Taille de la grille
let totalMines = 20;      // Nombre de mines
let flagsPlaced = 0;      // Nombre de drapeaux posés
let cellsRevealed = 0;    // Nombre de cases révélées
let gameOver = false;     // Partie terminée ?
let gameWon = false;      // Partie gagnée ?
let timer = 0;            // Compteur de temps
let timerInterval = null; // Intervalle du timer

const MINE = 99;          // Valeur représentant une mine

// -------------------------------------------------------
// INITIALISATION DU PLATEAU
// -------------------------------------------------------
function initBoard(size, minesCount) {
    const newBoard = [];
    
    // Créer une grille vide
    for (let i = 0; i < size; i++) {
        newBoard[i] = [];
        for (let j = 0; j < size; j++) {
            newBoard[i][j] = 0;
        }
    }
    
    // Placer les mines aléatoirement
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        
        if (newBoard[x][y] !== MINE) {
            newBoard[x][y] = MINE;
            minesPlaced++;
        }
    }
    
    // Calculer les nombres autour de chaque case
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            if (newBoard[x][y] !== MINE) {
                newBoard[x][y] = getMines(newBoard, x, y, size);
            }
        }
    }
    
    return newBoard;
}

// -------------------------------------------------------
// VÉRIFIER SI UNE CASE EST UNE MINE
// -------------------------------------------------------
function isAMine(board, x, y) {
    return board[x][y] === MINE;
}

// -------------------------------------------------------
// COMPTER LES MINES ADJACENTES
// -------------------------------------------------------
function getMines(board, x, y, size) {
    let count = 0;
    
    // Vérifier les 8 cases adjacentes
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue; // Ignorer la case elle-même
            
            const nx = x + dx;
            const ny = y + dy;
            
            // Vérifier les limites
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                if (board[nx][ny] === MINE) {
                    count++;
                }
            }
        }
    }
    
    return count;
}

// -------------------------------------------------------
// CRÉER LE PLATEAU VISUEL
// -------------------------------------------------------
function createBoard() {
    deminerurBoard.innerHTML = "";
    deminerurBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    // Ajuster la taille des cellules selon la difficulté
    const cellSize = boardSize <= 8 ? 50 : boardSize <= 12 ? 40 : 30;
    // Le gap de 2px × (nombre de gaps) doit être soustrait
    const totalGap = (boardSize - 1) * 2;
    const totalSize = (boardSize * cellSize) + totalGap + 8; // +8 pour le padding (4px × 2)
    deminerurBoard.style.width = `${totalSize}px`;
    deminerurBoard.style.height = `${totalSize}px`;
    
    for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
            const cell = document.createElement("div");
            cell.classList.add("demineur-cell");
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Clic gauche : révéler
            cell.addEventListener("click", (e) => {
                e.preventDefault();
                handleCellClick(x, y);
            });
            
            // Clic droit : poser/retirer drapeau
            cell.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                handleRightClick(x, y);
            });
            
            deminerurBoard.appendChild(cell);
        }
    }
}

// -------------------------------------------------------
// GESTION DU CLIC GAUCHE (révéler case)
// -------------------------------------------------------
function handleCellClick(x, y) {
    if (gameOver || revealed[x][y] || flagged[x][y]) return;
    
    // Démarrer le timer au premier clic
    if (timer === 0 && timerInterval === null) {
        startTimer();
    }
    
    // Révéler la case
    revealCell(x, y);
    
    // Vérifier victoire/défaite
    checkGameState();
}

// -------------------------------------------------------
// RÉVÉLER UNE CASE
// -------------------------------------------------------
function revealCell(x, y) {
    if (revealed[x][y] || flagged[x][y]) return;
    
    revealed[x][y] = true;
    cellsRevealed++;
    
    const cell = getCellElement(x, y);
    cell.classList.add("revealed");
    
    if (isAMine(board, x, y)) {
        // MINE TROUVÉE → GAME OVER
        cell.classList.add("mine");
        cell.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/92.png" alt="Fantominus">`;
        gameOver = true;
        gameWon = false;
        revealAllMines();
        endGame();
    } else {
        // CASE NORMALE
        const mineCount = board[x][y];
        
        if (mineCount > 0) {
            cell.textContent = mineCount;
            cell.classList.add(`number-${mineCount}`);
        } else {
            // Case vide (0 mines autour) → révéler automatiquement les cases adjacentes
            revealAdjacent(x, y);
        }
    }
}

// -------------------------------------------------------
// RÉVÉLER LES CASES ADJACENTES (récursif)
// -------------------------------------------------------
function revealAdjacent(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                if (!revealed[nx][ny] && !flagged[nx][ny]) {
                    revealCell(nx, ny);
                }
            }
        }
    }
}

// -------------------------------------------------------
// GESTION DU CLIC DROIT (poser/retirer drapeau)
// -------------------------------------------------------
function handleRightClick(x, y) {
    if (gameOver || revealed[x][y]) return;
    
    const cell = getCellElement(x, y);
    
    if (flagged[x][y]) {
        // Retirer le drapeau
        flagged[x][y] = false;
        flagsPlaced--;
        cell.classList.remove("flagged");
        cell.innerHTML = "";
    } else {
        // Poser un drapeau
        if (flagsPlaced < totalMines) {
            flagged[x][y] = true;
            flagsPlaced++;
            cell.classList.add("flagged");
            cell.innerHTML = '<span style="display: block; font-size: 18px; line-height: 1;">🚩</span>';
        }
    }
    
    updateMinesCount();
}

// -------------------------------------------------------
// RÉCUPÉRER UN ÉLÉMENT DE CELLULE
// -------------------------------------------------------
function getCellElement(x, y) {
    return deminerurBoard.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}

// -------------------------------------------------------
// RÉVÉLER TOUTES LES MINES (game over)
// -------------------------------------------------------
function revealAllMines() {
    for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
            if (isAMine(board, x, y)) {
                const cell = getCellElement(x, y);
                cell.classList.add("revealed", "mine");
                cell.innerHTML = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/92.png" alt="Fantominus">`;
            }
        }
    }
}

// -------------------------------------------------------
// VÉRIFIER L'ÉTAT DU JEU
// -------------------------------------------------------
function checkGameState() {
    if (gameOver) return;
    
    // Victoire = toutes les cases non-mines révélées
    const totalCells = boardSize * boardSize;
    const nonMineCells = totalCells - totalMines;
    
    if (cellsRevealed === nonMineCells) {
        gameOver = true;
        gameWon = true;
        stopTimer();
        saveBestTime();
        endGame();
    }
}

// -------------------------------------------------------
// FIN DE PARTIE
// -------------------------------------------------------
function endGame() {
    stopTimer();
    
    if (gameWon) {
        demineurResultText.textContent = `🎉 Bravo ! Tu as trouvé tous les Fantominus en ${timer}s !`;
        demineurResultText.className = "win";
    } else {
        demineurResultText.textContent = `👻 Game Over ! Un Fantominus t'a eu...`;
        demineurResultText.className = "lose";
    }
    
    demineurMessage.classList.remove("hidden");
}

// -------------------------------------------------------
// TIMER
// -------------------------------------------------------
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        timerDisplay.textContent = timer;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// -------------------------------------------------------
// MISE À JOUR DU COMPTEUR DE MINES
// -------------------------------------------------------
function updateMinesCount() {
    const remaining = totalMines - flagsPlaced;
    minesCountDisplay.textContent = remaining;
}

// -------------------------------------------------------
// SAUVEGARDER LE MEILLEUR TEMPS
// -------------------------------------------------------
const DEMINEUR_BEST_KEY = "demineurBestTimes";

function saveBestTime() {
    const difficulty = difficultySelectDemineur.value;
    const bestTimes = JSON.parse(localStorage.getItem(DEMINEUR_BEST_KEY)) || {};
    
    if (!bestTimes[difficulty] || timer < bestTimes[difficulty]) {
        bestTimes[difficulty] = timer;
        localStorage.setItem(DEMINEUR_BEST_KEY, JSON.stringify(bestTimes));
    }
    
    loadBestTime();
}

function loadBestTime() {
    const difficulty = difficultySelectDemineur.value;
    const bestTimes = JSON.parse(localStorage.getItem(DEMINEUR_BEST_KEY)) || {};
    
    if (bestTimes[difficulty]) {
        bestTimeDisplay.textContent = bestTimes[difficulty] + "s";
    } else {
        bestTimeDisplay.textContent = "-";
    }
}

// -------------------------------------------------------
// NOUVELLE PARTIE
// -------------------------------------------------------
function startNewGame() {
    // Récupérer la difficulté
    const difficulty = difficultySelectDemineur.value;
    boardSize = difficulties[difficulty].size;
    totalMines = difficulties[difficulty].mines;
    
    // Réinitialiser les variables
    board = initBoard(boardSize, totalMines);
    revealed = Array(boardSize).fill(null).map(() => Array(boardSize).fill(false));
    flagged = Array(boardSize).fill(null).map(() => Array(boardSize).fill(false));
    flagsPlaced = 0;
    cellsRevealed = 0;
    gameOver = false;
    gameWon = false;
    timer = 0;
    
    // Arrêter le timer
    stopTimer();
    timerDisplay.textContent = "0";
    
    // Mettre à jour l'affichage
    updateMinesCount();
    loadBestTime();
    
    // Cacher le message de fin
    demineurMessage.classList.add("hidden");
    
    // Créer le plateau
    createBoard();
}

// -------------------------------------------------------
// ÉVÉNEMENTS
// -------------------------------------------------------
newGameBtn.addEventListener("click", startNewGame);
restartDemineurBtn.addEventListener("click", startNewGame);

difficultySelectDemineur.addEventListener("change", () => {
    startNewGame();
});

// -------------------------------------------------------
// INITIALISATION
// -------------------------------------------------------
startNewGame();
