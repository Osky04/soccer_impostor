// This module manages the application's state.

let players = [];
let impostorCount = 1;
let playersWithRoles = [];
let initialImpostors = []; // New: Stores the initial impostor player objects
let remainingPlayers = [];
let remainingImpostors = 0;
let selectedPlayerToVote = null; // Will store the name of the player expelled, or null if tie/no one expelled
let lastInnocentName = null;
let lastImpostors = [];
let lastStartingPlayer = null;
let viewedCards = new Set(); // New: To track revealed cards

// New: State for voting
let currentVotes = new Map(); // Stores votes for each player: {playerName: voteCount}
let votesCastCount = 0;       // Total number of votes cast by players

// --- Getters ---
export const getPlayers = () => players;
export const getImpostorCount = () => impostorCount;
export const getRemainingPlayers = () => remainingPlayers;
export const getRemainingImpostors = () => remainingImpostors;
export const getSelectedPlayerToVote = () => selectedPlayerToVote;
export const getLastInnocentName = () => lastInnocentName;
export const getLastImpostors = () => lastImpostors;
export const getLastStartingPlayer = () => lastStartingPlayer;
export const getPlayersWithRoles = () => playersWithRoles; // New: Getter for playersWithRoles
export const getInitialImpostors = () => initialImpostors; // New getter

// New: Getters for voting state
export const getCurrentVotes = () => currentVotes;
export const getVotesCastCount = () => votesCastCount;
export const getPlayersEligibleToVoteCount = () => remainingPlayers.length; // Number of players who should vote

// --- Setters and Mutators ---
export function addPlayer(name) {
    players.push(name);
}

export function removePlayer(index) {
    players.splice(index, 1);
}

export function setImpostorCount(count) {
    impostorCount = count;
}

export function setSelectedPlayerToVote(name) {
    selectedPlayerToVote = name;
}

export function setLastStartingPlayer(name) {
    lastStartingPlayer = name;
}

export function initializeGameState(initialPlayersWithRoles, initialImpostorCount, innocentName) {
    playersWithRoles = initialPlayersWithRoles;
    initialImpostors = initialPlayersWithRoles.filter(p => p.role === 'impostor'); // New: Populate initialImpostors
    remainingPlayers = [...playersWithRoles];
    remainingImpostors = initialImpostorCount;
    lastInnocentName = innocentName;
    lastImpostors = playersWithRoles.filter(p => p.role === 'impostor').map(p => p.name);
    lastStartingPlayer = null; // Reset starting player for a new game round after roles
    viewedCards.clear(); // New: Reset viewed cards for a new game

    // Reset voting state for a new game
    resetVotingState();
}

export function updateAfterVote(expelledPlayerName, wasImpostor) {
    remainingPlayers = remainingPlayers.filter(p => p.name !== expelledPlayerName);
    if (wasImpostor) {
        remainingImpostors--;
    }
}

export function resetGameTracking() {
    lastImpostors = [];
    lastStartingPlayer = null;
    viewedCards.clear(); // New: Reset viewed cards when game tracking is reset
    resetVotingState(); // Reset voting state when game tracking is reset
}

export function resetStateForNewGame() {
    // Keep players array intact as per user request
    impostorCount = 1; // Reset impostor count to default
    initialImpostors = []; // New: Reset initialImpostors
    resetGameTracking();
}

// New: Functions for tracking viewed cards
export function markCardAsViewed(playerName) {
    viewedCards.add(playerName);
}

export function areAllCardsViewed(totalPlayersCount) {
    return viewedCards.size === totalPlayersCount;
}

// Added: Function to reset viewed cards explicitly
export function resetViewedCards() {
    viewedCards.clear();
}

// New: Voting State Management
export function resetVotingState() {
    currentVotes.clear();
    votesCastCount = 0;
    selectedPlayerToVote = null; // Also reset selected player for vote
}

export function recordVote(votedForPlayerName) {
    // Increment vote count for the target player
    currentVotes.set(votedForPlayerName, (currentVotes.get(votedForPlayerName) || 0) + 1);
    // Increment total votes cast
    votesCastCount++;
}