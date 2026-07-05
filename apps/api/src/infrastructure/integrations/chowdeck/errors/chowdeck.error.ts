export class ChowdeckError extends Error {
  public readonly statusCode?: number;
  public readonly providerMessage?: string;

  constructor(message: string, statusCode?: number, providerMessage?: string) {
    super(message);
    this.name = 'ChowdeckError';
    this.statusCode = statusCode;
    this.providerMessage = providerMessage;
  }
}
