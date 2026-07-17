// Represents any business even that happened inside the domain.

export interface DomainEvent {

  aggregateId: string;

  aggregateType: string;

  eventType: string;

  version: number;

  occurredAt: Date;

  payload: Record<string, any>;
}