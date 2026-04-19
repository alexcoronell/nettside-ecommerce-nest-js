import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Sale } from '@sale/entities/sale.entity';
import { Product } from '@product/entities/product.entity';

@Entity('sale_detail')
@Unique(['sale', 'product'])
export class SaleDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'quantity',
    type: 'int',
    default: 1,
    nullable: false,
  })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  unitPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  subtotal: number;

  /**************************** Relations ****************************/
  @ManyToOne(() => Sale, (sale) => sale.details, { nullable: false })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product, (product) => product.saleDetails, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
