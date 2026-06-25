import {
  Inject,
  Injectable,
} from '@nestjs/common';

import Redis from 'ioredis';

import {
  CreateMenuItemDto,
  CreateRestaurantDto,
} from './catalogue.dto';

import { CatalogueRepository } from './catalogue.repository';

@Injectable()
export class CatalogueService {
  constructor(
    private readonly repository:
      CatalogueRepository,

    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async createRestaurant(
    dto: CreateRestaurantDto,
  ) {
    const restaurant =
      await this.repository.createRestaurant(
        dto,
      );

    await this.redis.del(
      'catalogue:restaurants',
    );

    return restaurant;
  }

  async createMenuItem(
    restaurantId: string,
    dto: CreateMenuItemDto,
  ) {
    const menuItem =
      await this.repository.createMenuItem({
        ...dto,
        restaurantId,
      });

    await this.redis.del(
      `catalogue:restaurant:${restaurantId}`,
    );

    return menuItem;
  }

  async getRestaurants() {
    const cache =
      await this.redis.get(
        'catalogue:restaurants',
      );

    if (cache) {
      return JSON.parse(cache);
    }

    const restaurants =
      await this.repository.getRestaurants();

    await this.redis.set(
      'catalogue:restaurants',
      JSON.stringify(restaurants),
      'EX',
      300,
    );

    return restaurants;
  }

  async getRestaurant(id: string) {
    const cache =
      await this.redis.get(
        `catalogue:restaurant:${id}`,
      );

    if (cache) {
      return JSON.parse(cache);
    }

    const restaurant =
      await this.repository.getRestaurant(id);

    await this.redis.set(
      `catalogue:restaurant:${id}`,
      JSON.stringify(restaurant),
      'EX',
      300,
    );

    return restaurant;
  }

  async getRestaurantMenuItems(
    restaurantId: string,
  ) {
    return this.repository.getRestaurantMenuItems(
      restaurantId,
    );
  }
}