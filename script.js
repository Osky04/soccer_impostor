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
    const restartGameBtn = document.getElementById('restart-game-btn');
    const whoStartsBtn = document.getElementById('who-starts-btn');
    const gameInstructions = document.getElementById('game-instructions');
    const startInfo = document.getElementById('start-info');

    let players = [];
    let impostorCount = 1;
    let lastInnocentName = null; // Variable to track the last used football player
    let lastImpostors = []; // Variable to track the last impostors
    let lastStartingPlayer = null; // Variable to track who started last

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
        if (startGameBtn) {
            startGameBtn.disabled = players.length < 3;
        }

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
            lastImpostors = []; // Reset impostor history if the player list changes
            lastStartingPlayer = null; // Reset last starting player
            updatePlayerList();
        } else if (players.includes(name)) {
            alert('¡Ese jugador ya está en la lista!');
        }
        playerNameInput.focus();
    }

    function removePlayer(indexToRemove) {
        players = players.filter((_, index) => index !== indexToRemove);
        lastImpostors = []; // Reset impostor history if the player list changes
        lastStartingPlayer = null; // Reset last starting player
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

    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }

    // --- Lógica del Juego ---

    function startGame() {
        // Asignar roles
        const gameData = assignRoles(players, impostorCount);
        
        // Actualizar instrucciones
        const impostorText = impostorCount > 1 ? 'los impostores' : 'el impostor';
        gameInstructions.textContent = `El jugador a nombrar es ${gameData.innocentName}. ¡Descubrid a ${impostorText}!`;
        startInfo.style.display = 'none'; // Ocultar al iniciar

        // Crear las tarjetas
        createCards(gameData.playersWithRoles);

        // Cambiar de pantalla
        setupScreen.classList.remove('active');
        gameScreen.classList.add('active');
    }

    function assignRoles(playerNames, numImpostors) {
        const footballPlayers = [
            // --- 20 Jugadores Colombianos Emblemáticos ---
            'Carlos Valderrama', 'Radamel Falcao', 'James Rodríguez', 'Faustino Asprilla', 'René Higuita', 
            'Freddy Rincón', 'Iván Córdoba', 'Mario Yepes', 'Juan Cuadrado', 'Luis Díaz',
            'David Ospina', 'Arnoldo Iguarán', 'Willington Ortiz', 'Carlos Bacca', 'Jackson Martínez',
            'Teófilo Gutiérrez', 'Faryd Mondragón', 'Leonel Álvarez', 'Andrés Escobar', 'Adolfo Valencia',

            // --- 200 Jugadores Más Conocidos del Mundo (Retirados y Actuales) ---
            // Porteros
            'Lev Yashin', 'Gianluigi Buffon', 'Iker Casillas', 'Manuel Neuer', 'Oliver Kahn', 
            'Peter Schmeichel', 'Dino Zoff', 'Edwin van der Sar', 'Petr Čech', 'Thibaut Courtois', 
            'Alisson Becker', 'Keylor Navas',

            // Defensas
            'Pelé', // A menudo listado como delantero, pero su leyenda trasciende posiciones
            'Franz Beckenbauer', 'Paolo Maldini', 'Franco Baresi', 'Bobby Moore', 'Cafu', 
            'Roberto Carlos', 'Carles Puyol', 'Fabio Cannavaro', 'Alessandro Nesta', 'Sergio Ramos', 
            'Javier Zanetti', 'Lilian Thuram', 'Rio Ferdinand', 'John Terry', 'Nemanja Vidić', 
            'Gerard Piqué', 'Dani Alves', 'Marcelo', 'Thiago Silva', 'Virgil van Dijk', 
            'Giorgio Chiellini', 'Philipp Lahm', 'Ashley Cole', 'Raphaël Varane', 'David Alaba',

            // Centrocampistas
            'Diego Maradona', 'Johan Cruyff', 'Zinedine Zidane', 'Alfredo Di Stéfano', 'Michel Platini', 
            'Xavi Hernández', 'Andrés Iniesta', 'Luka Modrić', 'Andrea Pirlo', 'Paul Scholes', 
            'Steven Gerrard', 'Frank Lampard', 'Kaká', 'Lothar Matthäus', 'Zico', 
            'Sócrates', 'Patrick Vieira', 'Roy Keane', 'Kevin De Bruyne', 'Toni Kroos', 
            'N\'Golo Kanté', 'Ryan Giggs', 'David Beckham', 'Claude Makélélé', 'Edgar Davids', 
            'Pavel Nedvěd', 'Gheorghe Hagi', 'Luis Figo', 'Rivaldo', 'Juan Román Riquelme', 
            'Cesc Fàbregas', 'Sergio Busquets', 'Xabi Alonso', 'Bastian Schweinsteiger', 'Arjen Robben', 
            'Franck Ribéry', 'Wesley Sneijder', 'David Silva', 'Yaya Touré', 'Eden Hazard', 
            'Mesut Özil', 'Ángel Di María', 'Paul Pogba', 'Bruno Fernandes', 'Casemiro', 
            'Jude Bellingham', 'Pedri', 'Gavi', 'Thomas Müller', 'Santi Cazorla',

            // Delanteros
            'Lionel Messi', 'Cristiano Ronaldo', 'Ronaldo Nazário', 'Ronaldinho', 'Ferenc Puskás', 
            'Gerd Müller', 'Eusébio', 'Marco van Basten', 'Thierry Henry', 'Gabriel Batistuta', 
            'Romário', 'Dennis Bergkamp', 'Raúl González', 'Andriy Shevchenko', 'Didier Drogba',
            'Samuel Eto\'o', 'Zlatan Ibrahimović', 'Wayne Rooney', 'Luis Suárez', 'Robert Lewandowski', 
            'Karim Benzema', 'Kylian Mbappé', 'Erling Haaland', 'Neymar Jr.', 'Mohamed Salah', 
            'Sadio Mané', 'Vini Jr.', 'Harry Kane', 'Antoine Griezmann', 'Son Heung-min',
            'George Best', 'Kenny Dalglish', 'Éric Cantona', 'Alan Shearer', 'Michael Owen',
            'Francesco Totti', 'Alessandro Del Piero', 'Roberto Baggio', 'Filippo Inzaghi', 'Ruud van Nistelrooy',
            'Robin van Persie', 'David Villa', 'Fernando Torres', 'Sergio Agüero', 'Edinson Cavani',
            'Diego Forlán', 'Hristo Stoichkov', 'George Weah', 'Adriano', 'Carlos Tevez'
        ];
        
        let innocentName;
        do {
            innocentName = footballPlayers[Math.floor(Math.random() * footballPlayers.length)];
        } while (innocentName === lastInnocentName && footballPlayers.length > 1);
        lastInnocentName = innocentName;
        
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
            attempts < 10 // Safety break to prevent infinite loops
        );

        lastImpostors = newImpostors.slice(); // Store a copy of the new impostors
        
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
                // No permitir voltear si ya hay un timeout pendiente para evitar bugs
                if (card.dataset.flipping === 'true') return;

                card.classList.toggle('flipped');

                // Si la carta se ha volteado para mostrar el rol
                if (card.classList.contains('flipped')) {
                    card.dataset.flipping = 'true'; // Marcar que hay un flip en proceso
                    setTimeout(() => {
                        card.classList.remove('flipped');
                        // Usamos otro timeout corto para que la animación termine antes de poder volver a clickear
                        setTimeout(() => {
                           delete card.dataset.flipping;
                        }, 300); // Debe ser menor a la duración de la animación
                    }, 1800); // Reducido de 3000ms a 1800ms
                }
            });

            cardsContainer.appendChild(card);
        });
    }

    // --- Lógica para decidir quién inicia ---
    function whoStarts() {
        if (players.length === 0) return;

        // Intentar no repetir el jugador que inició la última vez
        let possibleStarters = players.filter(p => p !== lastStartingPlayer);
        if (possibleStarters.length === 0) {
            possibleStarters = players; // Fallback si solo hay un jugador o si no se puede evitar la repetición
        }

        const startingPlayer = possibleStarters[Math.floor(Math.random() * possibleStarters.length)];
        lastStartingPlayer = startingPlayer;

        const directions = ['la izquierda', 'la derecha'];
        const direction = directions[Math.floor(Math.random() * directions.length)];

        startInfo.textContent = `¡Empieza ${startingPlayer}! El juego va hacia ${direction}.`;
        startInfo.style.display = 'block';
    }

    // --- Lógica de Reinicio ---

    function restartGame() {
        // No borramos los jugadores para poder jugar otra ronda con los mismos.
        // players = [];
        // updatePlayerList();
        gameScreen.classList.remove('active');
        setupScreen.classList.add('active');
        // Reset instructions text to its default state for the next round's assignments
        gameInstructions.textContent = 'Que nadie más vea tu rol. ¡Mantenlo en secreto!';
        lastStartingPlayer = null; // Reset so the next round can pick anyone first
    }

    if (restartGameBtn) {
        restartGameBtn.addEventListener('click', restartGame);
    }
    
    if (whoStartsBtn) {
        whoStartsBtn.addEventListener('click', whoStarts);
    }
});