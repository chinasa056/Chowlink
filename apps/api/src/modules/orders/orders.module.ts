import { BullModule } from "@nestjs/bullmq";
import { ORDER_QUEUE } from "../../common/queues/bullmq.cnstants";
import { Module } from "@nestjs/common";
import { AggregateOrdersUseCase } from "./application/use-cases/aggregate-orders.use-case";
import { AggregationScheduler } from "./infrastructure/queues/aggregation.scheduler";
import { AggregationProcessor } from "./infrastructure/queues/aggregation.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE,
    }),
  ],

  providers: [
    AggregateOrdersUseCase,

    AggregationScheduler,

    AggregationProcessor,
  ],
})
export class OrdersModule {}