import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const exportsDir = path.join(__dirname, 'public', 'exports');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
[exportsDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use('/exports', express.static(exportsDir));
app.use('/uploads', express.static(uploadsDir));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// In-memory file mapping
const videoFilePathMap: Record<string, string> = {};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper to extract thumbnail
const extractThumbnail = (videoPath: string, timestamp: number, outputName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const thumbFileName = `${outputName}.jpg`;
    console.log(`Extracting thumbnail for ${videoPath} at ${timestamp}s...`);
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: thumbFileName,
        folder: exportsDir,
        size: '640x?'
      })
      .on('start', (cmd) => console.log('FFmpeg thumb command:', cmd))
      .on('end', () => {
        console.log(`Thumbnail created: ${thumbFileName}`);
        resolve(`/exports/${thumbFileName}`);
      })
      .on('error', (err) => {
        console.error(`FFmpeg Thumbnail Error: ${err.message}`);
        reject(err);
      });
  });
};

const getVideoDuration = (videoPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const videoId = `v_${Date.now()}`;
  const videoPath = req.file.path;
  videoFilePathMap[videoId] = videoPath;
  
  try {
    const thumbnail = await extractThumbnail(videoPath, 1, `thumb_${videoId}`);
    res.json({ 
      videoId, 
      url: `/uploads/${req.file.filename}`,
      thumbnail,
      filePath: videoPath
    });
  } catch (err) {
    res.json({ videoId, url: `/uploads/${req.file.filename}`, filePath: videoPath });
  }
});

app.post('/api/analyze-video', async (req, res) => {
  const { videoId } = req.body;
  const videoPath = videoFilePathMap[videoId as string];
  if (!videoPath || !fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found on server' });
  }

  try {
    const duration = await getVideoDuration(videoPath);
    if (duration === 0) throw new Error('Could not determine video duration');

    // Sample up to 12 frames spread across the video
    const numSamples = Math.max(1, Math.min(12, Math.floor(duration / 5)));
    const interval = duration / numSamples;
    const timestamps = Array.from({ length: numSamples }, (_, i) =>
      Math.min(i * interval + interval * 0.1, duration - 1)
    );

    console.log(`Analyzing ${videoId}: duration=${duration.toFixed(1)}s, ${numSamples} samples`);

    // Extract a thumbnail at each sample timestamp
    const thumbPaths = await Promise.all(
      timestamps.map((t, i) =>
        extractThumbnail(videoPath, t, `analysis_${videoId}_${i}`)
          .catch(() => null)
      )
    );

    // Classify each frame with Gemini vision
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const clips = await Promise.all(
      thumbPaths.map(async (thumbRelPath, i) => {
        if (!thumbRelPath) return null;

        // thumbRelPath is like "/exports/analysis_v_123_0.jpg"
        const absPath = path.join(__dirname, 'public', thumbRelPath.replace(/^\//, ''));

        if (!fs.existsSync(absPath)) return null;

        const imageBase64 = fs.readFileSync(absPath).toString('base64');

        const result = await model.generateContent([
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg',
            },
          },
          'You are classifying a single frame from a video for social media content repurposing. ' +
          'Reply ONLY with a single valid JSON object (no markdown, no explanation): ' +
          '{"type": "<one of: hook, b-roll, interview, tutorial, reveal, drone>", ' +
          '"tags": ["<tag1>", "<tag2>", "<tag3>"], ' +
          '"visualQuality": "<one of: high, medium, low>"}',
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) return null;

        let parsed: { type: string; tags: string[]; visualQuality: string };
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (_e) {
          return null;
        }

        const validTypes = ['hook', 'b-roll', 'interview', 'tutorial', 'reveal', 'drone'];
        const type = validTypes.includes(parsed.type) ? parsed.type : 'b-roll';

        const startTime = timestamps[i];
        const endTime = Math.min(startTime + interval, duration);

        return {
          type,
          startTime: Math.round(startTime * 10) / 10,
          endTime: Math.round(endTime * 10) / 10,
          duration: Math.round((endTime - startTime) * 10) / 10,
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
          visualQuality: ['high', 'medium', 'low'].includes(parsed.visualQuality)
            ? parsed.visualQuality
            : 'medium',
          thumbnailPath: thumbRelPath,
        };
      })
    );

    const validClips = clips.filter(Boolean);
    console.log(`Analysis complete: ${validClips.length} clips classified`);

    res.json({ videoId, analysis: { clips: validClips } });
  } catch (error: any) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze video', detail: error.message });
  }
});

app.get('/api/clip-thumbnail', async (req, res) => {
  const { videoId, time, clipId } = req.query;
  const videoPath = videoFilePathMap[videoId as string];
  if (!videoPath) return res.status(404).send('Video not found');
  
  try {
    const thumbUrl = await extractThumbnail(videoPath, Number(time), `thumb_clip_${clipId}`);
    res.json({ url: thumbUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-video', async (req, res) => {
  const { variantId, clips, sourceVideoId } = req.body;
  const outputFileName = `mix_${variantId}.mp4`;
  const outputPath = path.join(exportsDir, outputFileName);
  const sourcePath = videoFilePathMap[sourceVideoId];

  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return res.status(400).json({ error: "Source video not found on server" });
  }

  console.log(`Generating real video mix for ${variantId}...`);

  let command = ffmpeg(sourcePath);
  let filterGraph = '';
  let inputs = '';

  clips.forEach((clip: any, i: number) => {
    const start = clip.startTime || 0;
    const dur = clip.duration || 5;
    filterGraph += `[0:v]trim=start=${start}:duration=${dur},setpts=PTS-STARTPTS[v${i}];`;
    filterGraph += `[0:a]atrim=start=${start}:duration=${dur},asetpts=PTS-STARTPTS[a${i}];`;
    inputs += `[v${i}][a${i}]`;
  });

  filterGraph += `${inputs}concat=n=${clips.length}:v=1:a=1[outv][outa]`;

  command
    .complexFilter(filterGraph, ['outv', 'outa'])
    .on('error', (err) => {
      console.error('FFmpeg Error:', err);
      res.status(500).json({ error: err.message });
    })
    .on('end', () => {
      console.log('FFmpeg Finished!');
      res.json({ success: true, videoUrl: `/exports/${outputFileName}` });
    })
    .save(outputPath);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
