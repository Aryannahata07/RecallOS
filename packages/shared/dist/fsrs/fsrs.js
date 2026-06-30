"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSRSScheduler = exports.Rating = void 0;
var Rating;
(function (Rating) {
    Rating[Rating["Again"] = 1] = "Again";
    Rating[Rating["Hard"] = 2] = "Hard";
    Rating[Rating["Good"] = 3] = "Good";
    Rating[Rating["Easy"] = 4] = "Easy";
})(Rating || (exports.Rating = Rating = {}));
class FSRSScheduler {
    // Default parameters for FSRS-4.5
    w = [
        0.4, // S_0(Again)
        0.6, // S_0(Hard)
        2.4, // S_0(Good)
        5.8, // S_0(Easy)
        4.93, // D_0(Good)
        0.94, // D_0(Good) scaling
        0.86, // D update scaling
        0.01, // D regression weight
        1.49, // S recall scaling
        0.14, // S recall power
        0.94, // S recall R scale
        2.18, // S forget scaling
        0.05, // S forget difficulty power
        0.34, // S forget stability power
        1.26, // S forget R scale
        0.26, // Hard stability penalty
        2.05, // Easy stability bonus
    ];
    targetRetention;
    constructor(targetRetention = 0.90) {
        this.targetRetention = targetRetention;
    }
    /**
     * Calculates the current retrievability of a card based on days elapsed since the last review.
     * R(t) = 0.9 ^ (t / S)
     */
    calculateRetrievability(card, now) {
        if (!card.last_reviewed_at) {
            return 0.0;
        }
        const elapsedDays = (now.getTime() - card.last_reviewed_at.getTime()) / (1000 * 60 * 60 * 24);
        if (elapsedDays <= 0)
            return 1.0;
        // Retrievability formula
        return Math.pow(0.9, elapsedDays / card.stability);
    }
    /**
     * Initializes a card after the first review.
     */
    createInitialCard(rating, now) {
        const s0 = this.w[rating - 1]; // w[0..3] corresponding to Again, Hard, Good, Easy
        const d0 = this.w[4] - this.w[5] * (rating - 3);
        const difficulty = Math.max(1, Math.min(10, d0));
        const card = {
            difficulty,
            stability: s0,
            last_reviewed_at: now,
            reps: 1,
            lapses: rating === Rating.Again ? 1 : 0,
            next_review_due: now, // Will be computed below
        };
        const interval = this.calculateInterval(s0);
        const dueTime = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
        card.next_review_due = dueTime;
        return { card, interval };
    }
    /**
     * Processes a review for an existing card, returning the updated card and the next interval.
     */
    reviewCard(card, rating, now) {
        if (!card.last_reviewed_at) {
            return this.createInitialCard(rating, now);
        }
        const elapsedDays = Math.max(0.1 / 24, // Minimum 6 minutes
        (now.getTime() - card.last_reviewed_at.getTime()) / (1000 * 60 * 60 * 24));
        const r = Math.pow(0.9, elapsedDays / card.stability);
        // Update difficulty
        let nextDifficulty = card.difficulty - this.w[6] * (rating - 3);
        // Smooth difficulty towards default median (d0(Good))
        const d0Good = this.w[4];
        nextDifficulty = this.w[7] * d0Good + (1 - this.w[7]) * nextDifficulty;
        nextDifficulty = Math.max(1, Math.min(10, nextDifficulty));
        // Update stability
        let nextStability = card.stability;
        if (rating === Rating.Again) {
            // Forgotten stability formula
            nextStability =
                this.w[11] *
                    Math.pow(nextDifficulty, -this.w[12]) *
                    (Math.pow(card.stability + 1, this.w[13]) - 1) *
                    Math.exp(this.w[14] * (1 - r));
            nextStability = Math.max(0.1, nextStability);
        }
        else {
            // Recalled stability formula
            let ratingBonus = 1.0;
            if (rating === Rating.Hard)
                ratingBonus = this.w[15];
            if (rating === Rating.Easy)
                ratingBonus = this.w[16];
            nextStability =
                card.stability *
                    (1 +
                        Math.exp(this.w[8]) *
                            (11 - nextDifficulty) *
                            Math.pow(card.stability, -this.w[9]) *
                            (Math.exp(this.w[10] * (1 - r)) - 1) *
                            ratingBonus);
        }
        const updatedCard = {
            difficulty: nextDifficulty,
            stability: nextStability,
            last_reviewed_at: now,
            reps: card.reps + 1,
            lapses: rating === Rating.Again ? card.lapses + 1 : card.lapses,
            next_review_due: now, // Calculated below
        };
        const interval = this.calculateInterval(nextStability);
        updatedCard.next_review_due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
        return { card: updatedCard, interval };
    }
    /**
     * Helper to convert stability to a review interval (in days) based on target retention.
     * t = S * ln(R_target) / ln(0.9)
     */
    calculateInterval(stability) {
        const interval = stability * (Math.log(this.targetRetention) / Math.log(0.9));
        return Math.max(1, Math.round(interval));
    }
}
exports.FSRSScheduler = FSRSScheduler;
