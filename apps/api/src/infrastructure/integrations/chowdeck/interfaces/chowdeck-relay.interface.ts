import { CreateDeliveryInput } from '../dto/delivery.dto';
import { DeliveryResult, RedeliveryResult } from '../types/chowdeck.types';

export interface IRelayClient {
  createDelivery(input: CreateDeliveryInput): Promise<DeliveryResult>;
  getDelivery(reference: string): Promise<DeliveryResult>;
  cancelDelivery(reference: string, reason: string): Promise<void>;
  requestRedelivery(reference: string): Promise<RedeliveryResult>;
  getWalletBalance(): Promise<number>;
}
