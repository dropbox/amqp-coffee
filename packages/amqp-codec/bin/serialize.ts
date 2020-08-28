import _fs = require('fs')
import ts = require('typescript')
import { resolve } from 'path'
import * as protocol from '../src/amqp-definitions-0-9-1'

(async () => {
    const dest = resolve(__dirname, '../src/fixtures')
    const fs = _fs.promises

    try {
        await fs.mkdir(dest)
    } catch (e) {
        // ignore
    }

    type AdjustedMethod = Omit<protocol.Method, 'index'> & {
        classIndex: number;
        methodIndex: number;
    }

    const FieldTypeToType: Record<string, ts.TypeNode> = {
        bit: ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
        long: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        longlong: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        longstr: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        octet: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        short: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        shortstr: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        table: ts.factory.createTypeReferenceNode('Record<string, any>'),
        timestamp: ts.factory.createTypeReferenceNode('Date'),
    }

    const methods: Record<string, AdjustedMethod> = Object.create(null)
    const classes: Record<number, protocol.Class> = Object.create(null)
    const methodTable: Record<number, Record<number, AdjustedMethod>> = Object.create(null)
    const classMethodTable: Record<string, AdjustedMethod> = Object.create(null)
    const domains = new Set<string>()
    const fieldNames = new Set<string>()
    const methodNames = new Set<string>()
    const classNames = new Set<string>()
    const classIdToNames = new Map<number, string>()
    const classMethodIds = new Set<string>()

    for (const classInfo of protocol.classes) {
        classes[classInfo.index] = classInfo
        classIdToNames.set(classInfo.index, classInfo.name)
        classNames.add(classInfo.name)

        for (const classField of classInfo.fields) {
            fieldNames.add(classField.name)
            domains.add(classField.domain)
        }

        for (const methodInfo of classInfo.methods) {
            // className + methodInfo.name.toCammelCase
            const name = `${classInfo.name}${methodInfo.name[0].toUpperCase()}${methodInfo.name.slice(1)}`
            const method = {
                classIndex: classInfo.index,
                fields: methodInfo.fields,
                methodIndex: methodInfo.index,
                name,
            }
            const classMethodId = `${method.classIndex}_${method.methodIndex}`
            methodInfo.name = name // rename to what we use

            methodNames.add(name)
            classMethodIds.add(classMethodId)

            if (methodTable[method.classIndex] == null) {
                methodTable[method.classIndex] = Object.create(null)
            }

            for (const { domain, name } of methodInfo.fields.values()) {
                domains.add(domain)
                fieldNames.add(name)
            }

            methodTable[method.classIndex][method.methodIndex] = method
            methods[name] = method
            classMethodTable[classMethodId] = method
        }
    }

    const enumFromSet = (name: string, set: Set<string>): ts.EnumDeclaration => {
        return ts.factory.createEnumDeclaration(
            undefined,
            [
                ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
                ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)
            ],
            name,
            Array.from(set, (member) => ts.factory.createEnumMember(
                member,
                ts.factory.createStringLiteral(member)
            ))
        )
    }

    // domain types
    const fieldTypesEnum = enumFromSet('FieldTypes', domains)
    const fieldNamesEnum = enumFromSet('FieldNames', fieldNames)
    const methodNamesEnum = enumFromSet('MethodNames', methodNames)
    const classNamesEnum = enumFromSet('ClassNames', classNames)
    const classIdsEnum = ts.factory.createEnumDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
        'ClassIds',
        Array.from(classIdToNames.entries()).map(([classIndex, name]) => ts.factory.createEnumMember(
            name,
            ts.factory.createNumericLiteral(classIndex)
        ))
    )
    
    const classMethodIdsEnum = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ClassMethodIds'),
        undefined,
        ts.factory.createUnionTypeNode(Array.from(classMethodIds, (id) => (
            ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(id))))
        )
    )

    const fieldType = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('Field'),
        undefined,
        ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
                undefined,
                ts.factory.createIdentifier('name'),
                undefined,
                ts.factory.createTypeReferenceNode(fieldNamesEnum.name)
            ),
            ts.factory.createPropertySignature(
                undefined,
                ts.factory.createIdentifier('domain'),
                undefined,
                ts.factory.createTypeReferenceNode(fieldTypesEnum.name)
            )
        ])
    )

    const methodTypes = Object.values(classMethodTable).map((method) => {
        return ts.factory.createTypeAliasDeclaration(
            undefined, 
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createIdentifier(method.name),
            undefined,
            ts.factory.createTypeLiteralNode([
                ts.factory.createPropertySignature(undefined, 'name', undefined, ts.factory.createTypeReferenceNode(
                    `${methodNamesEnum.name.text}.${method.name}`
                )),
                ts.factory.createPropertySignature(undefined, 'classIndex', undefined, ts.factory.createTypeReferenceNode(
                    `${classIdsEnum.name.text}.${classes[method.classIndex].name}`
                )),
                ts.factory.createPropertySignature(undefined, 'methodIndex', undefined, ts.factory.createLiteralTypeNode(
                    ts.factory.createNumericLiteral(method.methodIndex)
                )),
                ts.factory.createPropertySignature(
                    undefined, 'fields', undefined,
                    ts.factory.createTupleTypeNode(method.fields.map(({ name, domain }) => (
                        ts.factory.createTypeLiteralNode([
                            ts.createPropertySignature(
                                undefined,
                                ts.factory.createIdentifier('name'),
                                undefined,
                                ts.factory.createTypeReferenceNode(`${fieldNamesEnum.name.text}.${name}`)
                            ),
                            ts.createPropertySignature(
                                undefined,
                                ts.factory.createIdentifier('domain'),
                                undefined,
                                ts.factory.createTypeReferenceNode(`${fieldTypesEnum.name.text}.${domain}`)
                            ),
                        ])
                    )))
                ),
            ])
        )
    })

    const methodArgTypes = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('MethodArgTypes'),
        undefined,
        ts.factory.createTypeLiteralNode(Object.values(methods).map((method) => (
            ts.factory.createPropertySignature(
                undefined,
                ts.factory.createIdentifier(`[${methodNamesEnum.name.text}.${method.name}]`),
                undefined,
                method.fields.length > 0 ? ts.factory.createTypeLiteralNode(
                    method.fields.map(({ name, domain }) => (
                        ts.factory.createPropertySignature(
                            undefined, 
                            ts.factory.createIdentifier(`[${fieldNamesEnum.name.text}.${name}]`),
                            undefined,
                            FieldTypeToType[domain] ?? ts.factory.createTypeReferenceNode('any')
                        )
                    ))
                ) : ts.factory.createTypeReferenceNode('never')
            )
        )))
    )

    const classTypes = Object.values(classes).map((classInfo) => {
        return ts.factory.createTypeAliasDeclaration(
            undefined,
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createIdentifier(classInfo.name),
            undefined,
            ts.factory.createTypeLiteralNode([
                ts.factory.createPropertySignature(undefined, 'name', undefined, ts.factory.createTypeReferenceNode(
                    `${classNamesEnum.name.text}.${classInfo.name}`
                )),
                ts.factory.createPropertySignature(undefined, 'index', undefined, ts.factory.createTypeReferenceNode(
                    `${classIdsEnum.name.text}.${classInfo.name}`
                )),
                ts.factory.createPropertySignature(
                    undefined, 'fields', undefined, 
                    ts.factory.createTupleTypeNode(classInfo.fields.map(({ name, domain }) => (
                        ts.factory.createTypeLiteralNode([
                            ts.createPropertySignature(
                                undefined,
                                ts.factory.createIdentifier('name'),
                                undefined,
                                ts.factory.createTypeReferenceNode(`${fieldNamesEnum.name.text}.${name}`)
                            ),
                            ts.createPropertySignature(
                                undefined,
                                ts.factory.createIdentifier('domain'),
                                undefined,
                                ts.factory.createTypeReferenceNode(`${fieldTypesEnum.name.text}.${domain}`)
                            ),
                        ])
                    )))
                ),
                ts.factory.createPropertySignature(
                    undefined, 'methods', undefined, 
                    ts.factory.createTupleTypeNode(classInfo.methods.map(({ name }) => (
                        ts.factory.createTypeReferenceNode(name)
                    )))
                ),
            ])
        )
    })

    const methodType = ts.factory.createTypeAliasDeclaration(
        undefined, 
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('MethodsTable'),
        undefined,
        ts.factory.createTypeLiteralNode(Object.entries(methods).map(([methodName, method]) => (
            ts.createPropertySignature(
                undefined,
                ts.factory.createIdentifier(`[${methodNamesEnum.name.text}.${methodName}]`),
                undefined,
                ts.factory.createTypeReferenceNode(method.name),
                undefined
            )
        )))
    )

    const methodsData = ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier('methods'),
            undefined,
            ts.factory.createTypeReferenceNode(methodType.name),
            ts.factory.createObjectLiteralExpression(Object.entries(methods).map(([key, method]) => {
                return ts.factory.createPropertyAssignment(key, ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment('name', 
                        ts.factory.createPropertyAccessExpression(methodNamesEnum.name, method.name)
                    ),
                    ts.factory.createPropertyAssignment('classIndex', ts.factory.createNumericLiteral(method.classIndex)),
                    ts.factory.createPropertyAssignment('methodIndex', ts.factory.createNumericLiteral(method.methodIndex)),
                    ts.factory.createPropertyAssignment('fields', ts.factory.createArrayLiteralExpression(method.fields.map((field: any) => (
                        ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment('domain', ts.factory.createPropertyAccessExpression(
                                fieldTypesEnum.name,
                                field.domain
                            )),
                            ts.factory.createPropertyAssignment('name', ts.factory.createPropertyAccessExpression(
                                fieldNamesEnum.name,
                                field.name
                            ))
                        ])
                    ))))
                ]))
            }), true)
        )], ts.NodeFlags.Const)
    )

    const classType = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('Classes'),
        undefined,
        ts.factory.createTypeLiteralNode(Object.values(classes).map((classInfo) => (
            ts.factory.createPropertySignature(
                undefined,
                ts.factory.createIdentifier(`[${classIdsEnum.name.text}.${classInfo.name}]`),
                undefined,
                ts.factory.createTypeReferenceNode(classInfo.name)
            )
        )))
    )

    const classData = ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
            'classes',
            undefined,
            ts.factory.createTypeReferenceNode(classType.name),
            ts.factory.createObjectLiteralExpression(
                Object.values(classes).map((classInfo) => (
                    ts.factory.createPropertyAssignment(
                        ts.factory.createComputedPropertyName(ts.factory.createPropertyAccessExpression(
                            classIdsEnum.name,
                            classInfo.name
                        )),
                        ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment('name', ts.factory.createPropertyAccessExpression(
                                classNamesEnum.name, classInfo.name
                            )),

                            ts.factory.createPropertyAssignment('index', ts.factory.createPropertyAccessExpression(
                                classIdsEnum.name, classInfo.name
                            )),

                            ts.factory.createPropertyAssignment('fields', ts.factory.createArrayLiteralExpression(
                                classInfo.fields.map(({ name, domain }) => (
                                    ts.factory.createObjectLiteralExpression([
                                        ts.factory.createPropertyAssignment(
                                            ts.factory.createIdentifier('name'),
                                            ts.factory.createPropertyAccessExpression(fieldNamesEnum.name, name)
                                        ),
                                        ts.factory.createPropertyAssignment(
                                            ts.factory.createIdentifier('domain'),
                                            ts.factory.createPropertyAccessExpression(fieldTypesEnum.name, domain)
                                        ),  
                                    ])
                                )), true),
                            ),

                            ts.factory.createPropertyAssignment('methods', ts.factory.createArrayLiteralExpression(
                                Object.values(classInfo.methods).map(({ name }) => (
                                    ts.factory.createPropertyAccessExpression(
                                        ts.factory.createIdentifier('methods'),
                                        name
                                    )
                                )), 
                                true
                            ))
                        ], true)
                    )
                )), true
            )
        )], ts.NodeFlags.Const)
    )

    const classMethodsType = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ClassMethodsTable'),
        undefined,
        ts.factory.createTypeLiteralNode(Object.entries(classMethodTable).map(([classId, method]) => (
            ts.createPropertySignature(
                undefined,
                ts.factory.createStringLiteral(classId),
                undefined,
                ts.factory.createTypeReferenceNode(method.name),
                undefined
            )
        )))
    )

    const classMethodsData = ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
            ts.factory.createIdentifier('classMethodsTable'),
            undefined,
            ts.factory.createTypeReferenceNode(classMethodsType.name),
            ts.factory.createObjectLiteralExpression(Object.entries(classMethodTable).map(([classId, method]) => {
                return ts.factory.createPropertyAssignment(
                    ts.factory.createStringLiteral(classId),
                    ts.factory.createObjectLiteralExpression([
                        ts.factory.createPropertyAssignment('name',
                            ts.factory.createPropertyAccessExpression(methodNamesEnum.name, method.name)
                        ),
                        ts.factory.createPropertyAssignment('classIndex', ts.factory.createNumericLiteral(method.classIndex)),
                        ts.factory.createPropertyAssignment('methodIndex', ts.factory.createNumericLiteral(method.methodIndex)),
                        ts.factory.createPropertyAssignment('fields', ts.factory.createArrayLiteralExpression(method.fields.map((field: any) => (
                            ts.factory.createObjectLiteralExpression([
                                ts.factory.createPropertyAssignment('domain', ts.factory.createPropertyAccessExpression(
                                    fieldTypesEnum.name,
                                    field.domain
                                )),
                                ts.factory.createPropertyAssignment('name', ts.factory.createPropertyAccessExpression(
                                    fieldNamesEnum.name,
                                    field.name
                                ))
                            ])
                        ))))
                    ])
                )
            }), true)
        )], ts.NodeFlags.Const)
    )

    const resultFile = ts.createSourceFile('typed-protocol.ts', '', ts.ScriptTarget.ES2019, false, ts.ScriptKind.TS)
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    const statements: ts.Statement[] = [
        fieldTypesEnum, 
        fieldNamesEnum,
        methodNamesEnum,
        classNamesEnum,
        classIdsEnum,
        classMethodIdsEnum,
        fieldType,
        methodArgTypes,
        ...methodTypes,
        ...classTypes,
        methodType,
        methodsData,
        classMethodsType,
        classMethodsData,
        classType,
        classData,
    ]

    await fs.writeFile(resolve(dest, resultFile.fileName), printer.printFile(ts.factory.updateSourceFile(resultFile, statements)))
})()
