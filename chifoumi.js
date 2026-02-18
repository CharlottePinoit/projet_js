//Jeu Chi-Fu-Mi Pokémon (Feu/Plante/Eau)



// RÉCUPÉRATION DES ÉLÉMENTS DU DOM

const starterButtons = document.querySelectorAll(".starter-btn");
const chifoumiResult = document.getElementById("chifoumi-result");
const battleDisplay = document.getElementById("battle-display");
const resultMessage = document.getElementById("result-message");
const playAgainBtn = document.getElementById("play-again-btn");
const resetScoresBtn = document.getElementById("reset-scores-btn");

const userChoiceImg = document.getElementById("user-choice-img");
const userChoiceText = document.getElementById("user-choice-text");
const computerChoiceImg = document.getElementById("computer-choice-img");
const computerChoiceText = document.getElementById("computer-choice-text");

const userWinsDisplay = document.getElementById("user-wins");
const computerWinsDisplay = document.getElementById("computer-wins");
const tiesDisplay = document.getElementById("ties");


// CONFIGURATION DU JEU

const choices = {
    feu: {
        name: "Feu",
        emoji: "🔥",
        pokemon: "Salamèche",
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png"
    },
    plante: {
        name: "Plante",
        emoji: "🌿",
        pokemon: "Bulbizarre",
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
    },
    eau: {
        name: "Eau",
        emoji: "💧",
        pokemon: "Carapuce",
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png"
    },
    //Pikachu (gagne toujours)
    pikachu: {
        name: "Pikachu",
        emoji: "⚡",
        pokemon: "Pikachu",
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
    },
    //Évoli (perd toujours)
    evoli: {
        name: "Évoli",
        emoji: "🌟",
        pokemon: "Évoli",
        img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"
    }
};


// VARIABLES GLOBALES — SCORES

let userWins = 0;
let computerWins = 0;
let ties = 0;


// CHARGEMENT DES SCORES DEPUIS LOCALSTORAGE

const CHIFOUMI_SCORES_KEY = "chifoumiScores";


function loadScores() {
    const saved = JSON.parse(localStorage.getItem(CHIFOUMI_SCORES_KEY)) || {

        userWins: 0,
        computerWins: 0,
        ties: 0
    };

    userWins = saved.userWins;
    computerWins = saved.computerWins;
    ties = saved.ties;

    updateScoreDisplay();
}

// FONCTION : Sauvegarder les scores dans le localStorage
function saveScores() {
    const scores = { userWins, computerWins, ties };
    localStorage.setItem(CHIFOUMI_SCORES_KEY, JSON.stringify(scores));
    updateScoreDisplay();
}

// FONCTION : Mettre à jour l'affichage des scores
function updateScoreDisplay() {
    userWinsDisplay.textContent = userWins;
    computerWinsDisplay.textContent = computerWins;
    tiesDisplay.textContent = ties;
}


// FONCTION : Obtenir le choix de l'utilisateur

function getUserChoice(userInput) {
    userInput = userInput.toLowerCase();

    if (choices[userInput]) {
        return userInput;
    } else {
        console.error("Choix invalide :", userInput);
        return null;
    }
}


// FONCTION : Choix aléatoire de l'ordinateur

function getComputerChoice() {
    const choicesArray = ["feu", "plante", "eau"];
    const randomIndex = Math.floor(Math.random() * 3);
    return choicesArray[randomIndex];
}


// FONCTION : Déterminer le gagnant

function determineWinner(userChoice, computerChoice) {
    if (userChoice === computerChoice) {
        return "tie";
    }
    // Si l'utilisateur choisit Évoli → TOUJOURS PERDRE
    if (userChoice === "evoli") {
        return "computer"; // Évoli perd contre tout le reste
    }
    // Si l'utilisateur choisit Pikachu → TOUJOURS GAGNER
    if (userChoice === "pikachu") {
        return "user"; // Pikachu gagne contre tout le reste
    }

    // Feu bat Plante
    if (userChoice === "feu" && computerChoice === "plante") {
        return "user";
    }
    // Plante bat Eau
    if (userChoice === "plante" && computerChoice === "eau") {
        return "user";
    }
    // Eau bat Feu
    if (userChoice === "eau" && computerChoice === "feu") {
        return "user";
    }

    // Tous les autres cas = ordinateur gagne
    return "computer";
}


// FONCTION : Jouer une partie

function playGame(userChoice) {
    const computerChoice = getComputerChoice();
    const winner = determineWinner(userChoice, computerChoice);

    // Afficher les choix
    const userData = choices[userChoice];
    const computerData = choices[computerChoice];

    userChoiceImg.src = userData.img;
    userChoiceImg.alt = userData.pokemon;
    userChoiceText.textContent = `${userData.emoji} ${userData.name}`;

    computerChoiceImg.src = computerData.img;
    computerChoiceImg.alt = computerData.pokemon;
    computerChoiceText.textContent = `${computerData.emoji} ${computerData.name}`;

    // Déterminer le message
    let message = "";
    let messageClass = "";

    if (winner === "tie") {
        ties++;
        message = "🤝 Égalité ! Vous avez choisi le même type !";
        messageClass = "tie";
    } else if (winner === "user") {
        userWins++;
        message = `🎉 Tu as gagné ! ${userData.name} bat ${computerData.name} !`;
        messageClass = "win";
    } else {
        computerWins++;
        message = `😢 Tu as perdu... ${computerData.name} bat ${userData.name}...`;
        messageClass = "lose";
    }

    resultMessage.textContent = message;
    resultMessage.className = messageClass;

    // Sauvegarder les scores
    saveScores();

    // Afficher le résultat
    chifoumiResult.classList.remove("hidden");
}


// ÉVÉNEMENTS : Clic sur les boutons de choix

starterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const choice = button.getAttribute("data-choice");
        const validChoice = getUserChoice(choice);

        if (validChoice) {
            playGame(validChoice);
        }
    });
});


// ÉVÉNEMENT : Bouton "Rejouer"

playAgainBtn.addEventListener("click", () => {
    chifoumiResult.classList.add("hidden");
});


// ÉVÉNEMENT : Bouton "Réinitialiser les scores"

resetScoresBtn.addEventListener("click", () => {
    const confirmReset = confirm("Veux-tu vraiment réinitialiser tous les scores ?");

    if (confirmReset) {
        userWins = 0;
        computerWins = 0;
        ties = 0;
        saveScores();
        alert("Les scores ont été réinitialisés !");
    }
});


// CHARGEMENT INITIAL DES SCORES

loadScores();
