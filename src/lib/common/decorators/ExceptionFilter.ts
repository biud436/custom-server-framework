import Container from "typedi";
import { ExceptionScanner } from "../../IoC/scanners/ExceptionScanner";
import {
    DynamicClassWrapper,
    ExceptionMetadata,
} from "../../IoC/scanners/MetadataScanner";
import { ErrorMetadataScanner } from "../../IoC/scanners/ErrorMetadataScanner";
import { createUniqueExceptionKey } from "../../../utils/scanner";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ExceptionFilter<T extends Error = Error>(
    errorClazz: DynamicClassWrapper<T>,
): ClassDecorator {
    return function (target: any) {
        const scanner = Container.get(ExceptionScanner);
        const metadataScanner = Container.get(ErrorMetadataScanner);

        const name = createUniqueExceptionKey(errorClazz.name, scanner);

        scanner.set(name, <ExceptionMetadata>{
            target,
            exception: errorClazz,
            handlers: metadataScanner.allMetadata(),
        });

        metadataScanner.clear();

        return target;
    };
}
