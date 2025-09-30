# Air Pollution Monitor - Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account (free at vercel.com)

### Steps:

#### 1. Push to GitHub
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Air Pollution Monitor"

# Create repository on GitHub and push
git remote add origin https://github.com/your-username/air-pollution-monitor.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`

#### 3. Environment Variables (if needed)
Add any environment variables in Vercel dashboard:
- `NODE_ENV=production`

### 🔄 Updating After Deployment

**Yes, you can update the frontend easily!**

1. **Make changes** to your code locally
2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update: your changes"
   git push
   ```
3. **Vercel automatically redeploys** (usually takes 1-2 minutes)

---

## 🛠 Alternative: Manual Static Deployment

### Build locally and deploy to any static host:

```bash
# Build the frontend
cd frontend
npm run build

# The 'dist' folder contains your built app
# Upload the 'dist' folder to:
# - Netlify (drag & drop)
# - GitHub Pages
# - Any static hosting service
```

### For Backend (separate deployment):
- **Railway**: Easy Python hosting
- **Render**: Free tier available
- **PythonAnywhere**: Good for Python apps

---

## 📁 Project Structure for Deployment
```
air-pollution-backend/
├── vercel.json          # Vercel configuration
├── requirements.txt     # Python dependencies
├── air-pollution-backend/
│   ├── app.py          # Flask backend
│   ├── *.pkl           # ML models
│   └── *.json          # Data files
└── frontend/
    ├── package.json    # Frontend dependencies
    ├── vite.config.js  # Build configuration
    └── dist/           # Built frontend (after npm run build)
```

---

## 🔧 Troubleshooting

### Common Issues:
1. **CORS errors**: Already handled in Flask app
2. **File paths**: Use relative paths for assets
3. **API endpoints**: Update to use `/api/` prefix in production

### Quick Fixes:
- Check Vercel function logs for backend errors
- Ensure all dependencies are in requirements.txt
- Verify file paths are correct
