const pokeAPIBaseUrlForKoreanName = 'https://pokeapi.co/api/v2/pokemon-species';
const pokeAPIBaseUrlForMoreInformation = 'https://pokeapi.co/api/v2/pokemon';
const modalElements = document.querySelectorAll('.modal');
const gameStartModal = document.querySelector('.game-start__modal');
const gameStopModal = document.querySelector('.game-stop__modal');
const gameResetModal = document.querySelector('.game-reset__modal');
const gameStartButton = document.querySelector('.game-start__button');
const gameStopButton = document.querySelector('.game-stop__button');
const gameResetButtons = document.querySelectorAll('.game-reset__button');
const passedTimeElement = document.querySelector('.passed-time__time');
const gameBoard = document.querySelector('#game-board');
const musicElement = document.querySelector('.bgm');
let isSelectPaused = false;
let timeUpdateInterval;
let passedTime = 0;
let firstPick;
let currentScore = 0;
const totalScore = 8;

const colors = {
	fire: '#FDDFDF',
	grass: '#DEFDE0',
	electric: '#FCF7DE',
	water: '#DEF3FD',
	ground: '#f4e7da',
	rock: '#d5d5d4',
	fairy: '#fceaff',
	poison: '#98d7a5',
	bug: '#f8d5a3',
	dragon: '#97b3e6',
	psychic: '#eaeda1',
	flying: '#F5F5F5',
	fighting: '#E6E0D4',
	normal: '#F5F5F5',
};

const modalToggler = (typeOfModal, openOrClose) => {
	if (typeOfModal === 'start-game' && openOrClose === 'close') {
		gameStartModal.classList.add('modal--closed');
	} else if (typeOfModal === 'stop-game' && openOrClose === 'open') {
		gameStopModal.classList.remove('modal--closed');
	} else if (typeOfModal === 'stop-game' && openOrClose === 'close') {
		gameStopModal.classList.add('modal--closed');
	} else if (typeOfModal === 'reset-game' && openOrClose === 'open') {
		gameResetModal.classList.remove('modal--closed');
	} else if (typeOfModal === 'reset-game' && openOrClose === 'close') {
		gameStopModal.classList.add('modal--closed');
	}
};

const loadPokemons = async () => {
	const randomIds = new Set();
	while (randomIds.size < 8) {
		const randomNumber = Math.ceil(Math.random() * 150);
		randomIds.add(randomNumber);
	}

	const pokePromises = [...randomIds].map(async (id) => {
		const speciesResponse = await fetch(`${pokeAPIBaseUrlForKoreanName}/${id}`);
		const pokemonResponse = await fetch(`${pokeAPIBaseUrlForMoreInformation}/${id}`);
		const speciesData = await speciesResponse.json();
		const pokemonData = await pokemonResponse.json();
		return { speciesData, pokemonData };
	});

	return await Promise.all(pokePromises);
};

const displayPokemons = (pokemons) => {
	pokemons.sort((_) => Math.random() - 0.5);
	const pokemonHTML = pokemons
		.map(({ speciesData, pokemonData }) => {
			const name = speciesData.names.find((item) => item.language.name === 'ko')?.name || speciesData.name;
			const types = pokemonData.types.map((type) => type.type.name);
			const primaryType = types[0] || 'normal';
			const cardColor = colors[primaryType];
			return `
        <button class="card" style="background-color: ${cardColor}" data-pokemon-name="${name}" onClick="clickCard(event)">
        	<div class="card__front"></div>
          <div class="card__back rotated">
            <img class="card__back__image" src="${pokemonData.sprites.front_default}" alt="${name}"/>
            <h2 class="card__back__name">${name}</h2>
          </div>
        </button>
      `;
		})
		.join('');
	gameBoard.innerHTML = pokemonHTML;
};

const preparePokemonCardElements = async () => {
	const pokemons = await loadPokemons();
	displayPokemons([...pokemons, ...pokemons]);
};

const resetVariables = () => {
	gameBoard.innerHTML = '';
	isSelectPaused = true;
	firstPick = null;
	currentScore = 0;
};

const startMusic = () => {
	musicElement.currentTime = 0;
	musicElement.play();
};

const startGame = () => {
	passedTime = 0;

	timeUpdateInterval = setInterval(() => {
		passedTimeElement.innerHTML = ++passedTime;
	}, 1000);

	isSelectPaused = false;
};

const stopGame = () => {
	clearInterval(timeUpdateInterval);
	passedTimeElement.innerText = 0;
};

const clickCard = (event) => {
	const pokemonCard = event.currentTarget;
	const [cardFrontSide, cardBackSide] = getFrontAndBackFromCard(pokemonCard);

	if (cardFrontSide.classList.contains('rotated') || isSelectPaused) return;

	isSelectPaused = true;

	rotateCards([cardFrontSide, cardBackSide]);

	if (!firstPick) {
		firstPick = pokemonCard;
		isSelectPaused = false;
	} else {
		const firstPokemonName = firstPick.dataset.pokemonName;
		const secondPokemonName = pokemonCard.dataset.pokemonName;

		if (firstPokemonName !== secondPokemonName) {
			const [firstFront, firstBack] = getFrontAndBackFromCard(firstPick);
			setTimeout(() => {
				rotateCards([cardFrontSide, cardBackSide, firstFront, firstBack]);
				firstPick = null;
				isSelectPaused = false;
			}, 750);
		} else {
			currentScore++;
			firstPick.classList.add('matched');
			pokemonCard.classList.add('matched');
			if (currentScore === totalScore) {
				setTimeout(() => {
					displayHowLongPassed('reset-game');
					modalToggler('reset-game', 'open');
					stopGame();
					resetVariables();
					preparePokemonCardElements();
				}, 1000);
			}
			firstPick = null;
			isSelectPaused = false;
		}
	}
};

const rotateCards = (elements) => {
	if (typeof elements !== 'object' || !elements.length) return;
	elements.forEach((element) => element.classList.toggle('rotated'));
};

const getFrontAndBackFromCard = (card) => {
	const cardFrontSide = card.querySelector('.card__front');
	const cardBackSide = card.querySelector('.card__back');
	return [cardFrontSide, cardBackSide];
};

const displayHowLongPassed = (whichModal) => {
	if (whichModal === 'stop-game') {
		gameStopModal.querySelector('.how-long-passed__second').innerText = passedTimeElement.innerText;
	} else if (whichModal === 'reset-game') {
		gameResetModal.querySelector('.how-long-passed__second').innerText = passedTimeElement.innerText;
	}
};

const displayHowManyMatched = () => {
	gameStopModal.querySelector('.how-many-matched__score').innerText = currentScore;
};

gameStartButton.addEventListener('click', () => {
	modalToggler('start-game', 'close');
	startMusic();
	startGame();
});

gameStopButton.addEventListener('click', () => {
	displayHowLongPassed('stop-game');
	displayHowManyMatched();
	modalToggler('stop-game', 'open');
	stopGame();
	resetVariables();
	preparePokemonCardElements();
});

gameResetButtons.forEach((button) => {
	button.addEventListener('click', () => {
		modalElements.forEach((modalElement) => {
			if (!modalElement.classList.contains('modal--closed')) {
				modalElement.classList.add('modal--closed');
			}
		});
		startGame();
	});
});

preparePokemonCardElements();
