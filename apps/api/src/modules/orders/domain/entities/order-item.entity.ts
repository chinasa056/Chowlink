import { Decimal } from '@prisma/client/runtime/library';

/**
 * Represents a single meal inside an Order.
 *
 * This entity intentionally contains no persistence logic.
 * It simply models one item selected by an employee.
 */
export class OrderItemEntity {
  constructor(
    public readonly menuItemId: string,

    public readonly quantity: number,

    public readonly unitPrice: Decimal,
  ) {}

  /**
   * Calculates the total price contributed by
   * this particular item.
   */
  get subtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}