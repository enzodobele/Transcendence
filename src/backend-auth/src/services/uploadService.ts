import multer from "multer";
import path from "path";
import fs from "fs";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.userId ?? "unknown";
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(
        new Error(
          "Type de fichier non autorisé (png, jpg, webp, gif uniquement).",
        ),
      );
    }
    cb(null, true);
  },
});
