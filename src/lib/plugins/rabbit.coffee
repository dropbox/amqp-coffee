debug               = require('../config').debug('amqp:plugins:rabbit')
request = require('request')

module.exports =
  masterNode : (connection, queue, callback)->
    if !connection.connectionOptions.hosts? then return callback()

    host  = connection.connectionOptions.hosts[0]
    vhost = encodeURIComponent connection.connectionOptions.vhost

    request.get "http://#{host}:15672/api/queues/#{vhost}/#{queue}", {
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

      if !response.node? then return callback("no response node") # if we have no node information we doesn't really know what to do here

      masternode = response.node.split('@')[1]
      masternode = masternode.split('.')[0].toLowerCase()

      # connection.connectionOptions.hosts is set as toLowerCase in Connection
      if masternode in connection.connectionOptions.hosts
        # the master node is in our connection's hosts
        if connection.connectionOptions.host is masternode
          callback(null, true)
        else
          connection.connectionOptions.host = masternode
          callback(null, true)

      else
        debug 1, ()-> return ["we can not connection to the master node, its not in our valid hosts", masternode, connection.connectionOptions.hosts]
        callback("master node isn't in our hosts")

