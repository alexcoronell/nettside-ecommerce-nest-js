import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/* Interfaces */
import { IBaseController } from '@commons/interfaces/i-base-controller';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { UserService } from './user.service';

/* Entities */
import { User } from './entities/user.entity';

/* DTO's */
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password-user';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { OwnerOrAdminGuard } from '@auth/guards/owner-or-admin-auth/owner-or-admin-auth.guard';

@ApiTags('Users')
@Controller('user')
/**
 * Controller for managing user-related operations.
 * Implements the IBaseController interface for User entity.
 */
export class UserController
  implements IBaseController<ResponseUserDto, CreateUserDto, UpdateUserDto>
{
  constructor(private userService: UserService) {}
  /**
   * Counts all users in the system.
   * @returns The total number of users.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count-all')
  countAll() {
    return this.userService.countAll();
  }

  /**
   * Counts specific users based on certain criteria.
   * @returns The count of users matching the criteria.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count')
  count() {
    return this.userService.count();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count-customers')
  countCustomers() {
    return this.userService.countCustomers();
  }

  /**
   * Retrieves all users from the system.
   * @returns An array of all users.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /**
   * Retrieves all active users from the system.
   * @returns An array of active users.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('sellers')
  findAllSellers() {
    return this.userService.findAllSellers();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('customers')
  findAllCustomers() {
    return this.userService.findAllCustomers();
  }

  /**
   * Retrieves a single user by their ID.
   * @param id - The ID of the user to retrieve.
   * @returns The user with the specified ID.
   */
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: User['id']) {
    return this.userService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Get('no-relations/:id')
  findOneWithoutRelations(@Param('id', ParseIntPipe) id: User['id']) {
    return this.userService.findOneWithoutRelations(id);
  }

  /**
   * Retrieves a single user by their email.
   * @param email - The email of the user to retrieve.
   * @returns The user with the specified email.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('email/:email')
  findOneByEmail(@Param('email') email: string) {
    return this.userService.findOneByEmail(email);
  }

  /**
   * Creates a new user in the system.
   * @param payload - The data for the new user.
   * @returns The created user.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateUserDto, @UserId() userId: number) {
    return this.userService.create(payload, userId);
  }

  @Post('register')
  register(@Body() payload: CreateUserDto) {
    return this.userService.register(payload);
  }

  /**
   * Updates an existing user by their ID.
   * @param id - The ID of the user to update.
   * @param changes - The changes to apply to the user.
   * @returns The updated user.
   */
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() changes: UpdateUserDto,
  ) {
    return this.userService.update(id, userId, changes);
  }

  /**
   * Updates the password of a user by their ID.
   * @param id - The ID of the user whose password is to be updated.
   * @param changes - The new password data.
   * @returns The updated user with the new password.
   */
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Patch('password/:id')
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changes: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, changes);
  }

  /**
   * Removes a user from the system by their ID.
   * @param id - The ID of the user to remove.
   * @returns A confirmation of the removal operation.
   */
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.userService.remove(id, userId);
  }
}
