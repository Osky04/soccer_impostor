// This is the main script file. It has been refactored to use modules
// for better organization and maintainability.

import * as state from './js/state.js';
import * as ui from './js/ui.js';
import * as logic from './js/logic.js';

// --- Event Handlers ---

function handleAddPlayer() {
    if (state.getPlayers().length >= 15) {
        alert('Se ha alcanzado el número máximo de 15 jugadores.');
        return;
    }
    const name = ui.elements.playerNameInput.value.trim();
    if (name && !state.getPlayers().includes(name)) {
        state.addPlayer(name);
        ui.elements.playerNameInput.value = '';
        state.resetGameTracking();
        ui.updateSetupScreen(state.getPlayers(), state.getImpostorCount());
    } else if (state.getPlayers().includes(name)) {
        alert('¡Ese jugador ya está en la lista!');
    }
    ui.elements.playerNameInput.focus();
}

function handleRemovePlayer(indexToRemove) {
    state.removePlayer(indexToRemove);
    state.resetGameTracking();
    ui.updateSetupScreen(state.getPlayers(), state.getImpostorCount());
}

function handleImpostorCountChange(amount) {
    const players = state.getPlayers();
    const currentCount = state.getImpostorCount();
    const newCount = currentCount + amount;
    const minImpostors = 1;
    const maxImpostors = players.length >= 3 ? players.length - 2 : 1;

    if (newCount >= minImpostors && newCount <= maxImpostors) {
        state.setImpostorCount(newCount);
        ui.updateImpostorControls(state.getImpostorCount(), players.length);
    }
}

function handleCardViewed(playerName) {
    state.markCardAsViewed(playerName);
    const totalPlayers = state.getPlayersWithRoles().length;
    const allCardsViewed = state.areAllCardsViewed(totalPlayers);
    ui.updateGameScreenButtons(allCardsViewed);
}

function handleStartGame() {
    const players = state.getPlayers();
    const impostorCount = state.getImpostorCount();
    const { playersWithRoles, innocentName } = logic.assignRoles(
        players,
        impostorCount,
        state.getLastInnocentName(),
        state.getLastImpostors()
    );

    state.initializeGameState(playersWithRoles, impostorCount, innocentName);
    ui.setupGameScreen(playersWithRoles);
    ui.showScreen('game-screen');
}

function handleWhoStarts() {
    // Only determine who starts if on game screen, not results
    const activeScreen = document.querySelector('.screen.active');
    let playersForStartDetermination = state.getPlayers();
    
    // If on game screen, use all initial players
    // If on results screen (after a player was expelled), use remaining players
    if (activeScreen.id === 'results-screen') {
        playersForStartDetermination = state.getRemainingPlayers().map(p => p.name);
    }

    const { startingPlayer, direction } = logic.determineWhoStarts(
        playersForStartDetermination,
        state.getLastStartingPlayer()
    );
    state.setLastStartingPlayer(startingPlayer);
    const message = `¡Empieza ${startingPlayer}! El juego va hacia ${direction}.`;

    if (activeScreen.id === 'game-screen') {
        ui.elements.startInfo.textContent = message;
        ui.elements.startInfo.style.display = 'block';
    } else if (activeScreen.id === 'results-screen') {
        ui.elements.startInfoResults.textContent = message;
        ui.elements.startInfoResults.style.display = 'block';
    }
}

function handleVote() {
    state.resetVotingState(); // Reset votes for the new round
    ui.setupVotingScreen(state.getRemainingPlayers());
    ui.updateVoteProgress(state.getVotesCastCount(), state.getPlayersEligibleToVoteCount());
    ui.showScreen('voting-screen');
}

function handleCastVote(votedForPlayerName) { // New function to handle each individual vote
    state.recordVote(votedForPlayerName);
    ui.updateVoteProgress(state.getVotesCastCount(), state.getPlayersEligibleToVoteCount());

    if (state.getVotesCastCount() === state.getPlayersEligibleToVoteCount()) {
        // All votes are in, automatically determine result
        handleShowVoteResultAutomated();
    }
}

function handleShowVoteResultAutomated() { // New function for automated result display
    const { expelledPlayer, isTie } = logic.determineExpelledPlayer(
        state.getCurrentVotes(),
        state.getRemainingPlayers()
    );

    let finalExpelledPlayer = null;

    if (!isTie && expelledPlayer) {
        state.setSelectedPlayerToVote(expelledPlayer.name);
        state.updateAfterVote(expelledPlayer.name, expelledPlayer.role === 'impostor');
        finalExpelledPlayer = expelledPlayer;
    } else {
        state.setSelectedPlayerToVote(null); // No one was expelled
    }
    
    const { message, isGameOver } = logic.calculateVoteResult(
        { expelledPlayer: finalExpelledPlayer, isTie: isTie },
        state.getRemainingImpostors(),
        state.getRemainingPlayers(),
        state.getImpostorCount()
    );

    ui.displayVoteResult(message, isGameOver);
    ui.showScreen('results-screen');
}

function handleNextRound() {
    const playerToRemove = state.getSelectedPlayerToVote();
    if (playerToRemove) { // Only remove if a player was actually expelled
        ui.removePlayerCard(playerToRemove);
    }
    state.resetVotingState(); // Ensure voting state is clean for next round
    // No need to reset viewed cards here as per previous instruction
    // The cards might be from previous rounds and if no one was expelled, they should stay flipped.
    // If a new round starts with an expelled player, the remaining players still have their cards marked as viewed if they viewed them.

    const totalPlayers = state.getPlayersWithRoles().length; // Get initial total players to check viewed cards correctly
    ui.updateGameScreenButtons(state.areAllCardsViewed(totalPlayers)); // Re-evaluate button state
    ui.showScreen('game-screen');
}

function handleNewGame() {
    state.resetStateForNewGame();
    ui.updateSetupScreen(state.getPlayers(), state.getImpostorCount());
    ui.showScreen('setup-screen');
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    ui.init(handleRemovePlayer, handleCardViewed, handleCastVote); // Modified: Added handleCastVote

    // Setup Screen
    ui.elements.addPlayerBtn.addEventListener('click', handleAddPlayer);
    ui.elements.playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddPlayer();
    });
    ui.elements.decreaseImpostorsBtn.addEventListener('click', () => handleImpostorCountChange(-1));
    ui.elements.increaseImpostorsBtn.addEventListener('click', () => handleImpostorCountChange(1));
    ui.elements.startGameBtn.addEventListener('click', handleStartGame);

    // Game Screen
    ui.elements.whoStartsBtn.addEventListener('click', handleWhoStarts);
    ui.elements.voteBtn.addEventListener('click', handleVote);

    // Voting Screen - No explicit "show results" button needed anymore, results are automatic

    // Results Screen
    ui.elements.nextRoundBtn.addEventListener('click', handleNextRound);
    ui.elements.newGameBtn.addEventListener('click', handleNewGame);

    // Initial UI setup
    ui.updateSetupScreen(state.getPlayers(), state.getImpostorCount());
});