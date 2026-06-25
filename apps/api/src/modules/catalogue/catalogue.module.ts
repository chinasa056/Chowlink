import { Module } from '@nestjs/common';

import { CatalogueController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';
import { CatalogueRepository } from './catalogue.repository';

@Module({
  controllers: [
    CatalogueController,
  ],

  providers: [
    CatalogueService,
    CatalogueRepository,
  ],

  exports: [
    CatalogueService,
  ],
})
export class CatalogueModule {}