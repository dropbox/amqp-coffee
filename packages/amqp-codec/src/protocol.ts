import * as protocol from './amqp-definitions-0-9-1'
export { Class, Field, FieldTypes } from './amqp-definitions-0-9-1'

export interface MethodsTableMethod {
  name: string;
  fields: protocol.Field[];
  methodIndex: number;
  classIndex: number;
}

export interface MethodsTable {
  [classIndex: number]: {
    [methodIndex: number]: MethodsTableMethod,
  };
}

export interface ClassesTable {
  [classIndex: number]: protocol.Class;
}

export interface MethodByNameTable {
  [methodName: string]: MethodsTableMethod;
}

export const methods: MethodByNameTable = Object.create(null)
export const classes: ClassesTable = Object.create(null)
export const methodTable: MethodsTable = Object.create(null)

for (const classInfo of protocol.classes) {
  classes[classInfo.index] = classInfo
  for (const methodInfo of classInfo.methods) {
    // className + methodInfo.name.toCammelCase
    const name = `${classInfo.name}${methodInfo.name[0].toUpperCase()}${methodInfo.name.slice(1)}`
    const method = {
      classIndex: classInfo.index,
      fields: methodInfo.fields,
      methodIndex: methodInfo.index,
      name,
    }

    if (methodTable[method.classIndex] == null) {
      methodTable[method.classIndex] = Object.create(null)
    }

    methodTable[method.classIndex][method.methodIndex] = method
    methods[name] = method
  }
}
