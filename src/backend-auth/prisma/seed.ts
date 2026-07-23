import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';


// 1. RÉCUPÉRATION DE LA CONNEXION (DEPUIS HASHI VAULT / ENTRYPOINT)

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Impossible de lancer le seed : variable DATABASE_URL manquante (vérifier l\'initialisation Vault).');
}


// 2. INITIALISATION PRISMA 7 (DRIVERS NATIVE)

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// 3. JEU DE DONNÉES

const users = [
  {
    email: 'alice@example.com',
    username: 'alice',
    password: 'password123',
    eloRating: 780,
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=alice',
    bio: 'Joue les ouvertures agressives et les blitz du soir.',
    isAdmin: true, // Passer en Admin
  },
  {
    email: 'bob@example.com',
    username: 'bob',
    password: 'password123',
    eloRating: 845,
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=bob',
    bio: 'Privilégie les finales propres et les parties longues.',
    isAdmin: true, // Passer en Admin
  },
  {
    email: 'carla@example.com',
    username: 'carla',
    password: 'password123',
    eloRating: 910,
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=carla',
    bio: 'Toujours prête pour une revanche.',
    isAdmin: false,
  },
  {
    email: 'david@example.com',
    username: 'david',
    password: 'password123',
    eloRating: 690,
    avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=david',
    bio: 'Apprend en jouant et adore les parties rapides.',
    isAdmin: false,
  },
];


// 4. LOGIQUE PRINCIPALE DU SEED

async function main() {
  console.log("🌱 Début du seeding avec support HashiCorp Vault...");

  // Nettoyage de la base de données (Ordre des clés étrangères respecté)
  await prisma.$transaction([
    prisma.move.deleteMany(),
    prisma.game.deleteMany(),
    prisma.friend.deleteMany(),
    prisma.waitlistEntry.deleteMany(),
    prisma.userStats.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const createdUsers = [] as Array<{ id: number; username: string }>;

  // Création des utilisateurs et de leurs statistiques
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email: user.email,
        username: user.username,
        hashedPassword,
        eloRating: user.eloRating,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isAdmin: user.isAdmin, // Injecté ici
      },
    });

    createdUsers.push({ id: createdUser.id, username: createdUser.username });

    await prisma.userStats.create({
      data: {
        userId: createdUser.id,
        totalGames: 12 + createdUser.id,
        wins: 5 + (createdUser.id % 3),
        losses: 3 + (createdUser.id % 2),
        draws: 2,
        favoriteOpening: createdUser.username === 'alice' ? 'Sicilienne' : 'Italienne',
        eloHistory: [500, 620, 710, user.eloRating],
      },
    });
  }

  // Relations amis, file d'attente et parties de démonstration
  const alice = createdUsers.find((user) => user.username === 'alice');
  const bob = createdUsers.find((user) => user.username === 'bob');
  const carla = createdUsers.find((user) => user.username === 'carla');

  if (alice && bob && carla) {
    await prisma.friend.create({
      data: {
        user1Id: alice.id,
        user2Id: bob.id,
      },
    });

    await prisma.friend.create({
      data: {
        user1Id: alice.id,
        user2Id: carla.id,
      },
    });

    await prisma.waitlistEntry.create({
      data: {
        userId: carla.id,
      },
    });

    const game = await prisma.game.create({
      data: {
        player1Id: alice.id,
        player2Id: bob.id,
        status: 'terminee',
        isRated: true,
        fenString: 'r1bqkbnr/pppp1ppp/2n5/4p3/1b1P4/2P2N2/PP2PPPP/RNBQKB1R w KQkq - 2 4',
        winnerId: alice.id,
        endTime: new Date(),
      },
    });

    await prisma.move.createMany({
      data: [
        {
          gameId: game.id,
          playerId: alice.id,
          moveNumber: 1,
          fromSquare: 'e2',
          toSquare: 'e4',
          piece: 'P',
        },
        {
          gameId: game.id,
          playerId: bob.id,
          moveNumber: 2,
          fromSquare: 'e7',
          toSquare: 'e5',
          piece: 'P',
        },
        {
          gameId: game.id,
          playerId: alice.id,
          moveNumber: 3,
          fromSquare: 'd2',
          toSquare: 'd4',
          piece: 'P',
        },
      ],
    });
  }

  console.log(`✅ Seed completed successfully with ${users.length} users.`);
}


// 5. EXÉCUTION ET NETTOYAGE DES POOLS

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); 
  });