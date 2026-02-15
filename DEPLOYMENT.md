# Medical Robot App - Deployment Guide

## How to Update the App on Another Device

### Prerequisites
- Python 3.7+ installed
- Git installed
- Internet connection (for initial setup and AI features)

### Method 1: Using Git (Recommended)

1. **Clone or Pull Latest Code**
   ```bash
   # If this is the first time on the device:
   git clone https://github.com/your-username/medical_robot_app.git
   cd medical_robot_app
   
   # If updating existing installation:
   cd medical_robot_app
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables**
   ```bash
   # Windows
   set GEMINI_API_KEY=your_api_key_here
   
   # Linux/Mac
   export GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Application**
   ```bash
   cd backend
   python app.py
   ```

5. **Access the App**
   - Open browser and go to: `http://localhost:5000`
   - For network access: `http://DEVICE_IP:5000`

### Method 2: Manual File Transfer

1. **Copy Files**
   - Copy the entire `medical_robot_app` folder to the target device
   - Ensure all files are transferred including:
     - `backend/` folder with `app.py`
     - `frontend/` folder with all HTML/CSS/JS files
     - `requirements.txt`

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the App**
   ```bash
   cd backend
   python app.py
   ```

### Database Migration

The app automatically handles database schema updates:
- New columns (like `specific_area`) are added automatically
- Existing data is preserved
- No manual migration needed

### Network Configuration

**For Remote Access:**
1. Find the device IP address:
   ```bash
   ipconfig  # Windows
   ifconfig    # Linux/Mac
   ```

2. Configure firewall to allow port 5000:
   ```bash
   # Windows (run as Administrator)
   netsh advfirewall firewall add rule name="Medical App" dir=in action=allow protocol=TCP localport=5000
   
   # Linux
   sudo ufw allow 5000
   ```

3. Access from other devices:
   ```
   http://DEVICE_IP:5000
   ```

### Troubleshooting

**Port Already in Use:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Kill the process or use different port
python app.py --port 5001
```

**Module Not Found:**
```bash
# Install missing dependencies
pip install flask sqlite3
```

**Database Issues:**
- Delete `backend/database.db` to reset
- App will recreate with fresh schema

### Production Deployment

For production use, consider:
1. **WSGI Server** (Gunicorn/uWSGI):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Reverse Proxy** (Nginx/Apache):
   - Configure to serve static files directly
   - Proxy API requests to Flask app

3. **Process Manager** (systemd/supervisor):
   - Keep app running automatically
   - Restart on crashes

### Updates

To update the app in the future:
```bash
cd medical_robot_app
git pull origin main
pip install -r requirements.txt  # If new dependencies added
# Restart the app
```

### Language Support

The app now supports:
- English (default)
- Malayalam (മലയാളം)
- Hindi (हिन्दी)

Language selection is stored in browser localStorage and persists across sessions.

### New Features Added

1. **Language Selection**: Multi-language support with visual language picker
2. **Specific Body Areas**: Enhanced pain location selection with detailed areas
3. **Visual References**: Image display and text backup for body parts
4. **Delete Patients**: Doctors can delete patients (already existed)
5. **Enhanced UI**: Better user experience with modern styling

### API Endpoints

New/Updated endpoints:
- `POST /api/save_pain_selection` - Now includes `specific_area`
- `POST /api/save_pain_answers` - Now includes `specific_area`
- `POST /api/analyze_condition` - Now includes `specific_area`
- `GET /language_selection.html` - Language selection page

### Database Schema

Updated `pain_analysis` table:
- Added `specific_area` column (TEXT)
- Existing records will have NULL for this column
