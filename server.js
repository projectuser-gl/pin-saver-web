if (typeof File === 'undefined') {
    global.File = class File extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = options.lastModified || Date.now();
        }
    };
}

const express = require('express');
const https = require('https');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Statik dosyalar için

// Video Linki Bulucu
app.post('/extract', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL gerekli' });

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
    };

    https.get(url, options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            const mp4Match = data.match(/"(https:\/\/v1\.pinimg\.com\/videos\/mc\/hls\/.*?\.mp4)"/);
            const genericMatch = data.match(/"(https:\/\/[^"]+?\.mp4)"/);
            
            let videoUrl = null;
            if (mp4Match) videoUrl = mp4Match[1].replace(/\\u002f/g, '/');
            else if (genericMatch) videoUrl = genericMatch[1].replace(/\\u002f/g, '/');

            if (videoUrl) res.json({ videoUrl });
            else res.status(404).json({ error: 'Video bulunamadı.' });
        });
    }).on("error", () => res.status(500).json({ error: 'Hata oluştu.' }));
});

// İndirme Köprüsü
app.get('/download-file', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('URL eksik');

    https.get(videoUrl, (externalRes) => {
        res.setHeader('Content-Disposition', 'attachment; filename="Pinterest_Video.mp4"');
        res.setHeader('Content-Type', 'video/mp4');
        externalRes.pipe(res);
    });
});

app.listen(3000, () => console.log(`🚀 PinSave Pro 3000 portunda yayında!`));