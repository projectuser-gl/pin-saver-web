const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Ana sayfa hatası (Cannot GET /) almamak için:
app.get('/', (req, res) => {
    res.send('PinSave Pro API Sunucusu Çalışıyor!');
});

// Video Linki Bulucu
app.post('/extract', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL gerekli' });

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
    };

    https.get(url, options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
            // Pinterest'in sayfa yapısına göre regex
            const mp4Match = data.match(/"(https:\/\/v1\.pinimg\.com\/videos\/mc\/hls\/.*?\.mp4)"/);
            const genericMatch = data.match(/"(https:\/\/[^"]+?\.mp4)"/);
            
            let videoUrl = null;
            if (mp4Match) videoUrl = mp4Match[1].replace(/\\u002f/g, '/');
            else if (genericMatch) videoUrl = genericMatch[1].replace(/\\u002f/g, '/');

            if (videoUrl) res.json({ videoUrl });
            else res.status(404).json({ error: 'Video bulunamadı.' });
        });
    }).on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: 'Hata oluştu.' });
    });
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

// BURAYI GÜNCELLEDİM: Render için port ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API ${PORT} portunda yayında!`));