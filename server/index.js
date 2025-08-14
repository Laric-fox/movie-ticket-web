const express = require('express')
const upload = require("./middleware/multer");
const cloudinary = require("./utils/cloudinary");
const cors = require('cors');
const fs = require('fs');

const app = express()
const port = 3000
app.use(cors())

// Middleware để phân tích các request có body dạng JSON
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Nhận cả ảnh & video (field name 'image' hoặc 'video')
app.post('/upload', upload.any(), async (req, res) => {
  try {
    const file = req.files?.[0];
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const resource_type = file.mimetype.startsWith('video') ? 'video' : 'image';

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type,
      folder: 'movies'
    });

    // dọn file tạm
    fs.unlink(file.path, () => {});
    return res.json({ success: true, message: 'Uploaded!', data: result });
  } catch (err) {
    // dọn file tạm nếu còn
    if (req.files?.[0]?.path) fs.unlink(req.files[0].path, () => {});
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})