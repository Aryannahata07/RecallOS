import { FSRSScheduler, Rating, FSRSCard } from '../fsrs';

describe('FSRSScheduler', () => {
  let scheduler: FSRSScheduler;
  const mockNow = new Date('2026-06-28T12:00:00Z');

  beforeEach(() => {
    // Target retention of 90%
    scheduler = new FSRSScheduler(0.90);
  });

  describe('createInitialCard', () => {
    it('should create an initial card with Good rating', () => {
      const { card, interval } = scheduler.createInitialCard(Rating.Good, mockNow);

      expect(card.reps).toBe(1);
      expect(card.lapses).toBe(0);
      expect(card.last_reviewed_at).toEqual(mockNow);
      expect(card.stability).toBe(2.4); // default w[2] for Good
      expect(card.difficulty).toBe(4.93); // default d0 for Good (w[4])
      expect(interval).toBe(2); // Rounded from 2.4 * (ln(0.9) / ln(0.9)) = 2.4 => 2 days
    });

    it('should create an initial card with Again rating', () => {
      const { card, interval } = scheduler.createInitialCard(Rating.Again, mockNow);

      expect(card.reps).toBe(1);
      expect(card.lapses).toBe(1);
      expect(card.stability).toBe(0.4); // default w[0] for Again
      expect(card.difficulty).toBeGreaterThan(5); // should be harder than Good
      expect(interval).toBe(1); // minimum interval is 1 day
    });

    it('should create an initial card with Easy rating', () => {
      const { card, interval } = scheduler.createInitialCard(Rating.Easy, mockNow);

      expect(card.reps).toBe(1);
      expect(card.stability).toBe(5.8); // default w[3] for Easy
      expect(card.difficulty).toBeLessThan(4.93); // should be easier than Good
      expect(interval).toBe(6); // Rounded from 5.8 => 6 days
    });
  });

  describe('calculateRetrievability', () => {
    it('should return 1.0 immediately after review', () => {
      const { card } = scheduler.createInitialCard(Rating.Good, mockNow);
      const retrievability = scheduler.calculateRetrievability(card, mockNow);
      expect(retrievability).toBe(1.0);
    });

    it('should decay over time', () => {
      const { card } = scheduler.createInitialCard(Rating.Good, mockNow);
      
      // Since stability is 2.4, retrievability should be exactly 90% (0.9) after 2.4 days
      const daysLater = new Date(mockNow.getTime() + 2.4 * 24 * 60 * 60 * 1000);
      const retrievability = scheduler.calculateRetrievability(card, daysLater);
      
      expect(retrievability).toBeCloseTo(0.9, 5);
    });

    it('should return 0.0 for new unreviewed cards', () => {
      const card: FSRSCard = {
        difficulty: 5.0,
        stability: 2.0,
        last_reviewed_at: null,
        next_review_due: mockNow,
        reps: 0,
        lapses: 0,
      };
      expect(scheduler.calculateRetrievability(card, mockNow)).toBe(0.0);
    });
  });

  describe('reviewCard', () => {
    it('should increase stability when reviewed successfully (Good rating)', () => {
      const initial = scheduler.createInitialCard(Rating.Good, mockNow);
      
      // Review 2 days later with "Good"
      const twoDaysLater = new Date(mockNow.getTime() + 2 * 24 * 60 * 60 * 1000);
      const result = scheduler.reviewCard(initial.card, Rating.Good, twoDaysLater);

      expect(result.card.reps).toBe(2);
      expect(result.card.stability).toBeGreaterThan(initial.card.stability);
      expect(result.interval).toBeGreaterThan(initial.interval);
    });

    it('should reduce stability and increase lapses when card is forgotten (Again rating)', () => {
      const initial = scheduler.createInitialCard(Rating.Good, mockNow);
      
      // Forget card 2 days later
      const twoDaysLater = new Date(mockNow.getTime() + 2 * 24 * 60 * 60 * 1000);
      const result = scheduler.reviewCard(initial.card, Rating.Again, twoDaysLater);

      expect(result.card.reps).toBe(2);
      expect(result.card.lapses).toBe(1);
      expect(result.card.stability).toBeLessThan(initial.card.stability);
      expect(result.interval).toBe(1); // Drops back to immediate review (1 day)
    });
  });
});
