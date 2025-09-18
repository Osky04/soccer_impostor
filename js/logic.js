import { footballPlayers } from './constants.js';
import * as state from './state.js'; // Import state to access initialImpostors

export function assignRoles(playerNames, numImpostors, lastInnocentName, lastImpostors) {
    let innocentName;
    do {
        innocentName = footballPlayers[Math.floor(Math.random() * footballPlayers.length)];
    } while (innocentName === lastInnocentName && footballPlayers.length > 1);

    let shuffledPlayers;
    let newImpostors;
    let attempts = 0;
    const canChangeImpostors = playerNames.length > numImpostors && lastImpostors.length > 0;

    do {
        shuffledPlayers = [...playerNames].sort(() => 0.5 - Math.random());
        newImpostors = shuffledPlayers.slice(0, numImpostors).sort();
        attempts++;
    } while (
        canChangeImpostors &&
        JSON.stringify(newImpostors) === JSON.stringify(lastImpostors.sort()) &&
        attempts < 10 // Safety break
    );

    const playersWithRoles = shuffledPlayers.map((name, index) => ({
        name,
        role: index < numImpostors ? 'impostor' : 'innocent',
        displayName: index < numImpostors ? 'Impostor' : innocentName
    }));

    return { playersWithRoles: playersWithRoles.sort(() => 0.5 - Math.random()), innocentName };
}

export function determineWhoStarts(players, lastStartingPlayer) {
    if (players.length === 0) return { startingPlayer: '', direction: '' };

    let possibleStarters = players.filter(p => p !== lastStartingPlayer);
    if (possibleStarters.length === 0) {
        possibleStarters = players;
    }

    const startingPlayer = possibleStarters[Math.floor(Math.random() * possibleStarters.length)];
    const directions = ['la izquierda', 'la derecha'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return { startingPlayer, direction };
}

export function determineExpelledPlayer(currentVotesMap, remainingPlayersList) {
    if (currentVotesMap.size === 0) {
        // If no votes were cast (e.g., game started with 1 player, or error),
        // we'll treat it as no one being expelled and no tie.
        return { expelledPlayer: null, isTie: false };
    }

    let maxVotes = -1;
    let playersWithMaxVotes = [];

    for (const [playerName, voteCount] of currentVotesMap.entries()) {
        if (voteCount > maxVotes) {
            maxVotes = voteCount;
            playersWithMaxVotes = [playerName];
        } else if (voteCount === maxVotes) {
            playersWithMaxVotes.push(playerName);
        }
    }

    if (playersWithMaxVotes.length > 1) {
        // Tie detected, no one is expelled
        return { expelledPlayer: null, isTie: true };
    } else {
        // Clear winner or only one player voted for
        const expelledPlayerName = playersWithMaxVotes[0];
        const expelledPlayer = remainingPlayersList.find(p => p.name === expelledPlayerName);
        return { expelledPlayer, isTie: false };
    }
}

export function calculateVoteResult(expelledPlayerInfo, impostorsLeft, playersLeft, initialImpostorCount) {
    let message = '';
    let isGameOver = false;

    const expelledPlayer = expelledPlayerInfo.expelledPlayer;
    const expelledPlayerRole = expelledPlayer ? expelledPlayer.role : null;

    // First, determine if there's a tie
    if (expelledPlayerInfo.isTie) {
        message = `LA VOTACIÓN HA TERMINADO EN EMPATE.<br><br>NINGÚN JUGADOR FUE EXPULSADO.<br><br>SIGAN JUGANDO.`;
        isGameOver = false;
    } else if (!expelledPlayer) {
        // This should theoretically not happen if voting is correctly managed,
        // but it acts as a safeguard.
        message = `No se pudo determinar un resultado de la votación. Sigan jugando.`;
        isGameOver = false;
    } else {
        // A player was expelled. Now check win conditions.

        // Check for IMPOSOTOR VICTORY (by numbers)
        // This condition uses 'playersLeft' which is state.getRemainingPlayers() AFTER expulsion,
        // and 'impostorsLeft' which is state.getRemainingImpostors() AFTER expulsion.
        if (impostorsLeft >= playersLeft.length - impostorsLeft) {
            let victoryReason = `Los <span class=\"impostor-text\">impostores</span> han igualado en número a los inocentes.`;

            const allInitialImpostors = state.getInitialImpostors();
            const currentImpostorPlayers = playersLeft.filter(p => p.role === 'impostor'); // Impostors still in game
            
            // Impostors who started but are NOT among currentImpostorPlayers (meaning they were expelled)
            const eliminatedImpostorPlayers = allInitialImpostors.filter(
                initialImp => !currentImpostorPlayers.some(currentImp => currentImp.name === initialImp.name)
            );

            // Combine all impostor names (eliminated + current)
            const allWinningImpostorNames = [...eliminatedImpostorPlayers, ...currentImpostorPlayers]
                .map(p => `<span class="impostor-text">${p.name}</span>`);

            let victoryDeclaration;
            if (allWinningImpostorNames.length === 1) { // Only one impostor ever started
                victoryDeclaration = `El ganador es ${allWinningImpostorNames[0]}.`;
            } else { // Two or more impostors started
                let impostorNamesFormatted;
                if (allWinningImpostorNames.length > 2) {
                    impostorNamesFormatted = allWinningImpostorNames.slice(0, -1).join(', ') + ' y ' + allWinningImpostorNames[allWinningImpostorNames.length - 1];
                } else { // Exactly two impostors
                    impostorNamesFormatted = allWinningImpostorNames.join(' y ');
                }
                victoryDeclaration = `Los ganadores son ${impostorNamesFormatted}.`;
            }
            message = `${victoryReason} <br><br>${victoryDeclaration}`;
            isGameOver = true;
        }

        // If impostors haven't won by numbers, check other outcomes
        if (!isGameOver) {
            if (expelledPlayerRole === 'impostor') {
                if (impostorsLeft === 0) { // All impostors expelled, innocents win
                    if (initialImpostorCount > 1) {
                        message = `<span class=\"player-name\">${expelledPlayer.name}</span> era el último <span class=\"impostor-text\">impostor</span>. <br><br>¡HAN GANADO LOS INOCENTES!`;
                    } else { // only one impostor
                        message = `<span class=\"player-name\">${expelledPlayer.name}</span> era el <span class=\"impostor-text\">impostor</span>. <br><br>¡HAN GANADO LOS INOCENTES!`;
                    }
                    isGameOver = true;
                } else { // Impostor expelled, but more remain, game continues
                    message = `¡MUY BIEN! <span class=\"player-name\">${expelledPlayer.name}</span> era un <span class=\"impostor-text\">impostor</span>. <br><br>QUEDA(N) ${impostorsLeft} IMPOSTOR(ES).`;
                }
            } else { // Innocent expelled, game continues
                message = `<span class=\"player-name\">${expelledPlayer.name}</span> era <span class=\"innocent-text\">inocente</span>. <br><br>Sigan jugando.`;
            }
        }
    }

    return { message, isGameOver };
}