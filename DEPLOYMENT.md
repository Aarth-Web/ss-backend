# Deployment Guide

This guide provides instructions for deploying the School System Backend to various environments.

## Prerequisites

- Node.js v18 or higher
- Access to a MongoDB database
- Twilio account for SMS notifications
- RapidAPI account for translation services (optional)

## Preparing for Deployment

1. **Set up environment variables**

   Copy `.env.example` to `.env.production` and fill in all required values:

   ```bash
   cp .env.example .env.production
   ```

   Edit `.env.production` and set all the required environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT token generation
   - `JWT_EXPIRES_IN` - Token expiration time (e.g., "24h")
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - Twilio credentials
   - `RAPIDAPI_KEY`, `RAPIDAPI_HOST` - RapidAPI credentials for translation
   - `SUPERADMIN_SECRET` - Secret token for superadmin operations

2. **Check that all required environment variables are set**

   ```bash
   npm run check:env
   ```

3. **Build the application**

   ```bash
   npm run build
   ```

## Deployment Options

### Option 1: Deploy to a Node.js hosting service (like Heroku, Render, etc.)

1. Set up the environment variables in your hosting platform's dashboard
2. Deploy the application using Git or your platform's deployment method
3. Make sure to specify the start command as `npm run start:prod`

### Option 2: Deploy with Docker

1. Build the Docker image:

   ```bash
   docker build -t ss-backend .
   ```

2. Run the container with environment variables:

   ```bash
   docker run -p 3000:3000 --env-file .env.production ss-backend
   ```

### Option 3: Deploy to a VPS (Virtual Private Server)

1. SSH into your server
2. Clone the repository
3. Install dependencies: `npm install --production`
4. Set up environment variables on the server
5. Start the application with PM2:

   ```bash
   npm install -g pm2
   pm2 start npm --name "ss-backend" -- run start:prod
   pm2 startup
   pm2 save
   ```

## Post-Deployment Checks

After deploying, verify that:

1. The application is running correctly
2. Database connections are working
3. Authentication is working
4. SMS notifications are being sent correctly

## Troubleshooting

If you encounter issues after deployment:

1. Check the server logs
2. Verify that all environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check that the Twilio credentials are valid
