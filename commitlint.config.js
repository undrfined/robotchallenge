module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-case': [2, 'always', 'kebab-case'],
        'scope-enum': [
            2,
            'always',
            [
                'frontend',
                'backend',
                'libs',
                'csharp',
                'rust',
                'core',
                'nginx'
            ]
        ]
    }
};
