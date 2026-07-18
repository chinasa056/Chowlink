//  * Queue and job name constants used across the application.

export const ORDER_QUEUE = 'orders';

export const OUTBOX_QUEUE = 'outbox';

export const ORDER_AGGREGATION_JOB = 'aggregate-orders';

export const ORDER_DISPATCH_JOB = 'dispatch-orders';

export const OUTBOX_POLL_JOB = 'outbox-poll';

export const ORDER_AGGREGATION_QUEUE =
  'order-aggregation';

export const ORDER_DISPATCH_QUEUE =
  'order-dispatch';