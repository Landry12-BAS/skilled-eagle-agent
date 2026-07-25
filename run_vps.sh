#!/bin/bash
SSH_PASS="L2wo77Js'S+?MuNy"
SSH_IP="145.223.85.98"

/opt/homebrew/bin/sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no root@$SSH_IP << 'SSH_SCRIPT'
export DEBIAN_FRONTEND=noninteractive
apt update
apt install -y git docker.io docker-compose-v2

# Remove existing dir if any
rm -rf skilled-eagle-agent

# Clone the repo
git clone https://github.com/Landry12-BAS/skilled-eagle-agent.git
cd skilled-eagle-agent

# Create the .env.prod file
cat << 'EOF' > .env.prod
ALLOWED_HOSTS=api.skilledeagle.tech,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://skilled-eagle-agent.vercel.app,https://skilledeagle.tech
CSRF_TRUSTED_ORIGINS=https://skilled-eagle-agent.vercel.app,https://skilledeagle.tech
DATABASE_URL=postgresql://neondb_owner:npg_wLPyVYF9k0GS@ep-proud-dawn-at4coh5q-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
DEBUG=False
FRONTEND_URL=https://skilled-eagle-agent.vercel.app
GITHUB_OAUTH_ALLOWED_ORIGINS=https://skilled-eagle-agent.vercel.app,https://skilledeagle.tech
GITHUB_OAUTH_CLIENT_ID=Ov23linC5vD90IYXl1Eu
GITHUB_OAUTH_CLIENT_SECRET=b28d9e3ea669a80258033692eda5c1895b5f4362
GITHUB_OAUTH_REDIRECT_URI=https://api.skilledeagle.tech/api/agent/github/oauth/callback/
SECRET_KEY=12n5b@&303q9#uzhc%njy7--*_x_86$9d-h_xa785%ew^7lek-
EOF

# Run the deploy script
chmod +x deploy.sh
./deploy.sh
SSH_SCRIPT
