parseString = require('xml2js').parseString;
ampqDefinition = require('fs').readFileSync("../amqp-0-9-1-rabbit.xml")

constantsForExport = []
classesForExport = []

makeCamelCase = (string)->
    string = string.replace(/-/g, ' ').replace(/\s(.)/g, (str)-> return str.toUpperCase()).replace(/\s/g,'')
    if string == "nowait" then string = "noWait" # special case for consumer confirms feels like a bug but correct in the spec
    return string

parseString ampqDefinition, (err, res)->
    constants = res.amqp.constant
    classes = res.amqp.class

    domains = {}

    for domain in res.amqp.domain
        domains[domain['$'].name] = domain['$'].type

    # CONSTANTS
    for constant in constants
        constantsForExport.push [parseInt(constant['$'].value), makeCamelCase(constant['$'].name)]


    # CLASSES
    for classDef in classes

        classDefForExport = {name: makeCamelCase(classDef['$'].name), index: parseInt(classDef['$'].index), fields: [], methods: []}

        if classDef.field?
            for field in classDef.field

                if field['$'].type?
                    domain =  field['$'].type

                else
                    domain = domains[field['$'].domain]

                classDefForExport.fields.push {name: makeCamelCase(field['$'].name), domain: domain}



        for method in classDef.method
            methodDefForExport = {name: makeCamelCase(method['$'].name), index: parseInt(method['$'].index), fields: []}

            if method.field?
                for field in method.field

                    if field['$'].type?
                        domain =  field['$'].type

                    else
                        domain = domains[field['$'].domain]
   
                    methodDefForExport.fields.push {name: makeCamelCase(field['$'].name), domain: domain}

            classDefForExport.methods.push methodDefForExport

        classesForExport.push classDefForExport

    console.log "exports.constants = " + JSON.stringify constantsForExport
    console.log "exports.classes = " + JSON.stringify classesForExport

