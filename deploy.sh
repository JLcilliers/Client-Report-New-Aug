#!/bin/bash

# Manual Vercel Deployment Script
# This forces a deployment when GitHub integration isn't working

echo "🚀 Forcing Vercel deployment..."

# Option 1: If you have Vercel CLI installed locally
# Uncomment the line below:
# vercel --prod

# Option 2: Using git to trigger deployment
# Make a small change to force deployment
echo "# Deploy trigger: $(date)" >> README.md
git add README.md
git commit -m "Trigger Vercel deployment - $(date +%Y%m%d-%H%M%S)"
git push origin main

echo "✅ Deployment triggered. Check Vercel dashboard for build status."