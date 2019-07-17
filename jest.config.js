module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: process.env.CI === 'true',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'json'
  ],
  moduleNameMapper: {
    '^@microfleet/(amqp-.*)$': '<rootDir>/packages/$1/src'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.test.json',
      diagnostics: process.env.CI === 'true',
    }
  },
  testPathIgnorePatterns: [
    "/__tests__\\/helpers/",
  ]
};
