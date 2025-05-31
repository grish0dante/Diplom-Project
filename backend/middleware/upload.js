const multer = require('multer');
const path = require('path');

// Налаштування зберігання для зображень
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Налаштування зберігання для 3D моделей
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/models/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'model-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Фільтр для зображень
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Тільки зображення дозволені!'), false);
  }
};

// Фільтр для 3D моделей
const modelFilter = (req, file, cb) => {
  const allowedExtensions = ['.glb', '.gltf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Тільки .glb та .gltf файли дозволені!'), false);
  }
};

// Обробники завантаження
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadModel = multer({
  storage: modelStorage,
  fileFilter: modelFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Middleware для обробки помилок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Файл занадто великий' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadImage,
  uploadModel,
  handleMulterError
}; 