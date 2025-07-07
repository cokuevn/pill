#!/bin/bash

# Install dependencies
yarn install

# Build the React app
yarn build

# Install serve globally to serve the built app
yarn global add serve

# Start serving the built app
serve -s build -l $PORT