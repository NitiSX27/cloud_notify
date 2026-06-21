module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'notification-worker',
      script: 'npm',
      args: 'run start:worker',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
