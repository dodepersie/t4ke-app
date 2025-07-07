const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes("tiktok.com")) {
    return res.status(400).json({
      status: "error",
      message:
        "URL tidak valid atau tidak diberikan. Gunakan query parameter ?url=",
    });
  }

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    };
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);
    const scriptTag = $("script#__UNIVERSAL_DATA_FOR_REHYDRATION__");

    if (scriptTag.length === 0) {
      return res.status(500).json({
        status: "error",
        message: "Struktur halaman TikTok kemungkinan telah berubah.",
      });
    }

    const jsonData = JSON.parse(scriptTag.html());
    const videoData =
      jsonData["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"][
        "itemStruct"
      ];

    if (!videoData || !videoData.stats) {
      return res.status(404).json({
        status: "error",
        message: "Data video tidak ditemukan dalam JSON.",
      });
    }

    const date = new Date(videoData.createTime * 1000);
    const datePart = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    const timePart = date
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      })
      .replace(/\./g, ":");

    const result = {
      status: "success",
      data: {
        caption: videoData.desc || "Tidak ada caption",
        publishDateFormatted: `${datePart} - ${timePart}`,
        commentCount: videoData.stats.commentCount || 0,
        likeCount: videoData.stats.diggCount || 0,
        saveCount: videoData.stats.collectCount || 0,
        viewCount: videoData.stats.playCount || 0,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal saat scraping.",
      details: error.message,
    });
  }
});

module.exports = router;
