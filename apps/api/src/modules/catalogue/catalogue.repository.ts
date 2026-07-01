import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma/prisma.service';

@Injectable()
export class CatalogueRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createRestaurant(data: {
    name: string;
    address: string;
    cuisineType: string;
  }) {
    return this.prisma.restaurant.create({
      data,
    });
  }

  async createMenuItem(data: {
    restaurantId: string;
    name: string;
    price: number;
    description: string;
  }) {
    return this.prisma.menuItem.create({
      data,
    });
  }

  async getRestaurants() {
    return this.prisma.restaurant.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRestaurant(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },

      include: {
        menuItems: true,
      },
    });
  }

  async getRestaurantMenuItems(
    restaurantId: string,
  ) {
    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
      },
    });
  }

  async findMenuItemsById(menuItemId: string[]) {
    return this.prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemId,
        },
      },
    });
  }

  async findMenuItemById(menuItemId: string) {
    return this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });
  }

  async findRestaurantById(restaurantId: string) {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
  }
}