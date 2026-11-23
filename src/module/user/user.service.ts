import * as crypto from 'node:crypto';
import * as argon from 'argon2';
import { Injectable, ConflictException, NotFoundException, Inject }
from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import GetUsersFilterDto  from './dto/get-users-filter.dto';
import { UserDto } from './dto/user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { REDIS_TOKEN } from 'src/config/redis/redis.constant';
import Redis from 'ioredis';
import { BalanceChanedStatus, EventBalanceChangedData, EventNameEnum,
EventTransactionSavedData, TransactionType } from './user.types';
import { KafkaService } from '../../config/kafka/kafka.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    private readonly userRepository: UserRepository,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(user: CreateUserDto): Promise<void> {
    const userExist = await this.userRepository.checkExistUser({ phone: user.phone,
      login: user.login });
    if (userExist) {
      throw new ConflictException('User already exist');
    }

    const salt = crypto.randomBytes(32);
    const hash = await argon.hash(user.password, { salt });

    await this.userRepository.createUser({
      passwordHash: hash,
      passwordSalt: salt.toString('hex'),
      ...user,
    });
  }

  async changeBalance(params: EventTransactionSavedData): Promise<void> {
    const { userId, amount, transactionType, transactionId } = params;
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const { balance } = user;
      const numericBalance = Number(balance);
      const numericAmount = Number(amount);
      let newBalance: number;

      if (transactionType === TransactionType.DEPOSIT) {
        newBalance = numericBalance + numericAmount;
      } else if (transactionType === TransactionType.WITHDRAWL) {
        newBalance = numericBalance - numericAmount;
      } else {
        throw new ConflictException('Invalid transaction type');
      }

      if (newBalance < 0) {
        throw new ConflictException('Insufficient funds');
      }

      await this.userRepository.changeBalance({ userId, balance:
        newBalance.toString() });

      const data: EventBalanceChangedData = {
        transactionId,
        status: BalanceChanedStatus.COMPLETED,
      };

      await this.kafkaService.produce({ eventName: EventNameEnum.BalanceChanged,
        data });
    } catch (error: unknown) {
      const data: EventBalanceChangedData = {
        transactionId,
        status: BalanceChanedStatus.FAILED,
      };

      await this.kafkaService.produce({ eventName: EventNameEnum.BalanceChanged,
        data });
    }
  }

  async verification({ login, password }: SignInDto): Promise<boolean> {
    const user = await this.userRepository.findByLogin(login);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return argon.verify(user.passwordHash, password);
  }

  async findAll(getUserFilterDto: GetUsersFilterDto): Promise<{
    items: UserDto[];
    total: number;
  }> {
    const { items: users, total } = await
      this.userRepository.findAndCount(getUserFilterDto);
    const dtos = users.map((user) => new UserDto(user));
    return { items: dtos, total };
  }

  findOne(id: string) {
    return this.userRepository.findById(id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.updateUser({ userId: id, ...updateUserDto });
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    await this.redis.del(user.login);
    return this.userRepository.deleteUser(id);
  }
}