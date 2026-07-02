/**
 * Represents any business event
 * that happened inside the domain.
 *
 * Examples:
 *
 * OrderCreated
 * OrderAggregated
 * DeliveryCompleted
 * WalletDebited
 *
 * The Application Layer publishes
 * these events without caring
 * where they eventually go.
 */
export interface DomainEvent {
  /**
   * Aggregate responsible
   * for the event.
   */
  aggregateId: string;

  /**
   * Aggregate type.
   *
   * ORDER
   * WALLET
   * DELIVERY
   */
  aggregateType: string;

  /**
   * Event name.
   */
  eventType: string;

  version: number;

  occurredAt: Date;

  /**
   * Event payload.
   */
  payload: Record<string, any>;
}