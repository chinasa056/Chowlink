import { OrderStatus } from '../enums/order-status.enum';
import { OrderItemEntity } from './order-item.entity';

/**
 * OrderEntity
 *
 * This class represents the business state of an Order.
 *
 * Unlike a Prisma model, this object owns the business rules.
 *
 * Controllers cannot change Order state.
 *
 * BullMQ cannot change Order state.
 *
 * Webhooks cannot change Order state.
 *
 * Every state transition must happen through
 * one of the methods below.
 */
export class OrderEntity {
  /**
   * Constructor is private.
   *
   * Nobody should instantiate an Order directly.
   *
   * Instead use:
   *
   * OrderEntity.create(...)
   */
  private constructor(
    public readonly id: string | null,

    public readonly userId: string,

    public readonly organizationId: string,

    private _status: OrderStatus,

    public readonly items: OrderItemEntity[],

    public readonly notes?: string,

    private _aggregatedAt?: Date,

    private _dispatchedAt?: Date,

    private _completedAt?: Date,

    private _cancelledAt?: Date,
  ) {}

  /**
   * Factory method used when creating
   * a brand new Order.
   */
  static create(data: {
    userId: string;
    organizationId: string;
    items: OrderItemEntity[];
    notes?: string;
  }) {
    return new OrderEntity(
      null,
      data.userId,
      data.organizationId,
      OrderStatus.PENDING,
      data.items,
      data.notes,
    );
  }

  /**
   * Factory method used when rebuilding
   * an Order from the database.
   */
  static fromPersistence(data: {
    id: string;
    userId: string;
    organizationId: string;
    status: OrderStatus;
    items: OrderItemEntity[];
    notes?: string;
    aggregatedAt?: Date;
    dispatchedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  }) {
    return new OrderEntity(
      data.id,
      data.userId,
      data.organizationId,
      data.status,
      data.items,
      data.notes,
      data.aggregatedAt,
      data.dispatchedAt,
      data.completedAt,
      data.cancelledAt,
    );
  }

  /**
   * Current Order status.
   *
   * Notice we expose a getter.
   *
   * Nobody can directly mutate status.
   */
  get status() {
    return this._status;
  }

  /**
   * Total price of every OrderItem.
   *
   * We calculate this instead of storing
   * it inside the Entity.
   *
   * The database will still persist the
   * value for reporting purposes.
   */
  get totalAmount(): number {
    return this.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
  }

  /**
   * Aggregates the Order.
   */
  aggregate() {
    if (this._status !== OrderStatus.PENDING) {
      throw new Error(
        'Only pending Orders can be aggregated.',
      );
    }

    this._status = OrderStatus.AGGREGATED;

    this._aggregatedAt = new Date();
  }

  /**
   * Dispatches the Order.
   */
  dispatch() {
    if (this._status !== OrderStatus.AGGREGATED) {
      throw new Error(
        'Only aggregated Orders can be dispatched.',
      );
    }

    this._status = OrderStatus.DISPATCHED;

    this._dispatchedAt = new Date();
  }

  /**
   * Rider has picked up the Order.
   */
  startDelivery() {
    if (this._status !== OrderStatus.DISPATCHED) {
      throw new Error(
        'Order has not been dispatched.',
      );
    }

    this._status = OrderStatus.IN_TRANSIT;
  }

  /**
   * Delivery completed.
   */
  complete() {
    if (this._status !== OrderStatus.IN_TRANSIT) {
      throw new Error(
        'Order must be in transit.',
      );
    }

    this._status = OrderStatus.DELIVERED;

    this._completedAt = new Date();
  }

  /**
   * Cancels the Order.
   */
  cancel() {
    if (
      ![
        OrderStatus.PENDING,
        OrderStatus.AGGREGATED,
      ].includes(this._status)
    ) {
      throw new Error(
        'This Order can no longer be cancelled.',
      );
    }

    this._status = OrderStatus.CANCELLED;

    this._cancelledAt = new Date();
  }

  /**
   * Marks delivery as failed.
   */
  fail() {
    this._status = OrderStatus.FAILED;
  }

  /**
   * Exposes timestamps for persistence.
   */
  get aggregatedAt() {
    return this._aggregatedAt;
  }

  get dispatchedAt() {
    return this._dispatchedAt;
  }

  get completedAt() {
    return this._completedAt;
  }

  get cancelledAt() {
    return this._cancelledAt;
  }
}
