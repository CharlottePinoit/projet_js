console.log(window.document);

let sessionVotes = {};
const typeColors = {
  Feu: "#F08030",
  Eau: "#6890F0",
  Plante: "#78C850",
  Électrik: "#F8D030",
  Roche: "#B8A038",
  Sol: "#E0C068",
  Psy: "#F85888",
  Insecte: "#A8B820",
  Poison: "#A040A0",
  Spectre: "#705898",
  Ténèbres: "#705848",
  Dragon: "#7038F8",
  Fée: "#EE99AC",
  Normal: "#A8A878",
  Combat: "#C03028",
  Acier: "#B8B8D0",
  Glace: "#98D8D8",
  Vol: "#A890F0",
};
const article = [];

const createCard = (article) => {
  if (!article.name) return null; // ignore les objets vides

  const currentDiv = document.querySelector(`#feed-container`);
  //ma div carte pokemon
  const card = document.createElement("div"); // créer une nouvelle <div>
  card.classList.add("cartePokemon"); // class principale de la carte
  //currentDiv.appendChild(card); pas besoin ici car déjà dans le displayfeed

  // Couleur de bordure selon type
  const mainType = article.type.split(", ")[0]; // Prend le premier type
  const color = typeColors[mainType] || "#000";
  card.style.border = `4px solid ${color}`;
  card.style.borderRadius = "12px";
  // nom du pokemon
  const title = document.createElement("h3"); //créer un nouvel <h3>
  title.classList.add("nomPokemon"); // class pour le titre qui sera le nom du pokemon
  title.textContent = `${article.name}`;
  card.appendChild(title);
  //image du pokemon
  const image = document.createElement("img"); //créer un nouvel <img>
  image.classList.add("imagePokemon"); // class pour la photo du pokemon
  image.src = article.image;
  image.alt = article.name; // on oublie pas l'audiodescription
  card.appendChild(image);
  //type du pokemon
  const type = document.createElement("p"); //créer un nouveau paragraphe
  type.classList.add("pokemonType"); //class pour le type du pokemon
  type.textContent = "Type : " + article.type;
  card.appendChild(type);
  //nombre de pv
  const numPv = document.createElement("p"); //créer un nouveau paragraphe
  numPv.classList.add("pokemonPV"); //class pour le type du pokemon
  numPv.textContent = "Point de vie : " + article.numPv;
  card.appendChild(numPv);

  //Récupération des votes existants
  const votes = JSON.parse(localStorage.getItem("pokemonVotes")) || {};
  const currentVotes = votes[article.name] || 0;
  //Affichage compteur de votes
  const voteCount = document.createElement("p");
  voteCount.classList.add("voteCount");
  voteCount.textContent = `Votes : ${currentVotes}`;
  card.appendChild(voteCount);
  //Bouton Voter
  const voteBtn = document.createElement("button");
  voteBtn.classList.add("voteBtn");
  voteBtn.textContent = "Voter";
  // Action du bouton
  voteBtn.addEventListener("click", () => {
    //Vérifie si l'utilisateur a déjà voté pour ce Pokémon dans cette session
    if (sessionVotes[article.name]) {
      alert(`Vous avez déjà voté pour ${article.name} sur cette page.`);
      return;
    }
    // Marque ce Pokémon comme voté pour cette session
    sessionVotes[article.name] = true;
    // Mettre à jour le compteur
    const votes = JSON.parse(localStorage.getItem("pokemonVotes")) || {};
    votes[article.name] = (votes[article.name] || 0) + 1;
    // Sauvegarder dans le localStorage
    localStorage.setItem("pokemonVotes", JSON.stringify(votes));
    voteCount.textContent = `Votes : ${votes[article.name]}`;
    // MAJ visuelle
    voteCount.textContent = `Votes : ${votes[article.name]}`;
    alert(`Vous avez voté pour ${article.name} !`);
    // Désactive le bouton après vote (optionnel mais pratique)
    voteBtn.disabled = true;
    voteBtn.style.opacity = "0.6";
  });

  card.appendChild(voteBtn);
  return card;
};

// Fonction pour générer des IDs uniques
function getRandomIDs(n, max) {
  const ids = new Set();
  while (ids.size < n) {
    ids.add(Math.floor(Math.random() * max) + 1);
  }
  return Array.from(ids);
}

const displayFeed = () => {
  const container = document.querySelector(`#feed-container`);

  //RAZ
  container.innerHTML = "";

  const totalPokemon = 1025; //nombre max de Pokémon disponible
  const numberToDraw = 4;

  const randomIDs = getRandomIDs(numberToDraw, totalPokemon);

  randomIDs.forEach(function (id) {
    fetch(`https://tyradex.app/api/v1/pokemon/${id}`)
      .then(function (response) {
        return response.json();
      })
      .then(function (pokemon) {
        console.log(pokemon);
        const article = {
          name: pokemon.name.fr,
          image: pokemon.sprites.regular,
          type: pokemon.types.map((t) => t.name).join(", "),
          numPv: pokemon.stats.hp,
        };

        const card = createCard(article);
        if (card) container.appendChild(card);
      })
      .catch(function (err) {
        console.error("Erreur fetch Pokémon :", err);
      });
    console.log(article);
  });
};
displayFeed();
//document.addEventListener("DOMContentLoaded", displayFeed);
