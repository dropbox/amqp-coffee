module.exports = (protocolFile)->
  protocol = require(protocolFile)

  methodTable = {}
  methods = {}
  classes = {}

  for classInfo in protocol.classes
    classes[classInfo.index] = classInfo
    for methodInfo in classInfo.methods
      # className + methodInfo.name.toCammelCase
      name = "#{classInfo.name}#{methodInfo.name[0].toUpperCase()}#{methodInfo.name.slice(1)}"
      method = { name, fields: methodInfo.fields, methodIndex: methodInfo.index, classIndex: classInfo.index }

      if !methodTable[method.classIndex]? then methodTable[method.classIndex] = {}
      methodTable[method.classIndex][method.methodIndex] = method

      methods[name] = method

  return {methods, methodTable, classes}


