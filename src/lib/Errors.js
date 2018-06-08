/**
 * This file contains custom error implementation to fix string based errors
 */
const util = require('util');

function BasicReturnError(err) {
  this.code = 'ERR_AMQP_BASIC_RETURN';
  this.name = 'AMQP_BasicReturnError';

  // assign properties
  this.replyCode = err.replyCode;
  this.exchange= err.exchange;
  this.routingKey = err.routingKey;

  // preserve back-compatibility
  this.replyText = err.replyText;
  this.message = err.replyText;

  // and capture stack trace to make it useful
  Error.captureStackTrace(this, BasicReturnError);
}
util.inherits(BasicReturnError, Error);

exports.BasicReturnError = BasicReturnError;
