module.exports = {
    apps: [
        {
            name: 'starclip-api',
            script: 'dist/index.js',
            cwd: './server',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
