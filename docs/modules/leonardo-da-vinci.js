// Leonardo Da Vinci - The Artist
// Module 4: Handles all rendering

class LeonardoDaVinci {
    constructor(canvas, config = {}, eventBus = null, dataStore = null) {
        this.canvas = canvas;
        this.config = config;
        this.eventBus = eventBus;
        this.dataStore = dataStore;
    }
}

export { LeonardoDaVinci };

