const cloudinary = require("cloudinary").v2;

// Configuration
    cloudinary.config({ 
        cloud_name: 'dtgxheysk', 
        api_key: '569677845967375', 
        api_secret: 'pnVBi6FsA_BJW1-cSoMIMto9plo' // Click 'View API Keys' above to copy your API secret
    });

module.exports = cloudinary;