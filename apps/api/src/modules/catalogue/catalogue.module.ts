import { Module } from '@nestjs/common';

import { CatalogueController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';
import { CatalogueRepository } from './interfaces/catalogue.repository';
import { PrismaCatalogueRepository } from './repositories/prisma.catalogue.repository';

@Module({
  controllers: [CatalogueController],

  providers: [
    CatalogueService,
    {
      provide: CatalogueRepository,
      useClass: PrismaCatalogueRepository,
    },
  ],

  exports: [CatalogueService, CatalogueRepository],
})
export class CatalogueModule {}
