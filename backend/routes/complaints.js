const express = require('express');
const Complaint = require('../models/Complaints');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const analyzeImage = require('../utils/analyzeImage'); // AI check function

const router = express.Router();

// ======================
// Create complaint with image upload + AI check
// ======================
router.post(
  '/',
  protect,
  authorize('user'),
  upload.array('images', 5),
  async (req, res) => {
    try {
      console.log('📨 Creating complaint with data:', req.body);
      console.log('🖼️ Files received:', req.files ? req.files.length : 0);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Image required" });
      }

      // 🔥 AI check for each image
      for (const file of req.files) {
        const imgPath = file.path;
        const aiResponse = await analyzeImage(imgPath);

        try {
          const output = aiResponse.status[0].response.output[0];
          const aiScore = output.ai_generated?.score || 0;
          const similarity = output.image_similarity?.score || 0;

          console.log("AI SCORE:", aiScore, "SIMILARITY:", similarity);

          if (aiScore > 0.75) {
            fs.unlinkSync(imgPath);
            return res.status(400).json({
              success: false,
              message: "This image appears to be AI-generated. Please upload a real photo."
            });
          }

          if (similarity > 0.7) {
            fs.unlinkSync(imgPath);
            return res.status(400).json({
              success: false,
              message: "This image seems taken from the internet. Please upload an original image."
            });
          }
        } catch (err) {
          console.log("Hive error:", err);
        }
      }

      // Save complaint if all images safe
      const imagePaths = req.files.map(file => file.filename);

      const complaint = await Complaint.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: imagePaths,
        user: req.user._id,
      });

      const populatedComplaint = await Complaint.findById(complaint._id).populate('user', 'name email');
      res.status(201).json(populatedComplaint);

    } catch (error) {
      console.error('Error creating complaint:', error);

      // Cleanup uploaded files on error
      if (req.files) req.files.forEach(file => fs.unlinkSync(file.path));
      res.status(400).json({ message: error.message });
    }
  }
);

// ======================
// Update complaint with images (User only - own complaints)
// ======================
router.put('/:id', protect, authorize('user'), upload.array('images', 5), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    let imagePaths = [...complaint.images];

    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => file.filename);
      imagePaths = [...imagePaths, ...newImagePaths];
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        images: imagePaths
      },
      { new: true }
    ).populate('user', 'name email');

    res.json(updatedComplaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    if (req.files) req.files.forEach(file => fs.unlinkSync(file.path));
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Delete image from complaint (User only)
// ======================
router.delete('/:id/images/:imageName', protect, authorize('user'), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.images = complaint.images.filter(img => img !== req.params.imageName);
    await complaint.save();

    const imagePath = path.join(__dirname, '../public/uploads', req.params.imageName);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    res.json({
      message: 'Image deleted successfully',
      complaint: await Complaint.findById(complaint._id).populate('user', 'name email')
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Update complaint priority (Authority only)
// ======================
router.put('/:id/priority', protect, authorize('authority'), async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { priority: req.body.priority },
      { new: true }
    ).populate('user', 'name email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Get user's complaints
// ======================
router.get('/my-complaints', protect, authorize('user'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Get all complaints (Authority only)
// ======================
router.get('/', protect, authorize('authority'), async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Update complaint status (Authority only)
// ======================
router.put('/:id/status', protect, authorize('authority'), async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        assignedTo: req.user._id
      },
      { new: true }
    ).populate('user', 'name email');

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ======================
// Delete complaint (User only)
// ======================
router.delete('/:id', protect, authorize('user'), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Delete all associated images
    if (complaint.images && complaint.images.length > 0) {
      complaint.images.forEach(imageName => {
        const imagePath = path.join(__dirname, '../public/uploads', imageName);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
