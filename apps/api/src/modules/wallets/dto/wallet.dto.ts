import {
  IsNumber,
  IsString,
} from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  amount: number
}

export class DebitWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}

export class RefundWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;
}