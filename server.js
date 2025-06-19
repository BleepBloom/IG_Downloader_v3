const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.send('No URL provided.');

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const videoUrl = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (let script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data.video && data.video.contentUrl) return data.video.contentUrl;
        } catch {}
      }
      return null;
    });

    await browser.close();

    if (videoUrl) {
      res.send(`<h3>✅ Direct Download Link:</h3><a href="${videoUrl}" target="_blank">Download Video</a><br><br><a href="/">Back</a>`);
    } else {
      res.send('❌ Could not extract video. Double-check the Reel URL or privacy settings.');
    }
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
