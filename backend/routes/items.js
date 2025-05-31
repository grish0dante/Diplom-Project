const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - description_big
 *         - category
 *         - modelUrl
 *         - image
 *         - user
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the 3D model
 *         description:
 *           type: string
 *           description: Short description of the model
 *         description_big:
 *           type: string
 *           description: Detailed description of the model
 *         category:
 *           type: string
 *           description: Category of the model
 *         isPublic:
 *           type: boolean
 *           description: Whether the model is public
 *         modelUrl:
 *           type: string
 *           description: URL to the model file
 *         image:
 *           type: string
 *           description: URL to the preview image
 *         user:
 *           type: string
 *           description: ID of the user who created the model
 */

// Налаштування директорії завантаження
const uploadsDir = path.join(__dirname, '../uploads');
const modelsDir = path.join(uploadsDir, 'models');
const imagesDir = path.join(uploadsDir, 'images');

// Створити директорію якщо її не існує
[uploadsDir, modelsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'model') {
      cb(null, modelsDir);
    } else if (file.fieldname === 'image') {
      cb(null, imagesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @swagger
 * /items/my-models:
 *   get:
 *     summary: Get user's models
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's models
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/my-models', auth, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Invalid user authentication' });
    }

    const userId = req.user.userId;
    const items = await Item.find({ user: userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching user models:', error);
    res.status(500).json({ message: 'Error fetching user models' });
  }
});

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Upload a new 3D model
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - description_big
 *               - category
 *               - model
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               description_big:
 *                 type: string
 *               category:
 *                 type: string
 *               isPublic:
 *                 type: string
 *               model:
 *                 type: string
 *                 format: binary
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Model created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Missing required fields or files
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, description_big, category, isPublic } = req.body;

    if (!title || !description || !description_big || !category) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (!req.files || !req.files.model || !req.files.image) {
      return res.status(400).json({ message: 'Both model and image files are required' });
    }

    const modelFile = req.files.model[0];
    const imageFile = req.files.image[0];

    const newItem = new Item({
      title,
      description,
      description_big,
      category,
      isPublic: isPublic === 'true',
      modelUrl: `/uploads/models/${modelFile.filename}`,
      image: `/uploads/images/${imageFile.filename}`,
      user: req.user.userId
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
});

router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ isPublic: true }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const items = await Item.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate('user', 'username');
    const result = items.map(item => {
      const obj = item.toObject();
      obj.user = obj.user?.username || 'Невідомий';
      return obj;
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching public items:', error);
    res.status(500).json({ message: 'Error fetching public items' });
  }
});

/**
 * @swagger
 * /models/{id}:
 *   get:
 *     summary: Get a specific model by ID
 *     tags: [Models]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Model'
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item' });
  }
});

/**
 * @swagger
 * /models/{id}/model:
 *   get:
 *     summary: Download model file
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.get('/:id/model', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Model not found' });
    }

   
    const modelUrl = item.modelUrl.startsWith('/uploads/models/') 
      ? item.modelUrl 
      : `/uploads/models/${item.modelUrl}`;

    const modelPath = path.join(__dirname, '..', modelUrl);
    
    // Перевірка чи існує файл
    if (!fs.existsSync(modelPath)) {
      console.error('Model file not found at path:', modelPath);
      return res.status(404).json({ message: 'Model file not found' });
    }

    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(modelPath)}"`);
    
    
    const fileStream = fs.createReadStream(modelPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming model file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming model file' });
      }
    });
  } catch (error) {
    console.error('Error sending model file:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error sending model file' });
    }
  }
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete a model
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model deleted successfully
 *       403:
 *         description: Not authorized to delete this model
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  console.log('Delete request received:', {
    id: req.params.id,
    userId: req.user.userId,
    headers: req.headers
  });

  try {
    const item = await Item.findById(req.params.id);
    console.log('Found item:', item);
    
    if (!item) {
      console.log('Item not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    // Перевірка чи користувач володіє предметом
    console.log('Comparing user IDs:', {
      itemUserId: item.user.toString(),
      requestUserId: req.user.userId
    });

    if (item.user.toString() !== req.user.userId) {
      console.log('User not authorized to delete this item');
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    
    const modelPath = path.join(__dirname, '..', item.modelUrl);
    const imagePath = path.join(__dirname, '..', item.image);

    console.log('Attempting to delete files:', {
      modelPath,
      imagePath
    });

    try {
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
        console.log('Model file deleted successfully');
      }
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image file deleted successfully');
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    // Видалити моделі з ДБ
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    console.log('Item deleted from database:', deletedItem);
    
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item' });
  }
});

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update a model
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               description_big:
 *                 type: string
 *               category:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Model updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       403:
 *         description: Not authorized to update this model
 *       404:
 *         description: Model not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, async (req, res) => {
  console.log('Update request received:', {
    id: req.params.id,
    userId: req.user.userId,
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.originalUrl
  });

  try {
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId:', req.params.id);
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    // Знайти предмет щоб перевірити власника
    const item = await Item.findById(req.params.id);
    console.log('Found item:', item ? {
      id: item._id,
      title: item.title,
      userId: item.user
    } : 'Not found');
    
    if (!item) {
      console.log('Item not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

   
    console.log('Comparing user IDs:', {
      itemUserId: item.user.toString(),
      requestUserId: req.user.userId
    });

    if (item.user.toString() !== req.user.userId) {
      console.log('User not authorized to update this item');
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    
    const allowedUpdates = ['title', 'description', 'description_big', 'category', 'isPublic'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    console.log('Updating item with:', updates);

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      console.log('Failed to update item');
      return res.status(500).json({ message: 'Failed to update item' });
    }

    console.log('Item updated successfully:', {
      id: updatedItem._id,
      title: updatedItem.title,
      userId: updatedItem.user
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating item' });
  }
});

module.exports = router;