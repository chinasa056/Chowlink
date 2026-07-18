import axios, { AxiosInstance, AxiosError } from 'axios';
import { IRelayClient } from './interfaces/chowdeck-relay.interface';
import { CreateDeliveryInput } from './dto/delivery.dto';
import { DeliveryResult, RedeliveryResult } from './types/chowdeck.types';
import { ChowdeckError } from './errors/chowdeck.error';

export class ChowdeckRelayClient implements IRelayClient {
  private readonly http: AxiosInstance;

  constructor(apiKey: string) {
    this.http = axios.create({
      baseURL: 'https://api.chowdeck.com',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const statusCode = axiosError.response?.status;
      const providerMessage =
        axiosError.response?.data?.message || axiosError.message;
      throw new ChowdeckError(defaultMessage, statusCode, providerMessage);
    }
    throw new ChowdeckError(defaultMessage);
  }

  async createDelivery(input: CreateDeliveryInput): Promise<DeliveryResult> {
    try {

      //Get delivery fee
      const feeResponse = await this.http.post('/relay/delivery/fee', {
        source_address: {
          latitude: input.pickup.latitude,
          longitude: input.pickup.longitude,
        },
        destination_address: {
          latitude: input.destination.latitude,
          longitude: input.destination.longitude,
        },
        estimated_order_amount: input.estimatedOrderAmount,
        source_address_string: input.pickup.address,
        destination_address_string: input.destination.address,
      });

      const feeId = feeResponse.data.data.id;

      // Create delivery using fee ID
      const deliveryResponse = await this.http.post('/relay/delivery', {
        destination_contact: {
          name: input.destination.name,
          phone: input.destination.phone,
          country_code: 'NG',
          email: input.destination.email,
        },
        source_contact: {
          name: input.pickup.name,
          phone: input.pickup.phone,
          country_code: 'NG',
          email: input.pickup.email,
        },
        fee_id: feeId,
        item_type: 'food',
        user_action: 'sending',
        estimated_order_amount: input.estimatedOrderAmount,
        customer_delivery_note: input.note,
      });

      const data = deliveryResponse.data.data;

      return {
        id: data.id,
        reference: data.reference,
        trackingUrl: data.tracking_url,
        deliveryFee: data.delivery_price,
        status: data.status,
      };
    } catch (error) {
      this.handleError(error, 'Failed to create Chowdeck delivery');
    }
  }

  async getDelivery(reference: string): Promise<DeliveryResult> {
    try {
      const response = await this.http.get(`/relay/delivery/${reference}`);
      const data = response.data.data;

      return {
        id: data.id,
        reference: data.reference,
        trackingUrl: data.tracking_url,
        deliveryFee: data.delivery_price,
        status: data.status,
      };
    } catch (error) {
      this.handleError(
        error,
        `Failed to fetch delivery status for ${reference}`,
      );
    }
  }

  async cancelDelivery(reference: string, reason: string): Promise<void> {
    try {
      await this.http.post(`/relay/delivery/${reference}/cancel`, {
        reason,
      });
    } catch (error) {
      this.handleError(error, `Failed to cancel delivery ${reference}`);
    }
  }

  async requestRedelivery(reference: string): Promise<RedeliveryResult> {
    try {
      // Get redelivery fee
      const feeResponse = await this.http.post('/relay/redelivery/fee', {
        reference,
      });

      const feeId = feeResponse.data.data.id;

      //Request redelivery
      const redeliveryResponse = await this.http.post('/relay/redelivery', {
        reference,
        fee_id: feeId,
      });

      const data = redeliveryResponse.data.data;

      return {
        id: data.id,
        reference: data.reference,
        redeliveryAmount: data.redelivery_amount,
        currency: data.currency,
      };
    } catch (error) {
      this.handleError(error, `Failed to request redelivery for ${reference}`);
    }
  }

  async getWalletBalance(): Promise<number> {
    try {
      const response = await this.http.get('/relay/wallet/balance');
      return response.data.data.balance;
    } catch (error) {
      this.handleError(error, 'Failed to fetch Chowdeck wallet balance');
    }
  }
}
