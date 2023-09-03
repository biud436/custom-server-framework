/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    InjectQueryRunner,
    InjectRepository,
    Injectable,
    OnModuleInit,
    Transactional,
    TransactionalZone,
} from "@stingerloom/common";
import { User } from "@stingerloom/example/entity/User";
import { Repository } from "typeorm/repository/Repository";
import { CreateUserDto } from "./dto/CreateUserDto";
import { DiscoveryService } from "@stingerloom/services";
import { BadRequestException } from "@stingerloom/error/BadRequestException";
import { ResultUtils } from "@stingerloom/example/common/ResultUtils";
import { LoginUserDto } from "../auth/dto/LoginUserDto";
import bcrypt from "bcrypt";
import { QueryRunner } from "typeorm";

@TransactionalZone()
@Injectable()
export class UserService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly discoveryService: DiscoveryService,
    ) {}

    /**
     * 모듈 초기화
     */
    async onModuleInit() {
        await this.userRepository.clear();
    }

    @Transactional()
    async create(
        createUserDto: CreateUserDto,
        @InjectQueryRunner() queryRunner?: QueryRunner,
    ) {
        const safedUserDto = createUserDto as Record<string, any>;
        if (safedUserDto.role) {
            throw new BadRequestException("role 속성은 입력할 수 없습니다.");
        }

        const newUser = await this.userRepository.create(createUserDto);

        console.log("newUser", newUser);
        const res = await queryRunner?.manager.save(newUser);

        console.log("res", res);

        return ResultUtils.success("유저 생성에 성공하였습니다.", res);
    }

    async validateUser(loginUserDto: LoginUserDto): Promise<User> {
        const { username, password } = loginUserDto;

        const user = await this.userRepository
            .createQueryBuilder("user")
            .select()
            .where("user.username = :username", {
                username,
            })
            .getOne();

        if (!user) {
            throw new BadRequestException("존재하지 않는 유저입니다.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    async getUser(ip: string) {
        const user = await this.userRepository.find();
        return ResultUtils.success("유저 조회에 성공하였습니다", {
            user,
            ip,
        });
    }
}
