-- =============================================
-- TABLE: users (Joueurs)
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    elo_rating INT DEFAULT 1200, -- Rating ELO par défaut
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR(255) NULL,
    bio TEXT NULL
);

-- =============================================
-- TABLE: games (Parties)
-- =============================================
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL, -- Joueur blanc (par convention)
    player2_id INT NOT NULL, -- Joueur noir
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    status ENUM('en_cours', 'terminee', 'abandonnee', 'nulle') DEFAULT 'en_cours',
    winner_id INT NULL, -- NULL si match nul ou en cours
    time_control VARCHAR(20) NOT NULL, -- Ex: "5+0" (5 min + 0 incrément)
    is_rated BOOLEAN DEFAULT TRUE, -- Partie notée pour le classement ELO
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    CHECK (player1_id != player2_id) -- Un joueur ne peut pas jouer contre lui-même
);

-- =============================================
-- TABLE: moves (Coups)
-- =============================================
CREATE TABLE moves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL, -- Joueur qui a joué le coup (blanc ou noir)
    move_number INT NOT NULL, -- Numéro du coup (1, 2, 3...)
    from_square VARCHAR(2) NOT NULL, -- Ex: "e2"
    to_square VARCHAR(2) NOT NULL,   -- Ex: "e4"
    piece VARCHAR(1) NOT NULL,      -- Ex: "P" (pion), "K" (roi), "Q" (dame)
    is_check BOOLEAN DEFAULT FALSE,
    is_checkmate BOOLEAN DEFAULT FALSE,
    is_castle BOOLEAN DEFAULT FALSE, -- Roque
    is_en_passant BOOLEAN DEFAULT FALSE,
    promotion_piece VARCHAR(1) NULL, -- Ex: "Q" si promotion en dame
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id),
    INDEX (game_id, move_number) -- Pour reconstruire rapidement une partie
);

-- =============================================
-- TABLE: game_states (États du plateau)
-- =============================================
CREATE TABLE game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    move_id INT NULL, -- NULL pour l'état initial
    fen_string VARCHAR(255) NOT NULL, -- Notation FEN (ex: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (move_id) REFERENCES moves(id) ON DELETE SET NULL,
    INDEX (game_id)
);

-- =============================================
-- TABLE: tournaments (Tournois)
-- =============================================
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    organizer_id INT NOT NULL,
    max_players INT DEFAULT 100,
    status ENUM('inscription', 'en_cours', 'termine', 'annule') DEFAULT 'inscription',
    prize_pool DECIMAL(10, 2) NULL, -- Montant du prix (si applicable)
    time_control VARCHAR(20) NOT NULL, -- Ex: "15+10"
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- =============================================
-- TABLE: tournament_players (Joueurs inscrits à un tournoi)
-- =============================================
CREATE TABLE tournament_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NOT NULL,
    score DECIMAL(5, 2) DEFAULT 0.00, -- Points accumulés
    rank INT NULL, -- Classement final (NULL si tournoi en cours)
    status ENUM('inscrit', 'qualifie', 'elimine', 'gagnant') DEFAULT 'inscrit',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (tournament_id, user_id) -- Un joueur ne peut s'inscrire qu'une fois par tournoi
);

-- =============================================
-- TABLE: tournament_games (Parties d'un tournoi)
-- =============================================
CREATE TABLE tournament_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    game_id INT NOT NULL,
    round_number INT NOT NULL, -- Numéro du tour (1, 2, 3...)
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE (tournament_id, game_id) -- Une partie ne peut appartenir qu'à un seul tournoi
);

-- =============================================
-- TABLE: friends (Amis)
-- =============================================
CREATE TABLE friends (
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (user1_id < user2_id) -- Évite les doublons (ex: (1,2) et (2,1))
);

-- =============================================
-- TABLE: chat_messages (Messages entre joueurs)
-- =============================================
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- =============================================
-- TABLE: notifications (Notifications)
-- =============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Destinataire
    type ENUM('invitation', 'fin_partie', 'message', 'tournament_start', 'challenge') NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_id INT NULL, -- ID de l'élément lié (ex: game_id, tournament_id)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: user_stats (Statistiques des joueurs)
-- =============================================
CREATE TABLE user_stats (
    user_id INT PRIMARY KEY,
    total_games INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    elo_history JSON NULL, -- Historique des ratings ELO (ex: [{"date": "2026-05-01", "elo": 1200}, ...])
    favorite_opening VARCHAR(50) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);