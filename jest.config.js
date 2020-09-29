module.exports = {
    moduleFileExtensions: ['js', 'json'],
    rootDirs: [
        "<rootDir>/build"
    ],
    testMatch: [
        "**/?(*.)+(spec|test).+(js)"
    ],
    testEnvironment: 'node',
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
};