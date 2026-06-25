import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import {
  CreateMenuItemDto,
  CreateRestaurantDto,
} from './catalogue.dto';

import { CatalogueService } from './catalogue.service';

@Controller('catalogue')
export class CatalogueController {
  constructor(
    private readonly catalogueService:
      CatalogueService,
  ) {}

  @Post('restaurants')
  createRestaurant(
    @Body()
    dto: CreateRestaurantDto,
  ) {
    return this.catalogueService.createRestaurant(
      dto,
    );
  }

  @Post(
    'restaurants/:restaurantId/menu-items',
  )
  createMenuItem(
    @Param('restaurantId')
    restaurantId: string,

    @Body()
    dto: CreateMenuItemDto,
  ) {
    return this.catalogueService.createMenuItem(
      restaurantId,
      dto,
    );
  }

  @Get('restaurants')
  getRestaurants() {
    return this.catalogueService.getRestaurants();
  }

  @Get('restaurants/:id')
  getRestaurant(
    @Param('id')
    id: string,
  ) {
    return this.catalogueService.getRestaurant(
      id,
    );
  }

  @Get(
    'restaurants/:id/menu-items',
  )
  getMenuItems(
    @Param('id')
    restaurantId: string,
  ) {
    return this.catalogueService.getRestaurantMenuItems(
      restaurantId,
    );
  }
}