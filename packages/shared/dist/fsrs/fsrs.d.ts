export declare enum Rating {
    Again = 1,
    Hard = 2,
    Good = 3,
    Easy = 4
}
export interface FSRSCard {
    difficulty: number;
    stability: number;
    last_reviewed_at: Date | null;
    next_review_due: Date;
    reps: number;
    lapses: number;
}
export declare class FSRSScheduler {
    private w;
    private targetRetention;
    constructor(targetRetention?: number);
    /**
     * Calculates the current retrievability of a card based on days elapsed since the last review.
     * R(t) = 0.9 ^ (t / S)
     */
    calculateRetrievability(card: FSRSCard, now: Date): number;
    /**
     * Initializes a card after the first review.
     */
    createInitialCard(rating: Rating, now: Date): {
        card: FSRSCard;
        interval: number;
    };
    /**
     * Processes a review for an existing card, returning the updated card and the next interval.
     */
    reviewCard(card: FSRSCard, rating: Rating, now: Date): {
        card: FSRSCard;
        interval: number;
    };
    /**
     * Helper to convert stability to a review interval (in days) based on target retention.
     * t = S * ln(R_target) / ln(0.9)
     */
    private calculateInterval;
}
