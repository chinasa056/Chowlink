// import { Module } from '@nestjs/common';
// import { PrismaModule } from '../database/prisma/prisma.module';
// import { DomainEventPublisher } from './domain-event.publisher';
// import { OutboxEventPublisher } from './outbox-event.publisher';

// @Module({
//   imports: [PrismaModule],

//   providers: [
//     {
//       provide: DomainEventPublisher,
//       useClass: OutboxEventPublisher,
//     },
//   ],

//   exports: [DomainEventPublisher],
// })
// export class EventsModule {}