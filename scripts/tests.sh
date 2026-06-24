#!/usr/bin/env bash
set -euo pipefail

# Récupère le conteneur qui tourne et qui contient "backend" dans son nom
CONTAINER_ID=$(docker ps --filter "name=backend" --filter "status=running" -q | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Erreur : Le conteneur contenant 'backend' n'est pas en cours d'exécution."
    echo "Vérifie avec 'make ps' ou 'docker ps'."
    exit 1
fi

echo "🚀 Conteneur trouvé ($CONTAINER_ID). Lancement du test WebSocket..."

# On exécute NODE directement via docker exec dans le conteneur trouvé
docker exec -i "$CONTAINER_ID" node <<'NODE'
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');

const readSecret = (value) => {
    if (!value) {
        return undefined;
    }

    if (fs.existsSync(value)) {
        return fs.readFileSync(value, 'utf8').trim();
    }

    return value.trim();
};

const dbUser = readSecret(process.env.DB_USER) ?? readSecret(process.env.DB_USER_FILE);
const dbName = readSecret(process.env.DB_NAME) ?? readSecret(process.env.DB_NAME_FILE);
const dbPassword = readSecret(process.env.DB_PASSWORD) ?? readSecret(process.env.DB_PASSWORD_FILE);

if (!process.env.DATABASE_URL) {
    if (!dbUser || !dbName || !dbPassword) {
        throw new Error('Impossible de construire DATABASE_URL pour le test WebSocket.');
    }

    process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@db:5432/${dbName}?schema=public`;
}

const prisma = new PrismaClient();
const baseUrl = 'http://127.0.0.1:3000';
const websocketUrl = 'ws://127.0.0.1:3000/ws';
const timeoutMs = 10000;

const loginUsers = [
    { email: process.env.WS_TEST_USER_1 || 'carla@example.com', password: process.env.WS_TEST_PASSWORD || 'password123' },
    { email: process.env.WS_TEST_USER_2 || 'david@example.com', password: process.env.WS_TEST_PASSWORD || 'password123' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (predicate, label) => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (await predicate()) {
            return;
        }

        await delay(100);
    }

    throw new Error(`Timeout en attente de ${label}`);
};

const login = async (email, password) => {
    const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(`Echec de connexion pour ${email}: ${response.status}`);
    }

    return response.json();
};

const createClient = (token) => {
    const socket = new WebSocket(`${websocketUrl}?token=${encodeURIComponent(token)}`);
    const messages = [];

    const opened = new Promise((resolve, reject) => {
        socket.once('open', resolve);
        socket.once('error', reject);
    });

    socket.on('message', (data) => {
        try {
            messages.push(JSON.parse(data.toString()));
        } catch {
            messages.push({ type: 'raw', data: data.toString() });
        }
    });

    return { socket, messages, opened };
};

const cleanupGame = async (player1Id, player2Id) => {
    const games = await prisma.game.findMany({
        where: { player1Id, player2Id },
        select: { id: true },
    });

    for (const game of games) {
        await prisma.move.deleteMany({ where: { gameId: game.id } });
        await prisma.game.delete({ where: { id: game.id } });
    }
};

(async () => {
    const clients = [];

    try {
        const [firstUser, secondUser] = await Promise.all(
            loginUsers.map(({ email, password }) => login(email, password))
        );

        const firstClient = createClient(firstUser.token);
        const secondClient = createClient(secondUser.token);
        clients.push(firstClient, secondClient);

        await Promise.all([firstClient.opened, secondClient.opened]);

        await waitFor(
            () => firstClient.messages.some((message) => message.type === 'waiting'),
            'le message waiting du premier client'
        );

        await waitFor(
            () => firstClient.messages.some((message) => message.type === 'start') && secondClient.messages.some((message) => message.type === 'start'),
            'les messages start des deux clients'
        );

        await cleanupGame(firstUser.user.id, secondUser.user.id);

        console.log(`✅ WebSocket OK: ${firstUser.user.username} et ${secondUser.user.username}`);
    } catch (error) {
        console.error('❌ WebSocket test failed:', error);
        process.exitCode = 1;
    } finally {
        for (const client of clients) {
            client.socket.close();
        }

        await prisma.$disconnect();
    }
})();
NODE