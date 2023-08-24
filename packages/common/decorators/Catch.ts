/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "typedi";
import {
    ErrorAdvice,
    ErrorMetadata,
} from "@stingerloom/IoC/scanners/MetadataScanner";
import { ErrorMetadataScanner } from "@stingerloom/IoC/scanners/ErrorMetadataScanner";

export const CATCH_METADATA = "CATCH_METADATA";
export function Catch(advice: ErrorAdvice = "throwing") {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const scanner = Container.get(ErrorMetadataScanner);
        const uniqueKey = scanner.createUniqueKey();

        Reflect.defineMetadata(CATCH_METADATA, true, target);

        scanner.set(uniqueKey, <ErrorMetadata>{
            target,
            handler: descriptor.value,
            advice,
        });
    } as MethodDecorator;
}
