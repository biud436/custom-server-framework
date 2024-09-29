import { ClazzType, ReflectManager } from "@stingerloom/common";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MANY_TO_ONE_TOKEN = Symbol.for("MANY_TO_ONE");
export const JOIN_COLUMN_TOKEN = Symbol.for("JOIN_COLUMN");

export type EntityLike<T = any> = ClazzType<T>;
export type RetrieveEntity<T> = () => T;
export type SetRelatedEntity<T extends EntityLike> = (
    entity: InstanceType<T>,
) => void;

export type ManyToOneOption = {
    /**
     * 데이터베이스에서 컬럼의 값을 가져올 때, 오브젝트에 매핑되는 컬럼의 타입을 변환할 수 있는 함수입니다.
     */
    transform?: <T = any>(raw: unknown) => T;
    joinColumn?: string;
};

export type ManyToOneMetadata<T> = {
    target: ClazzType<unknown>;
    type: EntityLike;

    columnName: string;

    joinColumn?: string;

    /**
     * 연관관계의 엔티티를 가져오는 함수입니다
     */
    getMappingEntity: RetrieveEntity<T>;

    /**
     * 매핑할 엔티티를 가져오는 함수입니다
     */
    getMappingProperty: SetRelatedEntity<EntityLike>;

    option?: ManyToOneOption;
};

/**
 * ManyToOne 관계를 설정합니다.
 * 연관관계에서 주인이 되는 엔티티에 설정해야 합니다.
 *
 * @example
 *
 * @ManyToOne(() => User, (entity) => entity.user)
 * user: User;
 */
export function ManyToOne<T extends EntityLike>(
    getMappingEntity: RetrieveEntity<T>,
    getMappingProperty: SetRelatedEntity<EntityLike>,
    option?: ManyToOneOption,
): PropertyDecorator {
    return (target, propertyKey) => {
        const injectParam = ReflectManager.getType<any>(target, propertyKey);

        const columnName = propertyKey.toString();
        const metadata = <ManyToOneMetadata<T>>{
            target,
            type: injectParam,
            columnName, // 조인 컬럼이 필요... 이건 productId가 되어야 하는데, product가 되어버림...
            joinColumn: option?.joinColumn,
            getMappingEntity,
            getMappingProperty,
            option,
        };

        const columns = Reflect.getMetadata(MANY_TO_ONE_TOKEN, target);

        Reflect.defineMetadata(
            MANY_TO_ONE_TOKEN,
            [...(columns || []), metadata],
            target,
        );

        // 스캐너가 따로 있어야 할까?
    };
}