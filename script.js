document.addEventListener('DOMContentLoaded', () => {
    // Elementos de la pantalla de configuración
    const setupScreen = document.getElementById('setup-screen');
    const playerNameInput = document.getElementById('player-name-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerList = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game-btn');
    const decreaseImpostorsBtn = document.getElementById('decrease-impostors');
    const increaseImpostorsBtn = document.getElementById('increase-impostors');
    const impostorCountSpan = document.getElementById('impostor-count');

    // Elementos de la pantalla de juego
    const gameScreen = document.getElementById('game-screen');
    const cardsContainer = document.getElementById('cards-container');
    const restartBtn = document.getElementById('restart-btn');
    const gameInstructions = document.getElementById('game-instructions');

    let players = [];
    let impostorCount = 1;

    // --- Lógica de Configuración ---

    function updateImpostorControls() {
        const minImpostors = 1;
        const maxImpostors = players.length >= 3 ? players.length - 2 : 1;

        if (impostorCount > maxImpostors) {
            impostorCount = maxImpostors;
        }
        if (impostorCount < minImpostors) {
            impostorCount = minImpostors;
        }

        impostorCountSpan.textContent = impostorCount;

        decreaseImpostorsBtn.disabled = impostorCount <= minImpostors;
        increaseImpostorsBtn.disabled = impostorCount >= maxImpostors || players.length < 3;
    }

    function updatePlayerList() {
        playerList.innerHTML = '';
        players.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            const span = document.createElement('span');
            span.textContent = player;
            li.appendChild(span);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => removePlayer(index);
            li.appendChild(deleteBtn);
            
            playerList.appendChild(li);
        });

        // Habilitar el botón de inicio solo si hay entre 3 y 15 jugadores
        startGameBtn.disabled = players.length < 3;

        // Deshabilitar el formulario de añadir jugador si se alcanza el máximo
        const maxPlayersReached = players.length >= 15;
        playerNameInput.disabled = maxPlayersReached;
        addPlayerBtn.disabled = maxPlayersReached;
        if (maxPlayersReached) {
            playerNameInput.placeholder = 'Máximo de 15 jugadores';
        } else {
            playerNameInput.placeholder = 'Nombre del jugador';
        }
        
        updateImpostorControls();
    }

    function addPlayer() {
        if (players.length >= 15) {
            alert('Se ha alcanzado el número máximo de 15 jugadores.');
            return;
        }
        const name = playerNameInput.value.trim();
        if (name && !players.includes(name)) {
            players.push(name);
            playerNameInput.value = '';
            updatePlayerList();
        } else if (players.includes(name)) {
            alert('¡Ese jugador ya está en la lista!');
        }
        playerNameInput.focus();
    }

    function removePlayer(indexToRemove) {
        players = players.filter((_, index) => index !== indexToRemove);
        updatePlayerList();
    }

    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });

    decreaseImpostorsBtn.addEventListener('click', () => {
        if (impostorCount > 1) {
            impostorCount--;
            updateImpostorControls();
        }
    });

    increaseImpostorsBtn.addEventListener('click', () => {
        const maxImpostors = players.length - 2;
        if (impostorCount < maxImpostors) {
            impostorCount++;
            updateImpostorControls();
        }
    });

    startGameBtn.addEventListener('click', startGame);

    // --- Lógica del Juego ---

    function startGame() {
        // Asignar roles
        const gameData = assignRoles(players, impostorCount);
        
        // Actualizar instrucciones
        const impostorText = impostorCount > 1 ? 'los impostores' : 'el impostor';
        gameInstructions.textContent = `El jugador a nombrar es ${gameData.innocentName}. ¡Descubrid a ${impostorText}!`;

        // Crear las tarjetas
        createCards(gameData.playersWithRoles);

        // Cambiar de pantalla
        setupScreen.classList.remove('active');
        gameScreen.classList.add('active');
    }

    function assignRoles(playerNames, numImpostors) {
        const footballPlayers = [
            'Lionel Messi', 'Cristiano Ronaldo', 'Neymar Jr.', 'Kylian Mbappé', 'Diego Maradona', 
            'Pelé', 'Zinedine Zidane', 'Johan Cruyff', 'Ronaldinho', 'Ronaldo Nazário',
            'Andrés Iniesta', 'Xavi Hernández', 'Franz Beckenbauer', 'Alfredo Di Stéfano',
            'Michel Platini', 'Gerd Müller', 'Paolo Maldini', 'Franco Baresi', 'Zlatan Ibrahimović',
            'Thierry Henry', 'Karim Benzema', 'Luka Modrić', 'Kevin De Bruyne', 'Mohamed Salah',
            'Sadio Mané', 'Robert Lewandowski', 'Erling Haaland', 'Vini Jr.', 'Jude Bellingham'
        ];
        
        const innocentName = footballPlayers[Math.floor(Math.random() * footballPlayers.length)];
        
        const shuffledPlayers = [...playerNames].sort(() => 0.5 - Math.random());
        
        const playersWithRoles = shuffledPlayers.map((name, index) => ({
            name,
            role: index < numImpostors ? 'impostor' : 'innocent',
            displayName: index < numImpostors ? 'Impostor' : innocentName
        }));

        return { playersWithRoles: playersWithRoles.sort(() => 0.5 - Math.random()), innocentName };
    }

    function createCards(gameData) {
        cardsContainer.innerHTML = '';
        gameData.forEach(player => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.playerName = player.name;

            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';

            // Cara frontal
            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';
            const nameElement = document.createElement('span');
            nameElement.className = 'card-front-name';
            nameElement.textContent = player.name;
            cardFront.appendChild(nameElement);

            // Cara trasera
            const cardBack = document.createElement('div');
            cardBack.className = `card-face card-back ${player.role}`;
            
            const roleName = document.createElement('span');
            roleName.className = 'card-back-role';
            roleName.textContent = player.displayName;
            cardBack.appendChild(roleName);
            
            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            card.appendChild(cardInner);

            card.addEventListener('click', () => {
                card.classList.toggle('flipped');
            });

            cardsContainer.appendChild(card);
        });
    }

    // --- Lógica de Reinicio ---

    function restartGame() {
        // No borramos los jugadores para poder jugar otra ronda con los mismos.
        // players = [];
        // updatePlayerList();
        gameScreen.classList.remove('active');
        setupScreen.classList.add('active');
        gameInstructions.textContent = 'Que nadie más vea tu rol. ¡Mantenlo en secreto!';
    }

    restartBtn.addEventListener('click', restartGame);
});