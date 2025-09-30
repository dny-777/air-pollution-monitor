# 🌍 Air Pollution Monitor

A real-time air quality monitoring application for India with AI-powered predictions, interactive heat maps, and comprehensive pollution data visualization.

## ✨ Features

- **Real-time Air Quality Data**: Monitor PM2.5 and PM10 levels across 28,000+ monitoring stations
- **Interactive Heat Maps**: Purple gradient visualization showing PM2.5 concentration levels
- **Smart Search**: Autocomplete city search with multi-location support
- **AQI Classification**: Color-coded markers showing air quality categories
- **AI Predictions**: Machine learning models for pollution forecasting
- **Responsive Design**: Full-screen desktop experience with mobile compatibility

## 🚀 Live Demo

🔗 **[View Live Application](https://your-deployed-app.vercel.app)** (Update after deployment)

## 🏗️ Tech Stack

### Frontend
- **React 19** with Vite
- **Leaflet** for interactive maps
- **react-leaflet-heatmap-layer** for pollution visualization
- **Tailwind-style inline CSS** for responsive design

### Backend
- **Flask** with Python 3.9+
- **Scikit-learn** for ML models
- **Pandas** for data processing
- **Joblib** for model serialization

### Deployment
- **Vercel** for full-stack hosting
- **GitHub** for version control

## 📊 Data Sources

- **28,803 monitoring stations** across India
- Real-time PM2.5 and PM10 measurements
- Geographic coordinates for precise mapping
- AQI calculations based on Indian standards

## 🎨 Visual Design

### Heat Map (Purple Gradient)
- **Light Purple**: Low PM2.5 (0-30 µg/m³) - Good air quality
- **Medium Purple**: Moderate PM2.5 (60-90 µg/m³)
- **Dark Purple**: High PM2.5 (120-180 µg/m³)  
- **Very Dark Purple**: Severe PM2.5 (240+ µg/m³) - Hazardous levels

### AQI Markers (Color-Coded)
- 🟢 **Green**: Good (0-50)
- 🟡 **Yellow**: Satisfactory (51-100)
- 🟠 **Orange**: Moderate (101-200)
- 🔴 **Red**: Poor (201-300)
- 🔴 **Dark Red**: Very Poor (301-400)
- 🟤 **Brown**: Severe (401-500)

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Python 3.9+
- Git

### Setup

1. **Clone Repository**
```bash
git clone https://github.com/your-username/air-pollution-monitor.git
cd air-pollution-monitor
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../air-pollution-backend
pip install -r requirements.txt
```

4. **Start Development Servers**

Backend:
```bash
cd air-pollution-backend
python app.py
```

Frontend:
```bash
cd frontend
npm run dev
```

5. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Auto-deploy** with vercel.json configuration

### Manual Deployment

```bash
# Build frontend
cd frontend
npm run build

# Deploy both frontend and backend to Vercel
vercel --prod
```

## 📁 Project Structure

```
air-pollution-monitor/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── MapView_fixed.jsx   # Main component
│   │   ├── utils/
│   │   └── assets/
│   ├── public/
│   │   └── updated_pm25_data.json
│   └── package.json
├── air-pollution-backend/       # Flask backend
│   ├── app.py                  # Main API server
│   ├── requirements.txt
│   └── *.pkl                   # ML models (excluded from git)
├── vercel.json                 # Deployment config
├── DEPLOYMENT.md              # Deployment guide
└── README.md
```

## 🔧 Configuration

### Environment Variables
```env
# Production API endpoint
NODE_ENV=production
```

### API Endpoints
- `GET /` - Health check
- `POST /predict/pm25` - PM2.5 prediction
- `POST /predict/category` - AQI category prediction
- `POST /predict/grid` - Grid-based heatmap data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Central Pollution Control Board (CPCB)** for air quality data
- **OpenStreetMap** contributors for map tiles
- **Leaflet** community for mapping libraries
- **React** and **Flask** communities

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

⭐ **Star this repository if it helped you monitor air quality!**
