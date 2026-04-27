#!/bin/bash

# Load configuration
if [ -f "deploy.config" ]; then
    source deploy.config
else
    echo "Error: deploy.config not found."
    echo "Please create deploy.config with DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PATH."
    exit 1
fi

echo "🚀 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

echo "🧹 Cleaning up remote assets..."
ssh ${DEPLOY_USER}@${DEPLOY_HOST} "rm -rf ~/${DEPLOY_PATH}assets"

echo "📤 Uploading files to ${DEPLOY_HOST}:${DEPLOY_PATH}..."
scp -r dist/. ${DEPLOY_USER}@${DEPLOY_HOST}:~/${DEPLOY_PATH}
scp -r server/. ${DEPLOY_USER}@${DEPLOY_HOST}:~/${DEPLOY_PATH}server

echo "🔄 Restarting server..."
ssh ${DEPLOY_USER}@${DEPLOY_HOST} "export PATH=\$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin; [ -f ~/.zshrc ] && source ~/.zshrc; [ -f ~/.bashrc ] && source ~/.bashrc; cd ~/${DEPLOY_PATH}server && (pm2 restart gj-server || pm2 start server.js --name gj-server || pkill -f server.js; nohup node server.js > output.log 2>&1 &)"

echo "✅ Deployment complete!"
