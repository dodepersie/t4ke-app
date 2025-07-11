const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.post("/", async (req, res) => {
  const { url } = req.body;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  };

  if (!url || !url.includes("tiktok.com")) {
    return res.status(400).json({
      status: "error",
      message: "Not a valid TikTok URL!",
    });
  }

  try {
    const { data } = await axios.get(url, {
      headers: headers,
    });

    const $ = cheerio.load(data);
    const scriptTag = $("script#__UNIVERSAL_DATA_FOR_REHYDRATION__");

    if (scriptTag.length === 0) {
      return res.status(500).json({
        status: "error",
        message: "Maybe TikTok page structure already change.",
      });
    }

    const jsonData = JSON.parse(scriptTag.html());
    const videoData =
      jsonData["__DEFAULT_SCOPE__"]["webapp.video-detail"]["itemInfo"][
        "itemStruct"
      ];

    if (!videoData || !videoData.stats || !videoData.author) {
      return res.status(404).json({
        status: "error",
        message: "Video data not found in JSON.",
      });
    }

    const date = new Date(videoData.createTime * 1000);
    const datePart = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
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
        caption: videoData.desc || "No caption",
        publishDate: `${datePart} - ${timePart}`,
        commentCount: videoData.stats.commentCount || 0,
        likeCount: videoData.stats.diggCount || 0,
        saveCount: videoData.stats.collectCount || 0,
        playCount: videoData.stats.playCount || 0,
        originCover: videoData.video.originCover,
      },
      video: {
        id: videoData.video.id,
        height: videoData.video.height,
        width: videoData.video.width,
        duration: videoData.video.duration,
        url: videoData.video.playAddr || "",
        url_nowm: videoData.video.downloadAddr || "",
      },
      author: {
        uniqueId: videoData.author?.uniqueId,
        nickname: videoData.author?.nickname,
        avatar: videoData.author?.avatarLarger,
        bio: videoData.author?.signature,
        followerCount: videoData.authorStats?.followerCount || 0,
        followingCount: videoData.authorStats?.followingCount || 0,
        heart: videoData.authorStats?.heartCount || 0,
        videoCount: videoData.authorStats?.videoCount || 0,
        friendCount: videoData.authorStats?.friendCount || 0,
        locationCreated: videoData.locationCreated,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error.",
      details: error.message,
    });
  }
});

module.exports = router;
