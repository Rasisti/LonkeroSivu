const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

mongoose.connect("mongodb://localhost:27017/lonkerosivu", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const videoSchema = new mongoose.Schema({
    filename: String,
    userId: String,
    username: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments: [{ username: String, text: String }]
});

const Video = mongoose.model("Video", videoSchema);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("video"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Videotiedosto vaaditaan" });
    const { userId, username } = req.body;
    if (!userId) return res.status(400).json({ error: "Käyttäjätunnus vaaditaan" });

    const newVideo = new Video({
        filename: req.file.filename,
        userId,
        username: username || "Anonyymi",
    });
    await newVideo.save();
    res.json({ message: "Video tallennettu", filename: req.file.filename });
});

app.get("/videos", async (req, res) => {
    const videos = await Video.find();
    res.json(videos);
});

app.post("/like", async (req, res) => {
    const video = await Video.findById(req.body.videoId);
    if (!video) return res.status(404).json({ error: "Videota ei löydy" });
    video.likes++;
    await video.save();
    res.json({ likes: video.likes });
});

app.post("/dislike", async (req, res) => {
    const video = await Video.findById(req.body.videoId);
    if (!video) return res.status(404).json({ error: "Videota ei löydy" });
    video.dislikes++;
    await video.save();
    res.json({ dislikes: video.dislikes });
});

app.post("/comment", async (req, res) => {
    const video = await Video.findById(req.body.videoId);
    if (!video) return res.status(404).json({ error: "Videota ei löydy" });
    video.comments.push({ username: req.body.username || "Anonyymi", text: req.body.comment });
    await video.save();
    res.json({ comments: video.comments });
});

app.listen(port, () => console.log(`Palvelin käynnissä portissa ${port}`));
