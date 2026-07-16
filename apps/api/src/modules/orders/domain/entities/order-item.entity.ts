export class OrderItemEntity {
  constructor(
    public readonly menuItemId: string,

    public readonly quantity: number,

    public readonly unitPrice: number,
  ) {}

  //Calculate the total price contributed by this particular item.
  
  get subtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}