// ============================================================
// memory.js — Jeu Memory Pokémon
// ============================================================

//on associe chaque clé à un lvl pour pourvoir les appeler plus facilement
const API_URLS = {
    easy: "https://mocki.io/v1/e0af6a9b-ecc1-431d-93fc-ec7382ee841f",
    medium: "https://mocki.io/v1/29da7034-0f06-4ce4-85f0-5a951c2884a9",
    hard: "https://mocki.io/v1/25a90716-58a8-4052-a384-fa680e737f76",
};

//"mémoire du jeu"
let flippedCards = []; //cartes actuellement retournées
let matchedPairs = 0; // compte les paires trouvées
let attemptsLeft = 0; //remplis à partir de l'api
let totalPairs = 0; //remplis à partir de l'api
let isLocked = false; //empêche de cliquer sur une 3ème carte pendant l'animation de retournement
let currentGameData = null; //garde une copie des données de l'api pour rejouer sans refaire un fetch

//récupération des éléments du DOM
const difficultySelect = document.getElementById("difficultySelect");
const startGameBtn = document.getElementById("startGameBtn");
const memoryInfo = document.getElementById("memory-info");
const memoryBoard = document.getElementById("memory-board");
const memoryMessage = document.getElementById("memory-message");
const restartBtn = document.getElementById("restartBtn");

const infoLevel = document.getElementById("info-level");
const infoPairs = document.getElementById("info-pairs");
const infoAttempts = document.getElementById("info-attempts");
const infoFound = document.getElementById("info-found");
const messageText = document.getElementById("message-text");

const statGames = document.getElementById("stat-games");
const statBest = document.getElementById("stat-best");


// MISE EN PLACE D'UNE PARTIE
startGameBtn.addEventListener("click", () => {
    const level = difficultySelect.value;

    if (!level) {
        alert("Choisis d'abord un niveau !");
        return;
    }

    const url = API_URLS[level];

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur serveur : ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            currentGameData = data;
            setupGame(data);
        })
        .catch((err) => {
            console.error("Erreur lors du fetch :", err);
            alert("Impossible de charger les données du jeu. Vérifie tes URLs mocki.io !");
        });
});
//fonction de reset du jeu, réinitialise les variables et construit le plateau à partir des données de l'api
function setupGame(data) {
    flippedCards = [];
    matchedPairs = 0;
    isLocked = false;
    totalPairs = data.pairs;
    attemptsLeft = data.maxAttempts;


    memoryBoard.className = '';
    memoryBoard.removeAttribute('style');

//ajoute la classe css correspondant au niveau pour ajuster la grille
    if (data.level === "facile") {     
        memoryBoard.classList.add("grid-easy");
    } else if (data.level === "moyen") {
        memoryBoard.classList.add("grid-medium");
    } else if (data.level === "difficile") {
        memoryBoard.classList.add("grid-hard");
    }

//affichage des infos de la partie
    infoLevel.textContent = data.level; 
    infoPairs.textContent = data.pairs;
    infoAttempts.textContent = attemptsLeft;
    infoFound.textContent = 0;

    memoryInfo.classList.remove("hidden");
    memoryMessage.classList.add("hidden");

    buildBoard(data.images);
    loadStats();
}

