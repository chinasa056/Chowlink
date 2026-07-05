/**
 * Queue and job name constants used across the application.
 *
 * Centralizing these strings prevents typos and makes
 * renaming trivial — change it once, updated everywhere.
 */

export const ORDER_QUEUE = 'orders';

export const OUTBOX_QUEUE = 'outbox';

/**
 * Individual job names.
 */

export const ORDER_AGGREGATION_JOB = 'aggregate-orders';

export const ORDER_DISPATCH_JOB = 'dispatch-orders';

export const OUTBOX_POLL_JOB = 'outbox-poll';