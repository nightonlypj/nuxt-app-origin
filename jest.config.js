module.exports = {
  testMatch: [
    '<rootDir>/test/**/*.(spec|test).(js|ts)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js'
  },
  moduleFileExtensions: [
    'ts',
    'js',
    'vue',
    'json'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest',
    'vee-validate/dist/rules': 'babel-jest'
  },
  transformIgnorePatterns: [
    '<roodDir>/node_modules/(?!vee-validate/dist/rules)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/components/**/*.vue',
    '<rootDir>/pages/**/*.vue',
    '<rootDir>/layouts/**/*.vue',
    '<rootDir>/plugins/{application,utils}.js'
  ],
  setupFiles: ['./test/setup.js'],
  setupFilesAfterEnv: ['./jest.setup.js']
}
