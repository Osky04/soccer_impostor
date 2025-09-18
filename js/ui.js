// This module handles all DOM interactions and UI updates.

// --- Element Cache ---
export const elements = {
    // Screens
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    votingScreen: document.getElementById('voting-screen'),
    resultsScreen: document.getElementById('results-screen'),

    // Setup Screen
    playerNameInput: document.getElementById('player-name-input'),
    addPlayerBtn: document.getElementById('add-player-btn'),
    playerList: document.getElementById('player-list'),
    startGameBtn: document.getElementById('start-game-btn'),
    decreaseImpostorsBtn: document.getElementById('decrease-impostors'),
    increaseImpostorsBtn: document.getElementById('increase-impostors'),
    impostorCountSpan: document.getElementById('impostor-count'),

    // Game Screen
    cardsContainer: document.getElementById('cards-container'),
    whoStartsBtn: document.getElementById('who-starts-btn'),
    startInfo: document.getElementById('start-info'),
    voteBtn: document.getElementById('vote-btn'),

    // Voting Screen
    voteListContainer: document.getElementById('vote-list-container'),
    voteProgressDisplay: document.getElementById('vote-progress'), // New element for vote progress

    // Results Screen
    resultMessage: document.getElementById('result-message'),
    startInfoResults: document.getElementById('start-info-results'),
    nextRoundBtn: document.getElementById('next-round-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
};

let removePlayerHandler = () => {};
let onCardViewedCallback = () => {};
let onPlayerVoteCallback = () => {}; // New: Callback for when a vote is cast

// New: Track the currently selected vote button and its highlight timeout
let currentSelectedVoteButton = null;
let currentHighlightTimeoutId = null;

export function init(onRemovePlayer, onCardViewed, onPlayerVote) { // Modified: Added onPlayerVote parameter
    removePlayerHandler = onRemovePlayer;
    onCardViewedCallback = onCardViewed;
    onPlayerVoteCallback = onPlayerVote; // New: Assign callback
}

// --- Screen Management ---
export function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === screenId);
    });
}

// --- Setup Screen UI ---
export function updatePlayerList(players) {
    elements.playerList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';

        const span = document.createElement('span');
        span.textContent = player;
        li.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => removePlayerHandler(index);
        li.appendChild(deleteBtn);

        elements.playerList.appendChild(li);
    });
}

export function updateImpostorControls(impostorCount, playerCount) {
    const minImpostors = 1;
    const maxImpostors = playerCount >= 3 ? playerCount - 2 : 1;

    elements.impostorCountSpan.textContent = impostorCount;
    elements.decreaseImpostorsBtn.disabled = impostorCount <= minImpostors;
    elements.increaseImpostorsBtn.disabled = impostorCount >= maxImpostors || playerCount < 3;
}

export function updateSetupScreen(players, impostorCount) {
    updatePlayerList(players);
    updateImpostorControls(impostorCount, players.length);

    elements.startGameBtn.disabled = players.length < 3;
    const maxPlayersReached = players.length >= 15;
    elements.playerNameInput.disabled = maxPlayersReached;
    elements.addPlayerBtn.disabled = maxPlayersReached;
    elements.playerNameInput.placeholder = maxPlayersReached ? 'Máximo de 15 jugadores' : 'Nombre del jugador';
}

// --- Game Screen UI ---
function createCard(player) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.playerName = player.name;

    card.innerHTML = `
        <div class="card-inner">
            <div class="card-face card-front">
                <span class="card-front-name">${player.name}</span>
                <div class="card-viewed-mark">&#10003;</div>
            </div>
            <div class="card-face card-back ${player.role}">
                <span class="card-back-role">${player.displayName}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        if (card.classList.contains('viewed') || card.dataset.flipping === 'true') return;
        card.classList.add('flipped');
        card.dataset.flipping = 'true';
        setTimeout(() => {
            card.classList.remove('flipped');
            card.classList.add('viewed');
            delete card.dataset.flipping;
            onCardViewedCallback(player.name);
        }, 1800);
    });

    return card;
}

export function setupGameScreen(playersWithRoles) {
    elements.cardsContainer.innerHTML = '';
    playersWithRoles.forEach(player => {
        const cardElement = createCard(player);
        elements.cardsContainer.appendChild(cardElement);
    });
    elements.startInfo.style.display = 'none';
    elements.startInfoResults.style.display = 'none';
    elements.whoStartsBtn.disabled = true;
    elements.voteBtn.disabled = true;
}

export function updateGameScreenButtons(allCardsViewed) {
    elements.whoStartsBtn.disabled = !allCardsViewed;
    elements.voteBtn.disabled = !allCardsViewed;
}

export function removePlayerCard(playerName) {
    const cardToRemove = elements.cardsContainer.querySelector(`.card[data-player-name="${playerName}"]`);
    if (cardToRemove) {
        cardToRemove.remove();
    }
}

export function updateStartInfo(message) {
    elements.startInfo.textContent = message;
    elements.startInfo.style.display = 'block';
    elements.startInfoResults.textContent = message;
    elements.startInfoResults.style.display = 'block';
}

// --- Voting Screen UI ---
export function setupVotingScreen(remainingPlayers) {
    elements.voteListContainer.innerHTML = '';
    elements.voteProgressDisplay.style.display = 'block';

    // Clear any previous highlight state when setting up the screen
    if (currentSelectedVoteButton) {
        currentSelectedVoteButton.classList.remove('selected');
        currentSelectedVoteButton = null;
    }
    if (currentHighlightTimeoutId) {
        clearTimeout(currentHighlightTimeoutId);
        currentHighlightTimeoutId = null;
    }

    remainingPlayers.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
        const voteButton = document.createElement('button');
        voteButton.className = 'vote-button';
        voteButton.textContent = player.name;
        voteButton.dataset.playerName = player.name;
        voteButton.addEventListener('click', () => {
            // Clear any existing highlight and its timeout before applying new one
            if (currentSelectedVoteButton) {
                currentSelectedVoteButton.classList.remove('selected');
            }
            if (currentHighlightTimeoutId) {
                clearTimeout(currentHighlightTimeoutId);
            }

            // Apply highlight to the newly clicked button
            voteButton.classList.add('selected');

            // Update tracking variables
            currentSelectedVoteButton = voteButton;
            currentHighlightTimeoutId = setTimeout(() => {
                // This timeout belongs to the current 'voteButton'
                voteButton.classList.remove('selected');
                // If this button is still the globally tracked one, clear global tracking
                if (currentSelectedVoteButton === voteButton) {
                    currentSelectedVoteButton = null;
                    currentHighlightTimeoutId = null;
                }
            }, 1000); // Remove 'selected' class after 1 second

            onPlayerVoteCallback(player.name); // Call the new voting callback
        });
        elements.voteListContainer.appendChild(voteButton);
    });
}

export function updateVoteProgress(currentVotesCount, totalPlayersToVote) { // New: Function to update vote progress
    elements.voteProgressDisplay.textContent = `${currentVotesCount}/${totalPlayersToVote} Votos`;
}

// --- Results Screen UI ---
export function displayVoteResult(message, isGameOver) {
    elements.resultMessage.innerHTML = message;
    elements.nextRoundBtn.style.display = isGameOver ? 'none' : 'block';
    elements.newGameBtn.style.display = isGameOver ? 'block' : 'none';
    elements.startInfoResults.style.display = 'none';
    elements.voteProgressDisplay.style.display = 'none'; // Hide vote progress on results screen
}