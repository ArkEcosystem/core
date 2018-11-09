echo "Running pre-commit script..."
node .circleci/generateConfig.js && git add .circleci/config.yml
