import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

/* Enums */
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

/* Entities */
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { Shipment } from '@shipment/entities/shipment.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';
import { User } from '@user/entities/user.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({
    name: 'sale_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  saleDate: Date;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    name: 'shipping_address',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  shippingAddress: string;

  @Column({
    type: 'enum',
    name: 'shipping_status',
    enum: SaleStatusEnum,
    default: SaleStatusEnum.PENDING_PAYMENT,
    nullable: false,
  })
  status: SaleStatusEnum;

  @CreateDateColumn({
    name: 'cancelled_at',
    type: 'timestamp',
    nullable: true,
  })
  cancelledAt: Date | null;

  @Column({
    name: 'is_cancelled',
    type: 'boolean',
    default: false,
  })
  isCancelled: boolean;

  /**************************** Relations ****************************/
  @ManyToOne(() => User, (user) => user.sales)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, (user) => user.cancelledSales)
  @JoinColumn({ name: 'cancelled_by_user_id' })
  cancelledBy: User | null;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.sales)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @OneToMany(() => SaleDetail, (saleDetail) => saleDetail.sale)
  details?: SaleDetail[];

  @OneToMany(() => Shipment, (shipment) => shipment.sale)
  shipment?: Shipment;
}
