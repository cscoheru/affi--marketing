// js/systems/economy.js - Gold and lives management

export class Economy {
    constructor(diffConfig) {
        this.gold = diffConfig.gold;
        this.lives = diffConfig.lives;
        this.goldMultiplier = diffConfig.goldMultiplier;
        this.totalEarned = 0;
        this.totalSpent = 0;
    }

    addGold(amount) {
        this.gold += amount;
        this.totalEarned += amount;
    }

    spendGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        this.totalSpent += amount;
        return true;
    }

    canAfford(amount) {
        return this.gold >= amount;
    }

    loseLife(amount) {
        this.lives = Math.max(0, this.lives - amount);
    }
}
