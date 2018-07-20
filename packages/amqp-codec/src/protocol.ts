import * as protocol from './amqp-definitions-0-9-1';
export { IClass, IField } from './amqp-definitions-0-9-1';

export interface IMethodsTableMethod {
  name: string;
  fields: protocol.IField[];
  methodIndex: number;
  classIndex: number;
}

export interface IMethodsTable {
  [classIndex: number]: {
    [methodIndex: number]: IMethodsTableMethod,
  };
}

export interface IClassesTable {
  [classIndex: number]: protocol.IClass;
}

export interface IMethodByNameTable {
  [methodName: string]: IMethodsTableMethod;
}

export const methods: IMethodByNameTable = Object.create(null);
export const classes: IClassesTable = Object.create(null);
export const methodTable: IMethodsTable = Object.create(null);

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
