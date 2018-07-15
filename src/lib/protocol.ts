/**
 * Parses protocol file and returns data
 */
export default (protocolFile: string) => {
  const protocol = require(protocolFile)

  const methodTable = {}
  const methods = {}
  const classes = {}

  for (const classInfo of protocol.classes) {
    classes[classInfo.index] = classInfo
    for (const methodInfo of classInfo.methods) {
      // className + methodInfo.name.toCammelCase
      const name = `${classInfo.name}${methodInfo.name[0].toUpperCase()}${methodInfo.name.slice(1)}`
      const method = {
        name,
        fields: methodInfo.fields,
        methodIndex: methodInfo.index,
        classIndex: classInfo.index,
      }

      if (methodTable[method.classIndex] == null) {
        methodTable[method.classIndex] = {}
      }

      methodTable[method.classIndex][method.methodIndex] = method
      methods[name] = method
    }
  }

  return { methods, methodTable, classes }
}
