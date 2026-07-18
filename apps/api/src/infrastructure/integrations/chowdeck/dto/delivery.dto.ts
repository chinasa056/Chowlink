export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  email?: string;
}

export interface CreateDeliveryInput {
  pickup: ContactDetails;
  destination: ContactDetails;
  estimatedOrderAmount: number;
  note?: string;
}

export interface CancelDeliveryInput {
  reference: string;
  reason: string;
}
