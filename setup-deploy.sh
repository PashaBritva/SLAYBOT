#!/bin/bash
# setup-deploy.sh — Настройка сервера для деплоя SLAYBOT
# Запусти от root: bash setup-deploy.sh

set -e

echo "🚀 Настраиваю сервер для деплоя SLAYBOT..."

# 1. Создаю пользователя deploy
echo "📦 Создаю пользователя deploy..."
if id "deploy" &>/dev/null; then
    echo "Пользователь deploy уже существует"
else
    useradd -m -s /bin/bash deploy
    echo "✅ Пользователь deploy создан"
fi

# 2. Устанавливаю Node.js 22
echo "📦 Устанавливаю Node.js 22..."
if command -v node &>/dev/null && node -v | grep -q "v22"; then
    echo "Node.js 22 уже установлен: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js установлен: $(node -v)"
fi

# 3. Устанавливаю PM2
echo "📦 Устанавливаю PM2..."
if command -v pm2 &>/dev/null; then
    echo "PM2 уже установлен: $(pm2 -v)"
else
    npm install -g pm2
    echo "✅ PM2 установлен"
fi

# 4. Устанавливаю Git
echo "📦 Проверяю Git..."
if command -v git &>/dev/null; then
    echo "Git уже установлен"
else
    apt-get install -y git
    echo "✅ Git установлен"
fi

# 5. Создаю папку деплоя
echo "📦 Создаю папку деплоя..."
DEPLOY_DIR="/opt/slaybot"
mkdir -p $DEPLOY_DIR
chown -R deploy:deploy $DEPLOY_DIR
echo "✅ Папка $DEPLOY_DIR создана"

# 6. Генерирую SSH ключ для deploy
echo "📦 Генерирую SSH ключ..."
if [ ! -f /home/deploy/.ssh/id_ed25519 ]; then
    mkdir -p /home/deploy/.ssh
    ssh-keygen -t ed25519 -f /home/deploy/.ssh/id_ed25519 -N "" -C "deploy@slaybot"
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/id_ed25519
    echo "✅ SSH ключ сгенерирован"
    echo ""
    echo "📋 Добавь этот PUBLIC KEY в GitHub Secrets (SSH_PRIVATE_KEY):"
    echo "────────────────────────────────────────────────────────"
    cat /home/deploy/.ssh/id_ed25519
    echo "────────────────────────────────────────────────────────"
else
    echo "SSH ключ уже существует"
fi

# 7. Настраиваю PM2 startup
echo "📦 Настраиваю PM2 startup..."
pm2 startup systemd -u deploy --hp /home/deploy 2>/dev/null || true
echo "✅ PM2 startup настроен"

# 8. Права
echo "📦 Выставляю права..."
chown -R deploy:deploy $DEPLOY_DIR
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ СЕРВЕР НАСТРОЕН!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Скопируй SSH ключ выше и добавь в GitHub:"
echo "   Settings → Secrets → SSH_PRIVATE_KEY"
echo ""
echo "2. Добавь остальные секреты в GitHub:"
echo "   BOT_TOKEN          = токен бота"
echo "   MONGO_CONNECTION   = строка MongoDB"
echo "   SERVER_HOST        = 192.168.0.1"
echo "   SERVER_USER        = deploy"
echo "   DEPLOY_PATH        = /opt/slaybot"
echo ""
echo "3. После деплоя на сервере выполни:"
echo "   cd /opt/slaybot"
echo "   cp .env.example .env"
echo "   nano .env  # заполни BOT_TOKEN и MONGO_CONNECTION"
echo "   npm ci --production"
echo "   pm2 start bot.js --name slaybot"
echo "   pm2 save"
echo ""
echo "═══════════════════════════════════════════════════════"
