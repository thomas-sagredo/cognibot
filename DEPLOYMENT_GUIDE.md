# 🚀 Guía Completa de Deployment - CogniBot

## 📋 Opciones de Deployment

### 🎯 **Opción 1: GitHub + Vercel (Recomendado - Gratis)**
- ✅ **Frontend**: Vercel (gratis)
- ✅ **Backend**: Railway/Render (gratis con límites)
- ✅ **Base de datos**: Tu MySQL actual
- ✅ **CI/CD**: Automático con GitHub

### 🎯 **Opción 2: Google Cloud Platform**
- ✅ **Frontend**: Cloud Storage + CDN
- ✅ **Backend**: Cloud Run
- ✅ **Base de datos**: Cloud SQL o tu MySQL actual
- ✅ **Créditos**: $300 USD gratis

---

## 🔧 OPCIÓN 1: GitHub + Vercel (Más Fácil)

### Paso 1: Preparar el Proyecto

#### 1.1 Crear repositorio en GitHub
```bash
# En tu terminal, navega al proyecto
cd "C:\Users\Sistemas 5\Desktop\app-cognibot\convers-diagram-main"

# Inicializar Git
git init
git add .
git commit -m "Initial commit: CogniBot project"

# Crear repositorio en GitHub (ve a github.com)
# Nombre sugerido: cognibot-platform

# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/cognibot-platform.git
git branch -M main
git push -u origin main
```

#### 1.2 Configurar variables de entorno
Crea `.env.example` en la raíz:
```env
# Frontend
VITE_API_BASE_URL=https://tu-backend.railway.app

# Backend (para Railway/Render)
DATABASE_URL=mysql+pymysql://admin:sis2018Eze*@154.2.8.21:3306/phpMyAdmin
SECRET_KEY=sis2018Eze*_super_secret_key_2025
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://cognibot-platform.vercel.app
DEBUG=False
```

### Paso 2: Deploy del Frontend en Vercel

#### 2.1 Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Click en **"New Project"**
4. Selecciona tu repositorio `cognibot-platform`

#### 2.2 Configurar el proyecto
```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 2.3 Variables de entorno en Vercel
```
VITE_API_BASE_URL = https://tu-backend.railway.app
```

#### 2.4 Deploy
- Click **"Deploy"**
- Tu app estará en: `https://cognibot-platform.vercel.app`

### Paso 3: Deploy del Backend en Railway

#### 3.1 Preparar el backend
Crea `proyects/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Actualiza `proyects/requirements.txt`:
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pymysql==1.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
requests==2.31.0
python-multipart==0.0.6
pydantic==2.5.3
python-dotenv==1.0.0
cryptography==41.0.7
```

#### 3.2 Deploy en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona tu repositorio
5. Configurar:
   ```
   Root Directory: proyects
   Build Command: (automático)
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

#### 3.3 Variables de entorno en Railway
```
DATABASE_URL=mysql+pymysql://admin:sis2018Eze*@154.2.8.21:3306/phpMyAdmin
SECRET_KEY=sis2018Eze*_super_secret_key_2025
ALLOWED_ORIGINS=https://cognibot-platform.vercel.app
DEBUG=False
PORT=8000
```

#### 3.4 Obtener URL del backend
- Railway te dará una URL como: `https://cognibot-backend-production.up.railway.app`
- Actualiza `VITE_API_BASE_URL` en Vercel con esta URL

---

## 🌐 OPCIÓN 2: Google Cloud Platform

### Paso 1: Configuración Inicial de GCP

#### 1.1 Activar servicios necesarios
```bash
# Instalar Google Cloud CLI
# Descargar desde: https://cloud.google.com/sdk/docs/install

# Autenticarse
gcloud auth login

# Crear proyecto (opcional)
gcloud projects create cognibot-platform --name="CogniBot Platform"
gcloud config set project cognibot-platform

# Activar APIs necesarias
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable sql.googleapis.com
```

### Paso 2: Deploy del Backend en Cloud Run

#### 2.1 Preparar Dockerfile para Cloud Run
`proyects/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copiar y instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
```

#### 2.2 Deploy del backend
```bash
# Navegar al directorio del backend
cd proyects

# Build y deploy en una sola línea
gcloud run deploy cognibot-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=mysql+pymysql://admin:sis2018Eze*@154.2.8.21:3306/phpMyAdmin,SECRET_KEY=sis2018Eze*_super_secret_key_2025,DEBUG=False"
```

### Paso 3: Deploy del Frontend en Cloud Storage

#### 3.1 Build del frontend
```bash
# Volver a la raíz del proyecto
cd ..

# Configurar variable de entorno para build
echo "VITE_API_BASE_URL=https://cognibot-backend-HASH-uc.a.run.app" > .env

# Build
npm run build
```

#### 3.2 Crear bucket y subir archivos
```bash
# Crear bucket (nombre debe ser único globalmente)
gsutil mb gs://cognibot-platform-frontend

# Configurar bucket para hosting web
gsutil web set -m index.html -e index.html gs://cognibot-platform-frontend

# Hacer público
gsutil iam ch allUsers:objectViewer gs://cognibot-platform-frontend

# Subir archivos
gsutil -m cp -r dist/* gs://cognibot-platform-frontend/

# Tu app estará en: https://storage.googleapis.com/cognibot-platform-frontend/index.html
```

#### 3.3 (Opcional) Configurar dominio personalizado
```bash
# Reservar IP estática
gcloud compute addresses create cognibot-ip --global

# Configurar Load Balancer (proceso más complejo)
# Recomendamos usar Cloud CDN para mejor rendimiento
```

---

## 🔄 CI/CD Automático con GitHub Actions

### Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test --if-present
    
    - name: Build
      run: npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: bervProject/railway-deploy@v1.2.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: cognibot-backend
```

---

## 📊 Comparación de Opciones

| Aspecto | GitHub + Vercel | Google Cloud |
|---------|----------------|--------------|
| **Costo** | Gratis (con límites) | $300 créditos gratis |
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **CI/CD** | Automático | Manual/Actions |
| **Dominio custom** | Gratis | Requiere configuración |
| **SSL** | Automático | Automático |
| **Monitoreo** | Básico | Avanzado |

---

## 🎯 Recomendación Final

### Para empezar rápido: **GitHub + Vercel**
1. **Tiempo de setup**: 30 minutos
2. **Costo**: $0/mes
3. **Perfecto para**: MVP, demos, desarrollo

### Para producción seria: **Google Cloud**
1. **Tiempo de setup**: 2-3 horas
2. **Costo**: Gratis por 12 meses con créditos
3. **Perfecto para**: Aplicación en producción, escalabilidad

---

## 🚀 Próximos Pasos

1. **Elige tu opción** preferida
2. **Sigue la guía** paso a paso
3. **Configura el dominio** personalizado
4. **Implementa monitoreo** y analytics
5. **Configura backups** de la base de datos

¿Con cuál opción te gustaría que te ayude a empezar?
