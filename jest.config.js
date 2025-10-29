module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testMatch: ['**/__tests__/cases/**/*'],
    transform: {
        '^.+\\.mjs$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'json'],

}