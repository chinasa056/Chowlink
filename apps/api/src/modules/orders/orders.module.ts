import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ORDER_QUEUE } from '../../common/queues/bullmq.cnstants';
import { AggregateOrdersUseCase } from './application/use-cases/aggregate-orders.use-case';
import { DispatchOrderUseCase } from './application/use-cases/dispatch-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { PlaceOrderUseCase } from './application/use-cases/place-order.use-case';
import { AggregationScheduler } from './infrastructure/queues/aggregation.scheduler';
import { AggregationProcessor } from './infrastructure/queues/aggregation.processor';
import { DispatchProcessor } from './infrastructure/queues/dispatch.processor';
import { ChowdeckRelayClient } from '../../infrastructure/integrations/chowdeck/chowdeck.relay.client';
import { OrderRepository } from './domain/interfaces/order.repository';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { OrdersController } from './presentation/controllers/orders.controller';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CatalogueService } from '../catalogue/catalogue.service';
import { WalletService } from '../wallets/wallet.service';
import { WalletRepository } from '../wallets/wallet.repsitory';
import { CatalogueRepository } from '../catalogue/interfaces/catalogue.repository';
import { PrismaCatalogueRepository } from '../catalogue/repositories/prisma.catalogue.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE,
    }),
  ],

  controllers: [OrdersController],

  providers: [
    /**
     * Use Cases
     */
    AggregateOrdersUseCase,

    DispatchOrderUseCase,

    CancelOrderUseCase,

    PlaceOrderUseCase,
    CatalogueService,
    WalletService,
    WalletRepository,

    /**
     * Repositories
     */
    {
      provide: OrderRepository,
      useClass: PrismaOrderRepository,
    },
{
  provide: CatalogueRepository,
  useClass: PrismaCatalogueRepository
},
    /**
     * Queue Scheduler (registers repeatable jobs)
     */
    AggregationScheduler,

    /**
     * Queue Processors (execute use cases when jobs fire)
     */
    AggregationProcessor,

    DispatchProcessor,

    /**
     * Chowdeck Relay SDK client.
     *
     * Injected into DispatchOrderUseCase.
     * The API key is read from environment variables.
     */
    {
      provide: ChowdeckRelayClient,
      useFactory: () => {
        const apiKey = process.env.CHOWDECK_API_KEY;
        if (!apiKey) {
          throw new Error('CHOWDECK_API_KEY environment variable is not set');
        }
        return new ChowdeckRelayClient(apiKey);
      },
    },
  ],
})
export class OrdersModule {}
