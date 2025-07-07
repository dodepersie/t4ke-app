const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Mengambil data dari URL video TikTok dengan format tanggal yang disesuaikan.
 * @param {string} url - URL lengkap dari video TikTok.
 * @returns {Promise<object>} Objek yang berisi data video atau pesan error.
 */
async function scrapeTikTokVideo(url) {
  if (!url || !url.includes("tiktok.com")) {
    return {
      status: "error",
      message: "URL tidak valid. Harap masukkan URL video TikTok yang benar.",
    };
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
      return {
        status: "error",
        message:
          "Gagal menemukan data JSON. Struktur halaman TikTok kemungkinan telah berubah.",
      };
    }

    const jsonData = JSON.parse(scriptTag.html());

    const videoData =
      jsonData["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"][
        "itemStruct"
      ];

    if (
      !videoData ||
      !videoData.stats ||
      typeof videoData.createTime === "undefined"
    ) {
      return {
        status: "error",
        message: "Data video tidak lengkap atau tidak ditemukan di dalam JSON.",
        details: "Kemungkinan ID video salah atau struktur data telah berubah.",
      };
    }

    const date = new Date(videoData.createTime * 1000);

    const dateOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    };

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    };

    const datePart = date.toLocaleDateString("id-ID", dateOptions);
    const timePart = date
      .toLocaleTimeString("id-ID", timeOptions)
      .replace(/\./g, ":");
    const formattedPublishDate = `${datePart} - ${timePart}`;

    const result = {
      status: "success",
      data: {
        caption: videoData.desc || "Tidak ada caption",
        publishTimestamp: videoData.createTime,
        publishDateFormatted: formattedPublishDate,
        commentCount: videoData.stats.commentCount || 0,
        likeCount: videoData.stats.diggCount || 0,
        saveCount: videoData.stats.collectCount || 0,
        viewCount: videoData.stats.playCount || 0,
      },
    };

    return result;
  } catch (error) {
    let errorMessage = "Terjadi kesalahan umum saat scraping.";
    if (error.response) {
      errorMessage = `Request gagal dengan status: ${error.response.status}`;
    }

    return {
      status: "error",
      message: errorMessage,
      details: error.message,
    };
  }
}

// --- Fungsi Utama untuk Menjalankan Scraper ---
async function main() {
  const videoUrl = process.argv[2];

  if (!videoUrl) {
    const errorResponse = {
      status: "error",
      message: "URL tidak diberikan.",
      usage: 'node scrape-json.js "<URL_VIDEO_TIKTOK>"',
    };
    console.log(JSON.stringify(errorResponse, null, 2));
    return;
  }

  const result = await scrapeTikTokVideo(videoUrl);
  console.log(JSON.stringify(result, null, 2));
}

main();
