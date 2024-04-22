/* eslint-disable @typescript-eslint/no-explicit-any */
import { Sql } from "sql-template-tag";
import { DatabaseClient } from "../DatabaseClient";
import { IConnector } from "../types/IConnector";
import { MySqlDataSource } from "./mysql/MySqlDataSource";
import { IDataSource } from "./IDataSource";
import { Logger } from "@stingerloom/common";

type IOrderBy<T> = {
    [K in keyof T]: "ASC" | "DESC";
};
type ISelectOption<T> =
    | (keyof T)[]
    | {
          [K in keyof T]?: boolean;
      }
    | {
          [K in keyof T]?: FindOption<T[K]>;
      };

export type TRANSACTION_ISOLATION_LEVEL =
    | "READ UNCOMMITTED"
    | "READ COMMITTED"
    | "REPEATABLE READ"
    | "SERIALIZABLE";

export interface ITxEngine {
    /**
     * 트랜잭션을 시작합니다.
     */
    startTransaction(level?: TRANSACTION_ISOLATION_LEVEL): Promise<void>;

    /**
     * 트랜잭션을 롤백합니다.
     */
    rollback(): Promise<void>;

    /**
     * 트랜잭션을 커밋합니다.
     */
    commit(): Promise<void>;

    /**
     * savepoint를 생성합니다.
     * @param name 저장점 이름
     */
    savepoint(name: string): Promise<void>;

    /**
     * savepoint로 롤백합니다.
     * @param name 저장점 이름
     */
    rollbackTo(name: string): Promise<void>;
}

export abstract class IQueryEngine implements ITxEngine {
    abstract connect(): Promise<void>;

    /**
     * SQL을 실행합니다 (트랜잭션 내부에서 실행됩니다)
     *
     * @param sql
     */
    abstract query(sql: string): Promise<any>;
    abstract query<T = any>(sql: Sql): Promise<T>;

    abstract startTransaction(
        level?: TRANSACTION_ISOLATION_LEVEL,
    ): Promise<void>;
    abstract rollback(): Promise<void>;
    abstract commit(): Promise<void>;

    abstract savepoint(name: string): Promise<void>;
    abstract rollbackTo(name: string): Promise<void>;

    abstract close(): Promise<void>;
}

export type FindOption<T> = {
    select?: ISelectOption<T>;
    where?: {
        [K in keyof T]?: T[K];
    };
    limit?: number;
    take?: number;
    orderBy?: IOrderBy<Partial<T>>;
    groupBy?: (keyof T)[];
    relations?: (keyof T)[];
};

export class TransactionHolder extends IQueryEngine {
    private connection?: IConnector;
    private dataSource?: IDataSource;
    private readonly logger: Logger = new Logger(TransactionHolder.name);

    constructor() {
        super();
    }

    public async connect() {
        try {
            // @Transactional을 사용한다면 TransactionManager를 통해,
            // 데이터 소스(DataSource)를 같은 컨텍스트 내에서 공유할 수 있도록 해야 합니다.
            this.connection =
                await DatabaseClient.getInstance().getConnection();
            this.dataSource = new MySqlDataSource(this.connection);
            await this.dataSource.createConnection();
        } catch (error: unknown) {
            throw new Error("데이터베이스 연결에 실패했습니다.");
        }
    }

    public async query(sql: string): Promise<any>;
    public async query<T = any>(sql: Sql): Promise<T>;
    public async query<T = any>(sql: string | Sql): Promise<T> {
        if (!this.connection) {
            throw new Error("데이터베이스 연결이 되어있지 않습니다.");
        }
        const queryResult = await this.dataSource?.query(sql as string);

        // this.logger.info(`Query> ${sql instanceof Sql ? sql.text : sql}`);

        return queryResult;
    }

    public async startTransaction(
        level: TRANSACTION_ISOLATION_LEVEL = "READ COMMITTED",
    ) {
        if (!this.connection) {
            throw new Error("데이터베이스 연결이 되어있지 않습니다.");
        }

        return this.dataSource?.startTransaction(level);
    }

    public async rollback() {
        return this.dataSource?.rollback();
    }

    public async commit() {
        return this.dataSource?.commit();
    }

    public async savepoint(name: string) {
        return this.dataSource?.savepoint(name);
    }

    public async rollbackTo(name: string) {
        return this.dataSource?.rollbackTo(name);
    }

    public async close() {
        if (!this.connection) {
            throw new Error("데이터베이스 연결이 되어있지 않습니다.");
        }

        await this.dataSource?.close();
    }
}
