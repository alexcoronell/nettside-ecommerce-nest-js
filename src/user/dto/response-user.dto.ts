import { User } from '@user/entities/user.entity';
import { UserRoleEnum } from '@commons/enums/user-role.enum';

export class ResponseUserDto {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  role: UserRoleEnum;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  createdBy?: User;
  updatedBy?: User;
  deletedBy?: User;
}
