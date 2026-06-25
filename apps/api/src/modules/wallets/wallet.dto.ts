import {
  IsNumber,
  IsString,
} from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  reference: string;
}

export class DebitWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  reference: string;

  @IsString()
  description: string;
}

export class RefundWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  reference: string;

  @IsString()
  description: string;
}