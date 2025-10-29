module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/cases/**/*'],
    transform: {
        '^.+\\.mjs$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],

}