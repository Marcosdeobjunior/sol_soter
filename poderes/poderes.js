document.addEventListener('DOMContentLoaded', () => {
    const generatePowersBtn = document.getElementById('generate-powers');
    const startBattleBtn = document.getElementById('start-battle');
    const power1Display = document.getElementById('power1');
    const power2Display = document.getElementById('power2');
    const logEntries = document.getElementById('log-entries');
    const savedPowersList = document.getElementById('saved-powers-list');

    let currentPowers = { power1: null, power2: null };

    const powerTypes = ['Fogo', 'Água', 'Terra', 'Ar', 'Luz', 'Escuridão', 'Elétrico', 'Gelo'];
    const rarities = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
    const resourceNames = {'Fogo': 'Mana', 'Água': 'Mana', 'Terra': 'Energia', 'Ar': 'Ki', 'Luz': 'Fé', 'Escuridão': 'Corrupção', 'Elétrico': 'Carga', 'Gelo': 'Frio'};

    // Type advantages (e.g., Fogo > Gelo, Gelo > Água, Água > Fogo)
    const typeAdvantages = {
        'Fogo': 'Gelo',
        'Gelo': 'Água',
        'Água': 'Fogo',
        'Terra': 'Elétrico',
        'Elétrico': 'Ar',
        'Ar': 'Terra',
        'Luz': 'Escuridão',
        'Escuridão': 'Luz'
    };

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomElement(arr) {
        return arr[getRandomInt(0, arr.length - 1)];
    }

    function generatePowerName(type, rarity) {
        const prefixes = {
            'Fogo': ['Chama', 'Fúria', 'Calor'],
            'Água': ['Onda', 'Corrente', 'Maré'],
            'Terra': ['Rocha', 'Montanha', 'Gaias'],
            'Ar': ['Vento', 'Furacão', 'Céfiro'],
            'Luz': ['Aurora', 'Brilho', 'Éter'],
            'Escuridão': ['Sombra', 'Abismo', 'Névoa'],
            'Elétrico': ['Raio', 'Faísca', 'Trovão'],
            'Gelo': ['Geada', 'Nevasca', 'Glacial']
        };
        const suffixes = {
            'Comum': ['Simples', 'Básico', 'Pequeno'],
            'Incomum': ['Aprimorado', 'Reforçado', 'Médio'],
            'Raro': ['Poderoso', 'Antigo', 'Grande'],
            'Épico': ['Lendário', 'Mítico', 'Divino'],
            'Lendário': ['Eterno', 'Cósmico', 'Primordial']
        };

        const prefix = getRandomElement(prefixes[type]);
        const suffix = getRandomElement(suffixes[rarity]);
        return `${prefix} ${type} ${suffix}`;
    }

    function generatePower() {
        const type = getRandomElement(powerTypes);
        const rarity = getRandomElement(rarities);
        const level = getRandomInt(1, 100);
        const mastery = getRandomInt(0, 100);
        const resourceName = resourceNames[type];

        let baseHp = 100;
        let baseResource = 50;
        let baseAttack = 10;
        let baseDefense = 5;
        let baseSpeed = 5;
        let baseCriticalChance = 5;

        // Adjust stats based on rarity
        switch (rarity) {
            case 'Incomum':
                baseHp *= 1.1; baseResource *= 1.1; baseAttack *= 1.1; baseDefense *= 1.1; baseSpeed *= 1.1; baseCriticalChance += 2;
                break;
            case 'Raro':
                baseHp *= 1.25; baseResource *= 1.25; baseAttack *= 1.25; baseDefense *= 1.25; baseSpeed *= 1.25; baseCriticalChance += 5;
                break;
            case 'Épico':
                baseHp *= 1.5; baseResource *= 1.5; baseAttack *= 1.5; baseDefense *= 1.5; baseSpeed *= 1.5; baseCriticalChance += 10;
                break;
            case 'Lendário':
                baseHp *= 2; baseResource *= 2; baseAttack *= 2; baseDefense *= 2; baseSpeed *= 2; baseCriticalChance += 15;
                break;
        }

        // Adjust stats based on level
        const levelMultiplier = 1 + (level / 100);
        baseHp = Math.round(baseHp * levelMultiplier);
        baseResource = Math.round(baseResource * levelMultiplier);
        baseAttack = Math.round(baseAttack * levelMultiplier);
        baseDefense = Math.round(baseDefense * levelMultiplier);
        baseSpeed = Math.round(baseSpeed * levelMultiplier);

        return {
            id: `power-${Date.now()}-${getRandomInt(0, 999)}`,
            name: generatePowerName(type, rarity),
            type: type,
            rarity: rarity,
            level: level,
            mastery: mastery,
            maxHp: baseHp,
            currentHp: baseHp,
            resourceName: resourceName,
            maxResource: baseResource,
            currentResource: baseResource,
            attack: baseAttack,
            defense: baseDefense,
            speed: baseSpeed,
            criticalChance: Math.min(baseCriticalChance, 100), // Cap critical chance at 100%
            specialBar: 0,
            isAlive: true
        };
    }

    function displayPower(power, element) {
        element.querySelector('[data-attr="name"]').textContent = power.name;
        element.querySelector('[data-attr="type"]').textContent = power.type;
        element.querySelector('[data-attr="rarity"]').textContent = power.rarity;
        element.querySelector('[data-attr="level"]').textContent = power.level;
        element.querySelector('[data-attr="mastery"]').textContent = power.mastery;
        element.querySelector('[data-attr="hp"]').textContent = `${power.currentHp}/${power.maxHp}`;
        element.querySelector('[data-attr="resource_name"]').textContent = power.resourceName;
        element.querySelector('[data-attr="resource_value"]').textContent = `${power.currentResource}/${power.maxResource}`;
        element.querySelector('[data-attr="attack"]').textContent = power.attack;
        element.querySelector('[data-attr="defense"]').textContent = power.defense;
        element.querySelector('[data-attr="speed"]').textContent = power.speed;
        element.querySelector('[data-attr="critical_chance"]').textContent = power.criticalChance;
        element.querySelector('[data-attr="special_bar"]').textContent = power.specialBar;

        // Set rarity attribute for styling
        element.setAttribute('data-rarity', power.rarity);

        // Add save button if not already present
        let saveButton = element.querySelector('button.save-power-btn');
        if (!saveButton) {
            saveButton = document.createElement('button');
            saveButton.classList.add('save-power-btn');
            saveButton.textContent = 'Salvar Poder';
            element.appendChild(saveButton);
        }
        // Remove previous event listener and add new one to ensure it saves the current power object
        const oldSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(oldSaveButton, saveButton);
        oldSaveButton.addEventListener('click', () => savePower(power));
    }

    function generateAndDisplayPowers() {
        currentPowers.power1 = generatePower();
        currentPowers.power2 = generatePower();
        displayPower(currentPowers.power1, power1Display);
        displayPower(currentPowers.power2, power2Display);
        startBattleBtn.disabled = false;
        logEntries.innerHTML = ''; // Clear battle log
    }

    generatePowersBtn.addEventListener('click', generateAndDisplayPowers);

    // Initial power generation on load
    generateAndDisplayPowers();

    // Battle Logic
    startBattleBtn.addEventListener('click', startBattle);

    function log(message) {
        const p = document.createElement('p');
        p.textContent = message;
        logEntries.prepend(p); // Add new logs to the top
    }

    function calculateDamage(attacker, defender, isSpecial = false) {
        let damage = attacker.attack;

        // Rarity bonus
        const rarityMultiplier = {
            'Comum': 1,
            'Incomum': 1.05,
            'Raro': 1.1,
            'Épico': 1.2,
            'Lendário': 1.3
        }[attacker.rarity];
        damage *= rarityMultiplier;

        // Level bonus
        damage *= (1 + attacker.level / 200);

        // Type advantage
        if (typeAdvantages[attacker.type] === defender.type) {
            damage *= 1.5; // 50% more damage
            log(`${attacker.name} tem vantagem de tipo contra ${defender.name}!`);
        } else if (typeAdvantages[defender.type] === attacker.type) {
            damage *= 0.75; // 25% less damage
            log(`${defender.name} tem vantagem de tipo contra ${attacker.name}!`);
        }

        // Critical hit
        if (getRandomInt(1, 100) <= attacker.criticalChance) {
            damage *= 2; // Double damage on critical hit
            log(`${attacker.name} acertou um golpe crítico!`);
        }

        // Special attack bonus
        if (isSpecial) {
            damage *= 2.5; // Special attacks are much stronger
            log(`${attacker.name} usou um ATAQUE ESPECIAL!`);
        }

        // Apply defense
        damage -= defender.defense / 2; // Defense reduces damage
        damage = Math.max(1, Math.round(damage)); // Minimum 1 damage

        return damage;
    }

    async function performAttack(attacker, defender, attackerElement, defenderElement) {
        let isSpecialAttack = false;
        if (attacker.specialBar >= 100) {
            isSpecialAttack = true;
            attacker.specialBar = 0; // Reset special bar after use
            attacker.currentResource = Math.max(0, attacker.currentResource - 20); // Special attacks cost resource
        } else {
            attacker.specialBar = Math.min(100, attacker.specialBar + 20); // Gain special charge
            attacker.currentResource = Math.max(0, attacker.currentResource - 5); // Basic attacks cost less resource
        }

        const damageDealt = calculateDamage(attacker, defender, isSpecialAttack);
        defender.currentHp = Math.max(0, defender.currentHp - damageDealt);

        log(`${attacker.name} atacou ${defender.name} causando ${damageDealt} de dano.`);
        displayPower(attacker, attackerElement); // Update attacker's display (special bar, resource)
        displayPower(defender, defenderElement); // Update defender's display (HP)

        if (defender.currentHp <= 0) {
            defender.isAlive = false;
            log(`${defender.name} foi derrotado!`);
            return true; // Defender is defeated
        }
        return false; // Defender is still alive
    }

    async function startBattle() {
        startBattleBtn.disabled = true;
        generatePowersBtn.disabled = true;
        logEntries.innerHTML = ''; // Clear previous battle log
        log('A batalha começou!');

        // Add battle visual effects
        document.body.classList.add('battle-active');
        power1Display.classList.add('battle-active');
        power2Display.classList.add('battle-active');

        // Reset current HP and resource for battle
        currentPowers.power1.currentHp = currentPowers.power1.maxHp;
        currentPowers.power1.currentResource = currentPowers.power1.maxResource;
        currentPowers.power1.specialBar = 0;
        currentPowers.power1.isAlive = true;

        currentPowers.power2.currentHp = currentPowers.power2.maxHp;
        currentPowers.power2.currentResource = currentPowers.power2.maxResource;
        currentPowers.power2.specialBar = 0;
        currentPowers.power2.isAlive = true;

        displayPower(currentPowers.power1, power1Display);
        displayPower(currentPowers.power2, power2Display);

        let turn = 0;
        while (currentPowers.power1.isAlive && currentPowers.power2.isAlive && turn < 100) { // Max 100 turns to prevent infinite loop
            turn++;
            log(`--- Turno ${turn} ---`);

            // Determine who attacks first based on speed
            let firstAttacker, secondAttacker, firstAttackerElement, secondAttackerElement;
            if (currentPowers.power1.speed >= currentPowers.power2.speed) {
                firstAttacker = currentPowers.power1;
                firstAttackerElement = power1Display;
                secondAttacker = currentPowers.power2;
                secondAttackerElement = power2Display;
            } else {
                firstAttacker = currentPowers.power2;
                firstAttackerElement = power2Display;
                secondAttacker = currentPowers.power1;
                secondAttackerElement = power1Display;
            }

            // First attacker's turn
            if (firstAttacker.isAlive) {
                const defeated = await performAttack(firstAttacker, secondAttacker, firstAttackerElement, secondAttackerElement);
                if (defeated) break; // Battle ends if defender is defeated
            }

            // Second attacker's turn (if still alive)
            if (secondAttacker.isAlive) {
                const defeated = await performAttack(secondAttacker, firstAttacker, secondAttackerElement, firstAttackerElement);
                if (defeated) break; // Battle ends if defender is defeated
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between turns
        }

        if (!currentPowers.power1.isAlive) {
            log(`${currentPowers.power2.name} VENCEU A BATALHA!`);
        } else if (!currentPowers.power2.isAlive) {
            log(`${currentPowers.power1.name} VENCEU A BATALHA!`);
        } else {
            log('A batalha terminou em empate após 100 turnos!');
        }

        // Remove battle visual effects
        document.body.classList.remove('battle-active');
        power1Display.classList.remove('battle-active');
        power2Display.classList.remove('battle-active');

        startBattleBtn.disabled = false;
        generatePowersBtn.disabled = false;
    }

    // Save/Load functionality
    function savePower(power) {
        let savedPowers = JSON.parse(localStorage.getItem('savedPowers')) || [];
        // Check if power already exists to avoid duplicates (based on ID)
        if (!savedPowers.some(p => p.id === power.id)) {
            savedPowers.push(power);
            localStorage.setItem('savedPowers', JSON.stringify(savedPowers));
            renderSavedPowers();
            log(`Poder '${power.name}' salvo!`);
        } else {
            log(`Poder '${power.name}' já está salvo.`);
        }
    }

    function loadPower(powerId, targetPower) {
        let savedPowers = JSON.parse(localStorage.getItem('savedPowers')) || [];
        const powerToLoad = savedPowers.find(p => p.id === powerId);
        if (powerToLoad) {
            // Ensure loaded power has battle-specific stats reset
            const loadedPowerCopy = { ...powerToLoad };
            loadedPowerCopy.currentHp = loadedPowerCopy.maxHp;
            loadedPowerCopy.currentResource = loadedPowerCopy.maxResource;
            loadedPowerCopy.specialBar = 0;
            loadedPowerCopy.isAlive = true;

            if (targetPower === 'power1') {
                currentPowers.power1 = loadedPowerCopy;
                displayPower(currentPowers.power1, power1Display);
            } else if (targetPower === 'power2') {
                currentPowers.power2 = loadedPowerCopy;
                displayPower(currentPowers.power2, power2Display);
            }
            startBattleBtn.disabled = false;
            log(`Poder '${powerToLoad.name}' carregado para ${targetPower === 'power1' ? 'Poder 1' : 'Poder 2'}.`);
        }
    }

    function deleteSavedPower(powerId) {
        let savedPowers = JSON.parse(localStorage.getItem('savedPowers')) || [];
        savedPowers = savedPowers.filter(p => p.id !== powerId);
        localStorage.setItem('savedPowers', JSON.stringify(savedPowers));
        renderSavedPowers();
        log(`Poder removido dos salvos.`);
    }

    function renderSavedPowers() {
        savedPowersList.innerHTML = '';
        let savedPowers = JSON.parse(localStorage.getItem('savedPowers')) || [];
        if (savedPowers.length === 0) {
            savedPowersList.innerHTML = '<li>Nenhum poder salvo ainda.</li>';
            return;
        }
        savedPowers.forEach(power => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${power.name} (Nível ${power.level}, ${power.rarity})</span>
                <button class="load-power-btn" data-power-id="${power.id}" data-target="power1">Carregar P1</button>
                <button class="load-power-btn" data-power-id="${power.id}" data-target="power2">Carregar P2</button>
                <button class="delete-power-btn" data-power-id="${power.id}">Excluir</button>
            `;
            savedPowersList.appendChild(li);
        });

        document.querySelectorAll('.load-power-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const powerId = event.target.dataset.powerId;
                const target = event.target.dataset.target;
                loadPower(powerId, target);
            });
        });

        document.querySelectorAll('.delete-power-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const powerId = event.target.dataset.powerId;
                deleteSavedPower(powerId);
            });
        });
    }

    renderSavedPowers(); // Render saved powers on page load
});

