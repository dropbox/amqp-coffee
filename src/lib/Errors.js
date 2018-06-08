/**
 * This file contains custom error implementation to fix string based errors
 */

function BasicReturnError(err) {
  this.code = 'ERR_AMQP_BASIC_RETURN';

  // assign properties
  this.message = err.replyText;
  this.replyCode = err.replyCode;
  this.exchange= err.exchange;
  this.routingKey = err.routingKey;

  // preserve back-compatibility
  this.replyText = err.replyText;

  // NOTE: we may want to capture stack trace later, so far don't do it
  // Error.captureStackTrace(this, BasicReturnError);
}

exports.BasicReturnError = BasicReturnError;
