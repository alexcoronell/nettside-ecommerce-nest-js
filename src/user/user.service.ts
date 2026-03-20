/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { User } from '@user/entities/user.entity';

/* DTO's */
import { ResponseUserDto } from './dto/response-user.dto';
import { CreateUserDto } from '@user/dto/create-user.dto';
import { UpdateUserDto } from '@user/dto/update-user.dto';
import { UpdatePasswordDto } from '@user/dto/update-password-user';

/* Enums */
import { UserRoleEnum } from '@commons/enums/user-role.enum';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class UserService
  implements IBaseService<ResponseUserDto, CreateUserDto, UpdateUserDto>
{
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Retrieves the total number of users in the system.
   *
   * @returns {Promise<Result<number>>} A standardized response where:
   * - `statusCode`: 200 OK
   * - `total`: the total count of users (as a number)
   */
  async countAll(): Promise<Result<number>> {
    const total = await this.userRepo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves the total number of not deleted users in the system.
   *
   * @returns {Promise<Result<number>>} A standardized response where:
   * - `statusCode`: 200 OK
   * - `total`: the total count of users (as a number)
   */
  async count(): Promise<Result<number>> {
    const total = await this.userRepo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Counts the total number of active customers in the system.
   *
   * Only users with role 'customer' and `isDeleted: false` are included.
   * This metric is useful for dashboards, analytics, or business reporting.
   *
   * @returns {Promise<Result<number>>} A standardized response where:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `total`: the count of active customer users (role = 'customer').
   *
   * Note: The count reflects only non-deleted customers to align with
   * user listing endpoints (e.g., `findAllCustomers`).
   */
  async countCustomers(): Promise<Result<number>> {
    const total = await this.userRepo.count({
      where: {
        isDeleted: false,
        role: UserRoleEnum.CUSTOMER,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all active (non-deleted) users, sorted by email.
   *
   * @returns {Promise<Result<User[]>>} A standardized paginated-like response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: an array of user objects (with sensitive fields like `password` omitted).
   * - `total`: the total number of active users in the system (useful for pagination).
   *
   * Note: Although this endpoint returns all users at once (no pagination),
   * the response includes `total` to maintain consistency with paginated endpoints.
   */
  async findAll(): Promise<Result<ResponseUserDto[]>> {
    const [users, total] = await this.userRepo.findAndCount({
      where: {
        isDeleted: false,
      },
      order: {
        email: 'ASC',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      data: users as ResponseUserDto[],
      total,
    };
  }

  /**
   * Retrieves a list of all users role SELLER, sorted by email.
   *
   * @returns {Promise<Result<User[]>>} A standardized paginated-like response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: an array of user objects (with sensitive fields like `password` omitted).
   * - `total`: the total number of users in the system (useful for pagination).
   *
   * Note: Although this endpoint returns all users at once (no pagination),
   * the response includes `total` to maintain consistency with paginated endpoints.
   */
  async findAllSellers(): Promise<Result<User[]>> {
    const [users, total] = await this.userRepo.findAndCount({
      where: {
        isDeleted: false,
        role: UserRoleEnum.SELLER,
      },
      order: { email: 'ASC' },
    });
    const rta = users.map((user) => {
      user.password = undefined;
      return user;
    });
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      total,
    };
  }

  /**
   * Retrieves a list of all users role CUSTOMER, sorted by email.
   *
   * @returns {Promise<Result<User[]>>} A standardized paginated-like response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: an array of user objects (with sensitive fields like `password` omitted).
   * - `total`: the total number of active users in the system (useful for pagination).
   *
   * Note: Although this endpoint returns all users at once (no pagination),
   * the response includes `total` to maintain consistency with paginated endpoints.
   */
  async findAllCustomers(): Promise<Result<User[]>> {
    const [users, total] = await this.userRepo.findAndCount({
      where: {
        isDeleted: false,
        role: UserRoleEnum.CUSTOMER,
      },
      order: { email: 'ASC' },
    });
    const rta = users.map((user) => {
      user.password = undefined;
      return user;
    });
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      total,
    };
  }

  /**
   * Retrieves a single active user by ID, including related entities (`createdBy`, `updatedBy`).
   *
   * @param id - The ID of the user to retrieve.
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: a single user object with sensitive fields (e.g., `password`) omitted.
   *
   * @throws {NotFoundException} if no active user with the given ID exists.
   *
   */
  async findOne(id: User['id']): Promise<Result<ResponseUserDto>> {
    const user = await this.userRepo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException(`The User with id: ${id} not found`);
    }
    user.password = undefined;
    return {
      statusCode: HttpStatus.OK,
      data: user as ResponseUserDto,
    };
  }

  /**
   * Retrieves a single active user by ID, without related entities.
   *
   * @param id - The ID of the user to retrieve.
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: a single user object with sensitive fields (e.g., `password`) omitted.
   *
   * @throws {NotFoundException} if no active user with the given ID exists.
   *
   */
  async findOneWithoutRelations(id: User['id']): Promise<Result<User>> {
    const user = await this.userRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException(`The User with id: ${id} not found`);
    }
    user.password = undefined;
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  /**
   * Retrieves a single active user by EMAIL, without related entities.
   *
   * @param email - The EMAIL of the user to retrieve.
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates successful retrieval.
   * - `data`: a single user object with sensitive fields (e.g., `password`) omitted.
   *
   * @throws {NotFoundException} if no active user with the given ID exists.
   *
   */
  async findOneByEmail(email: string): Promise<Result<User>> {
    const user = await this.userRepo.findOneBy({ email });
    if (!user) {
      throw new NotFoundException(`The User with email ${email} not found`);
    }
    user.password = undefined;
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  /**
   * Finds a user by email for authentication purposes.
   *
   * This method is intended to be used during the login flow to retrieve
   * the user record (including the password hash) for credential validation.
   *
   * @param email - The email address of the user to find.
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates the user was found.
   * - `data`: the full user object (including sensitive fields like `password`).
   *
   * @throws {UnauthorizedException} if no user with the given email exists.
   *
   * ⚠️ Security note: The returned user includes the `password` hash.
   * This is by design for authentication, but the result must never be sent
   * directly to the client. Always validate credentials in the auth service
   * and return a sanitized response (e.g., JWT token) instead.
   */
  async findAndValidateEmail(email: string): Promise<Result<User>> {
    const user = await this.userRepo.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException(`Not Allow`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  /**
   * Creates a new user in the system after ensuring email uniqueness.
   *
   * The password from the DTO is hashed using bcrypt before being persisted.
   * The returned user object excludes the `password` field (set to `undefined`)
   * to prevent accidental exposure of sensitive data.
   *
   * @param dto - The data transfer object containing user creation data (email, password, role, etc.).
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 201 Created — indicates successful user creation.
   * - `data`: the created user object with sensitive fields (e.g., `password`) omitted.
   * - `message`: a human-readable success message.
   *
   * @throws {ConflictException} if a user with the provided email already exists.
   *
   * ⚠️ Note: While `password` is explicitly set to `undefined` to exclude it from
   * the response, for maximum safety and maintainability, consider returning a
   * dedicated `UserResponseDto` instead of the raw entity.
   */
  async create(
    dto: CreateUserDto,
    userId: number,
  ): Promise<Result<ResponseUserDto>> {
    const email = dto.email.toLowerCase();

    const existUserEmail = await this.userRepo.findOneBy({ email });
    if (existUserEmail) {
      throw new ConflictException(`The Email ${email} is already in use`);
    }
    const newUser = this.userRepo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;
    const user = await this.userRepo.save(newUser);
    user.password = undefined;
    return {
      statusCode: HttpStatus.CREATED,
      data: user as ResponseUserDto,
      message: 'The user was created',
    };
  }

  /**
   * Registers a new user publicly (without authentication).
   *
   * This method is intended for self-registration via a public signup form.
   * The new user is assigned the 'customer' role by default, and the system
   * automatically sets `createdBy` and `updatedBy` to the new user's own ID,
   * ensuring accurate audit trails for self-created accounts.
   *
   * The password is hashed before persistence, and excluded from the response
   * by setting it to `undefined` to prevent accidental exposure.
   *
   * @param dto - The registration data (email, password, and optionally role).
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 201 Created — indicates successful registration.
   * - `data`: the newly created user object (with sensitive fields like `password` omitted).
   * - `message`: a success confirmation message.
   *
   * @throws {ConflictException} if a user with the provided email already exists.
   *
   * ⚠️ Security note: This endpoint must be rate-limited and protected against
   * automated abuse (e.g., bot registrations). Consider adding CAPTCHA or email verification
   * in production environments.
   */
  async register(dto: CreateUserDto): Promise<Result<User>> {
    const email = dto.email.toLowerCase();
    const existUserEmail = await this.userRepo.findOneBy({ email });
    if (existUserEmail) {
      throw new ConflictException(`The Email ${email} is already in use`);
    }
    const newUser = this.userRepo.create(dto);
    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;
    const savedUser = await this.userRepo.save(newUser);
    savedUser.createdBy = { id: savedUser.id } as User;
    savedUser.updatedBy = { id: savedUser.id } as User;

    const user = await this.userRepo.save(savedUser);
    user.password = undefined;
    return {
      statusCode: HttpStatus.CREATED,
      data: user,
      message: 'The user was created',
    };
  }

  /**
   * Updates an existing user by ID with the provided partial data.
   *
   * If an email is included in the changes, it is normalized to lowercase
   * and validated for uniqueness across other users. The user's password hash
   * is excluded from the response by setting it to `undefined`, ensuring it
   * is not serialized in the output.
   *
   * @param id - The unique identifier of the user to update.
   * @param changes - A partial update payload (e.g., email, firstName, role).
   * @returns {Promise<Result<User>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates the user was successfully updated.
   * - `data`: the updated user object with sensitive fields (e.g., `password`) omitted.
   * - `message`: a success confirmation message including the user ID.
   *
   * @throws {NotFoundException} if no active user with the given ID exists (via `findOne`).
   * @throws {ConflictException} if the new email is already assigned to another user.
   *
   * ⚠️ Note: While `password` is safely excluded via `undefined`, for long-term
   * maintainability and stronger contract guarantees, consider returning a
   * `UserResponseDto` instead of the raw entity.
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateUserDto,
  ): Promise<Result<ResponseUserDto>> {
    const { data } = await this.findOne(id);
    this.userRepo.merge(data as User, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.userRepo.save(data as User);
    rta.password = undefined;
    return {
      statusCode: HttpStatus.OK,
      data: rta as ResponseUserDto,
      message: `The User with ID: ${id} has been modified`,
    };
  }

  /**
   * Updates the password of an existing user by ID and returns a success message.
   *
   * The new password is hashed using bcrypt before being persisted.
   * The success message is returned in the `data` field as a string.
   *
   * @param id - The unique identifier of the user whose password will be updated.
   * @param changes - The DTO containing the new plain-text password.
   * @returns {Promise<Result<string>>} A standardized response containing:
   * - `statusCode`: 200 OK — indicates successful password update.
   * - `data`: a success message string ('Password updated successfully').
   *
   * @throws {NotFoundException} if no active user with the given ID exists (via `findOne`).
   *
   * ⚠️ Security note: This endpoint must be protected by strong authentication.
   * Consider requiring the current password to prevent account takeover.
   */
  async updatePassword(
    id: number,
    changes: UpdatePasswordDto,
  ): Promise<Result<string>> {
    const { data } = await this.findOne(id);
    const hashPassword = await bcrypt.hash(changes.password, 10);
    const newPasswordChanges = {
      password: hashPassword,
    };
    this.userRepo.merge(data as User, newPasswordChanges);
    const rta = await this.userRepo.save(data as User);
    rta.password = undefined;
    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
    };
  }

  /* Remove */
  async remove(id: User['id'], userId: number) {
    const { data } = await this.findOneWithoutRelations(id);
    const user = data as User;

    const changes = {
      deletedBy: { id: userId } as User,
      isDeleted: true,
      deletedAt: new Date(),
    };

    this.userRepo.merge(user, changes);
    await this.userRepo.save(user);
    return {
      statusCode: HttpStatus.OK,
      message: `The User with id: ${id} has been deleted`,
    };
  }
}
