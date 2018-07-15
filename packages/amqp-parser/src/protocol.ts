import * as protocol from './amqp-definitions-0-9-1';
export { InterfaceClass, InterfaceField } from './amqp-definitions-0-9-1';

export interface InterfaceMethodsTableMethod {
  name: string;
  fields: protocol.InterfaceField[];
  methodIndex: number;
  classIndex: number;
}

export interface InterfaceMethodsTable {
  [classIndex: number]: {
    [methodIndex: number]: InterfaceMethodsTableMethod,
  };
}

export interface InterfaceClassesTable {
  [classIndex: number]: protocol.InterfaceClass;
}

export interface InterfaceMethodByNameTable {
  [methodName: string]: InterfaceMethodsTableMethod;
}

export const methods: InterfaceMethodByNameTable = Object.create(null);
export const classes: InterfaceClassesTable = Object.create(null);
export const methodTable: InterfaceMethodsTable = Object.create(null);

for (const classInfo of protocol.classes) {
  classes[classInfo.index] = classInfo;
  for (const methodInfo of classInfo.methods) {
    // className + methodInfo.name.toCammelCase
    const name = `${classInfo.name}${methodInfo.name[0].toUpperCase()}${methodInfo.name.slice(1)}`;
    const method = {
      classIndex: classInfo.index,
      fields: methodInfo.fields,
      methodIndex: methodInfo.index,
      name,
    };

    if (methodTable[method.classIndex] == null) {
      methodTable[method.classIndex] = Object.create(null);
    }

    methodTable[method.classIndex][method.methodIndex] = method;
    methods[name] = method;
  }
}
