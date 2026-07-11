import { MenuItem, Restaurant } from '@prisma/client';

export abstract class CatalogueRepository {
  abstract createRestaurant(data: {
    name: string;
    description?: string;
  }): Promise<Restaurant>;

  abstract createMenuItem(data: {
    restaurantId: string;
    name: string;
    price: number;
    description: string;
  }): Promise<MenuItem>;

  abstract getRestaurants(): Promise<Restaurant[]>;

  abstract getRestaurant(id: string): Promise<Restaurant | null>;

  abstract getRestaurantMenuItems(restaurantId: string): Promise<MenuItem[]>;

  abstract findMenuItemsById(menuItemId: string[]): Promise<MenuItem[]>;

  abstract findMenuItemById(menuItemId: string): Promise<MenuItem | null>;

  abstract findRestaurantById(restaurantId: string): Promise<Restaurant | null>;
}
