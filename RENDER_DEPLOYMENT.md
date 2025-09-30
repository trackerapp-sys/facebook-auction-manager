# Render Deployment Guide

This guide explains how to deploy the Facebook Auction Management System to Render.

## Quick Fix for Current Deployment Issue

The error you're seeing:
```
Service Root Directory "/opt/render/project/src/server" is missing.
builder.sh: line 51: cd: /opt/render/project/src/server: No such file or directory
```

This happens because Render is looking for the server in the wrong path. Here's how to fix it:

## Option 1: Use render.yaml (Recommended)

The `render.yaml` file in the root directory contains the correct configuration:

1. **Server Service**: Uses `rootDir: server` to set the correct path
2. **Client Service**: Uses `rootDir: client` to set the correct path

## Option 2: Manual Render Dashboard Configuration

If you prefer to configure manually in the Render dashboard:

### Server Configuration:
- **Service Type**: Web Service
- **Environment**: Node
- **Root Directory**: `server`
- **Build Command**: `npm ci --only=production`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### Client Configuration:
- **Service Type**: Static Site
- **Root Directory**: `client`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `build`

## Environment Variables

### Server Environment Variables:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-a-secure-secret>
FACEBOOK_APP_ID=<your-facebook-app-id>
FACEBOOK_APP_SECRET=<your-facebook-app-secret>
FACEBOOK_ACCESS_TOKEN=<your-facebook-access-token>
FACEBOOK_WEBHOOK_VERIFY_TOKEN=<your-webhook-verify-token>
CLIENT_URL=<your-client-url-on-render>
```

### Client Environment Variables:
```
REACT_APP_API_URL=<your-server-url-on-render>/api
REACT_APP_SERVER_URL=<your-server-url-on-render>
REACT_APP_FACEBOOK_APP_ID=<your-facebook-app-id>
REACT_APP_ENV=production
```

## Project Structure

The correct project structure is:
```
auction-management/
├── server/           # Backend Node.js application
│   ├── src/         # Server source code
│   ├── package.json
│   └── ...
├── client/          # Frontend React application
│   ├── src/         # Client source code
│   ├── package.json
│   └── ...
├── render.yaml      # Render configuration
└── package.json     # Root package.json
```

## Deployment Steps

1. **Push your code** to GitHub with the updated `render.yaml`
2. **Connect your repository** to Render
3. **Use the render.yaml** configuration (Render should auto-detect it)
4. **Set environment variables** in the Render dashboard
5. **Deploy** both services

## Troubleshooting

If you still see path issues:
1. Check that `render.yaml` is in the root directory
2. Verify the `rootDir` settings in `render.yaml`
3. Make sure your repository structure matches the expected layout
4. Clear any cached builds in Render and redeploy

## Database Setup

The `render.yaml` includes a PostgreSQL database configuration. If you prefer MongoDB:
1. Use MongoDB Atlas or another external MongoDB service
2. Update the `MONGODB_URI` environment variable
3. Remove the database section from `render.yaml`
