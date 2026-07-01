/**
 * Every order in the system must always exist
 * in exactly one of these states.
 *
 * These statuses represent the business journey
 * of an order from creation until completion.
 *
 * We use an enum instead of plain strings because:
 *
 * - prevents typos
 * - gives autocomplete
 * - keeps the entire application consistent
 */
export enum OrderStatus {
  /**
   * Employee has successfully placed the order.
   *
   * No aggregation has happened yet.
   * No delivery has been created yet.
   */
  PENDING = 'PENDING',

  /**
   * The daily cutoff time has been reached.
   *
   * Orders have now been grouped together
   * by restaurant.
   */
  AGGREGATED = 'AGGREGATED',

  /**
   * A delivery request has been successfully
   * created through Chowdeck Relay.
   *
   * Waiting for rider pickup.
   */
  DISPATCHED = 'DISPATCHED',

  /**
   * Rider has picked up the food.
   *
   * Food is currently on the way.
   */
  IN_TRANSIT = 'IN_TRANSIT',

  /**
   * Food has been delivered successfully.
   *
   * This is a terminal state.
   */
  DELIVERED = 'DELIVERED',

  /**
   * Delivery failed.
   *
   * Depending on the failure reason,
   * the system may attempt a redelivery
   * before eventually refunding.
   */
  FAILED = 'FAILED',

  /**
   * Employee cancelled before dispatch.
   *
   * Terminal state.
   */
  CANCELLED = 'CANCELLED',
}