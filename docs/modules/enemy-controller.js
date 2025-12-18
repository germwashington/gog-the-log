// Enemy Controller - Enemy Manager
// Module 2: Manages all enemies (spawning, movement, attacks, drops)

class EnemyController {
    constructor(config = {}, eventBus = null, dataStore = null) {
        this.config = config;
        this.eventBus = eventBus;
        this.dataStore = dataStore;
    }
}

export { EnemyController };

