export enum WebhookEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_AWAITING_PICKUP = 'ORDER_AWAITING_PICKUP',
  ORDER_PICKED_UP = 'ORDER_PICKED_UP',
  ORDER_ARRIVED_AT_CUSTOMER_LOCATION = 'ORDER_ARRIVED_AT_CUSTOMER_LOCATION',
  ORDER_COMPLETE = 'ORDER_COMPLETE',
}

export interface DeliveryResult {
  id: number;
  reference: string;
  trackingUrl?: string;
  deliveryFee: number;
  status: string;
}

export interface RedeliveryResult {
  id: number;
  reference: string;
  redeliveryAmount: number;
  currency: string;
}
