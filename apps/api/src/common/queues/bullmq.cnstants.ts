/**
 * Queue names used across the application.
 *
 * Using constants prevents us from scattering
 * string literals everywhere.
 */

export const ORDER_QUEUE = 'orders';

/**
 * Individual job names.
 */

export const ORDER_AGGREGATION_JOB =
  'aggregate-orders';

export const ORDER_DISPATCH_JOB =
  'dispatch-orders';