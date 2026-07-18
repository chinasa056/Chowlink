export interface OrderDispatchDetails {
  orderId: string;
  orderBatchId: string | null;
  organization: {
    name: string;
    phone: string;
  };

  restaurant: {
    id: string;
    name: string;
    phone: string;
  };

  restaurantAddress: {
    latitude: number;
    longitude: number;
  } | null;

  organizationAddress: {
    latitude: number;
    longitude: number;
  } | null;

  totalAmount: number;
  notes?: string;
}