# DeAL — Backend (backend-root)

Dockerized backend consisting of three services:

| Service | Description | Port |
|---|---|---|
| `backend` | Node.js/Express REST API | 3000 |
| `ai-service` | FastAPI AI chat service (Groq/LLaMA) | 8000 |
| `ml-service` | FastAPI stress prediction service | 8001 |

---

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- A [Firebase](https://console.firebase.google.com/) project with a service account key
- A [Groq](https://console.groq.com/) API key for the AI service
- A MongoDB connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd backend-root
```

### 2. Create environment files

**`backend/.env`**

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=./admin/your-service-account.json
```

**`ai-service/.env`**

```env
GROQ_API_KEY=your_groq_api_key_here
```

> The ML service has no required environment variables — it loads the pre-trained model from `stress_prediction/stress_model/`.

### 3. Add Firebase service account

Download your Firebase service account JSON from:  
**Firebase Console → Project Settings → Service Accounts → Generate new private key**

Place the file at:

```
backend/admin/your-service-account.json
```

Then update `FIREBASE_SERVICE_ACCOUNT_PATH` in `backend/.env` to match the filename.

---

## Running

### Development (with hot reload via volume mounts)

```bash
docker-compose up --build
```

- Backend source changes at `backend/src/` are picked up automatically by nodemon.
- AI service changes at `ai-service/app/` are picked up by uvicorn `--reload`.

### Production

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Production config removes volume mounts and exposes services only on localhost.

---

## Project Structure

```
backend-root/
  backend/                  # Node.js Express API
    src/
      config/               # Database and Firebase Admin setup
      middleware/           # Firebase token verification
      models/               # Mongoose schemas
      routes/               # Express route handlers
      services/             # Business logic
    admin/                  # Firebase service account (excluded from git)
  ai-service/               # FastAPI AI chat microservice
    app/
      routers/              # Chat and tips endpoints
      models/               # Request/response schemas
      config.py             # Settings (reads .env)
  stress_prediction/        # FastAPI stress prediction microservice
    ml_service/             # FastAPI app
    stress_model/           # Trained model artifacts (.joblib, .json)
    features.py             # Feature extraction logic
  docker-compose.yml        # Development compose file
  docker-compose.prod.yml   # Production compose file
```

---

## Notes

- `backend/admin/*.json` (Firebase service account) is excluded from git. Never commit it.
- The `stress_prediction/WESAD/` training dataset folder is excluded from git due to size.
- All `.env` files are excluded from git.
