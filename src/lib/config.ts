import * as constants from './constants'
import protocolParser from './protocol'

export const protocol = protocolParser('../amqp-definitions-0-9-1')

export default { constants, protocol }
