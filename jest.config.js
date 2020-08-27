module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@microfleet/(amqp-.*)$': '<rootDir>/packages/$1/src'
  }
}