//fonction de construction du plateau de jeu, crée les éléments HTML pour chaque carte à partir des données de l'api et les mélange aléatoirement
function buildBoard(images) {
    memoryBoard.innerHTML = "";

//on crée une clé unique pour différencier les deux cartes d'une même paire
    const cards = [];
    images.forEach((img) => {
        cards.push({ ...img, uid: `${img.id}-a` }); 
        cards.push({ ...img, uid: `${img.id}-b` });
    });

//algorithme de mélange de Fisher-Yates
    for (let i = cards.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    cards.forEach((cardData) => {
        const card = createCardElement(cardData);
        memoryBoard.appendChild(card);
    });
}

//fonction de création d'une carte, construit l'élément HTML de la carte avec sa face avant (image et nom du pokémon) et sa face arrière (image de pokéball)
function createCardElement(cardData) {
    const card = document.createElement("div");
    card.classList.add("memory-card");//on stocke les données de la carte dans des data-attributes pour pouvoir les comparer lors du clic
    card.dataset.id = cardData.id; //identifiant de la paire
    card.dataset.uid = cardData.uid; //identifiant unique de la carte

    const front = document.createElement("div"); //face avant de la carte
    front.classList.add("card-front"); //on ajoute l'image et le nom du pokémon sur la face avant
    const img = document.createElement("img"); //on utilise l'url de l'api pour afficher l'image du pokémon
    img.src = cardData.url; 
    img.alt = cardData.name; 
    const name = document.createElement("p"); //on affiche le nom du pokémon sous l'image
    name.textContent = cardData.name;
    front.appendChild(img); 
    front.appendChild(name);

    const back = document.createElement("div");//face arrière de la carte
    back.classList.add("card-back"); //on ajoute une image de pokéball 
    const pokeballImg = document.createElement("img"); 
    pokeballImg.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"; 
    pokeballImg.alt = "Pokéball";
    back.appendChild(pokeballImg);

    card.appendChild(front);//on ajoute d'abord la face avant pour que ce soit celle qui soit visible au départ
    card.appendChild(back);

    card.addEventListener("click", () => handleCardClick(card));//on ajoute un écouteur de clic à chaque carte pour gérer le retournement 

    return card;
}

//fonction de gestion du clic sur une carte, gère le retournement de la carte et la logique de comparaison des cartes retournées
function handleCardClick(card) {
    if (isLocked) return; //empêche de cliquer pendant l'animation de retournement
    if (card.classList.contains("flipped")) return; //empêche de cliquer sur une carte déjà retournée
    if (card.classList.contains("matched")) return; //empêche de cliquer sur une carte déjà trouvée

    card.classList.add("flipped");
    flippedCards.push(card);

    if (flippedCards.length === 1) return; //si c'est la première carte retournée, on attend que le joueur en retourne une deuxième

    if (flippedCards.length === 2) { //si c'est la deuxième carte retournée, on compare les deux cartes
        attemptsLeft--;
        updateInfoDisplay();

        const [card1, card2] = flippedCards; 

        if (card1.dataset.id === card2.dataset.id) { //si les deux cartes ont le même id, c'est une paire
            handleMatch(card1, card2);
        } else {
            handleMismatch(card1, card2);//sinon, c'est une erreur et on les retourne à nouveau après une courte pause
        }
    }
}

//fonction de gestion d'une paire trouvée, ajoute une classe "matched" aux cartes pour les différencier visuellement et met à jour les infos de la partie
function handleMatch(card1, card2) {
    card1.classList.add("matched"); 
    card2.classList.add("matched");

    matchedPairs++; //on incrémente le nombre de paires trouvées
    flippedCards = []; //on réinitialise les cartes retournées

    updateInfoDisplay(); //on met à jour l'affichage des infos

    if (matchedPairs === totalPairs) { //si toutes les paires ont été trouvées, le joueur gagne
        endGame(true);
    }
}

//fonction de gestion d'une erreur, bloque les clics pendant l'animation de retournement et retourne les cartes à nouveau après une courte pause
function handleMismatch(card1, card2) { //on bloque les clics pendant l'animation de retournement
    isLocked = true;

    setTimeout(() => {  //après 1 seconde, on retourne les cartes à nouveau
        card1.classList.remove("flipped"); 
        card2.classList.remove("flipped");
        flippedCards = [];
        isLocked = false;

        if (attemptsLeft <= 0) { endGame(false); } //si le joueur n'a plus de tentatives, il perd
    }, 1000);
} 

//fonction de fin de partie, affiche un message de victoire ou de défaite et enregistre les statistiques de la partie
function endGame(isWin) {
    isLocked = true; //on bloque les clics pour éviter les interactions après la fin du jeu 
    if (isWin) {
        messageText.textContent = `🎉 Bravo ! Tu as trouvé toutes les paires avec ${attemptsLeft} tentatives restantes !`;
    }
    else {
        messageText.textContent = `😢 Game Over... Plus de tentatives ! Certaines paires sont restées cachées.`;
        revealAllCards(); //on révèle toutes les cartes restantes pour que le joueur puisse voir ce qu'il a manqué
    } 
    memoryMessage.classList.remove("hidden"); 
    saveStats(isWin); 
} 

//fonction pour révéler toutes les cartes restantes à la fin du jeu, utilisée en cas de défaite pour montrer au joueur les paires qu'il n'a pas trouvées
function revealAllCards() {
    const
    allCards = memoryBoard.querySelectorAll(".memory-card:not(.matched)"); //on sélectionne toutes les cartes qui ne sont pas encore trouvées
    allCards.forEach((card) =>  
        card.classList.add("flipped")); //on les retourne à l'endroit pour révéler leur contenu
}

//fonction de mise à jour de l'affichage des infos de la partie, met à jour le nombre de tentatives restantes et le nombre de paires trouvées
function updateInfoDisplay() {
    infoAttempts.textContent = attemptsLeft; //on met à jour le nombre de tentatives restantes
    infoFound.textContent = matchedPairs; //on met à jour le nombre de paires trouvées
}

//gestion du bouton de redémarrage, permet de rejouer avec les mêmes données de l'api sans refaire un fetch
restartBtn.addEventListener("click", () => {
    if (currentGameData) {  
        setupGame(currentGameData);
    }
});

const STATS_KEY = "memoryStats"; //clé pour stocker les statistiques dans le localStorage

//fonction de sauvegarde des statistiques de la partie dans le localStorage
function saveStats(isWin) {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {  //si aucune statistique n'existe encore, on initialise avec des valeurs par défaut
        gamesPlayed: 0,
        bestScore: null,
    };

    stats.gamesPlayed++; //incrémenter le nombre de parties jouées

    if (isWin) { //si le joueur a gagné, on calcule le score en fonction des tentatives restantes
        const score = attemptsLeft;
        if (stats.bestScore === null || score > stats.bestScore) {
            stats.bestScore = score;
        }
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(stats)); //enregistrer les statistiques mises à jour dans le localStorage
    displayStats(stats); 
}

//fonction de chargement des statistiques depuis le localStorage 
function loadStats() {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {
        gamesPlayed: 0,
        bestScore: null,
    };
    displayStats(stats);
}

//fonction d'affichage des statistiques dans l'interface
function displayStats(stats) {
    statGames.textContent = stats.gamesPlayed;
    statBest.textContent = stats.bestScore !== null
        ? stats.bestScore + " tentatives restantes"
        : "-";
}

loadStats(); //charger les statistiques au chargement de la page pour afficher les données même avant de commencer une partie
