debug               = require('../config').debug('amqp:plugins:rabbit')
request = require('request')

module.exports =
  masterNode : (connection, queue, callback)->
    # only atempt if we have hosts
    if !connection.connectionOptions.hosts? then return callback()

    #TODO let the api host and port be specifically configured
    host  = connection.connectionOptions.host
    port  = connection.connectionOptions.port + 10000 # this is the default option, but should probably be configurable
    vhost = encodeURIComponent connection.connectionOptions.vhost

    #TODO get rid of request
    request.get "http://#{host}:#{port}/api/queues/#{vhost}/#{queue}", {
      auth: {
        user: connection.connectionOptions.login
        pass: connection.connectionOptions.password
      }
    }, (e, r)->
      if e? then return callback(e)
      if r.statusCode is 404 then return callback(null, true) # if our queue doesn't exist then master node doesn't matter

      try
        response = JSON.parse r.body
      catch e
        response = {}

      if !response.node?
        debug 1, ()-> return ["No .node in the api response,",response]
        return callback("No response node") # if we have no node information we doesn't really know what to do here

      masternode = response.node.split('@')[1] if response.node.indexOf('@') isnt -1
      masternode = masternode.toLowerCase()

      if connection.connectionOptions.host is masternode
        return callback(null, true)

      # connection.connectionOptions.hosts.hosts is set as toLowerCase in Connection
      for host, i in connection.connectionOptions.hosts

        if host.host is masternode or (host.host.indexOf('.') isnt -1 and host.host.split('.')[0] is masternode)
          connection.connectionOptions.hosti = i
          connection.updateConnectionOptionsHostInformation()
          return callback(null, true)

      debug 1, ()-> return "we can not connection to the master node, its not in our valid hosts.  Master : #{masternode} Hosts : #{JSON.stringify(connection.connectionOptions.hosts)}"
      callback("master node isn't in our hosts")

