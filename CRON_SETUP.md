# 🕐 Cron Job Kurulum Kılavuzu

Bu proje, harici bir cron job servisi ile çalışacak şekilde yapılandırılmıştır.

## 🔧 Kurulum

### 1. API Password Belirleyin

`.env.local` dosyanıza API şifresi ekleyin:

```env
API_PASSWORD=güçlü_bir_şifre_buraya
```

**Güvenlik İpuçları:**
- En az 20 karakter kullanın
- Rastgele karakterler, sayılar ve semboller içersin
- Asla Git'e commit etmeyin

**Şifre Oluşturma Örneği:**
```bash
# PowerShell'de rastgele şifre oluşturma
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 2. API Endpoint

Cron job servisinize şu URL'yi verin:

```
https://your-domain.vercel.app/api/process?password=SIZIN_SIFRENIZ
```

**Parametreler:**
- `password` (zorunlu) - API şifreniz
- `dryRun=true` (opsiyonel) - Test modu
- `limit=10` (opsiyonel) - İşlenecek issue sayısı limiti

## 📋 Kullanım Örnekleri

### Production (Gerçek Comment Gönderir)
```
GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD
```

### Test Modu (Comment Göndermez)
```
GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD&dryRun=true
```

### Limit ile Test
```
GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD&dryRun=true&limit=10
```

## 🔒 Güvenlik

### ✅ Korunan
- GET endpoint password ile korunur
- Yanlış şifre ile 401 Unauthorized döner
- Şifre environment variable'da saklanır

### ❌ Korunmayan
- POST endpoint (sadece development için)

**Önemli:** Production'da POST endpoint'i devre dışı bırakmak isterseniz koddan silebilirsiniz.

## 🌐 Popüler Cron Job Servisleri

### 1. **cron-job.org** (Ücretsiz, Önerilen)
- Web sitesi: https://cron-job.org
- Kurulum:
  1. Hesap oluşturun
  2. "Create Cronjob" tıklayın
  3. URL'yi girin: `https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD`
  4. Schedule'ı ayarlayın: "Every weekday at 09:00"
  5. Save

### 2. **EasyCron** (Ücretsiz Tier)
- Web sitesi: https://www.easycron.com
- URL'yi ekleyin ve schedule ayarlayın

### 3. **UptimeRobot** (Ücretsiz, Monitoring + Cron)
- Web sitesi: https://uptimerobot.com
- Monitor oluşturun ve 5 dakikada bir kontrol ettirin

### 4. **GitHub Actions** (Özel Schedule)
`.github/workflows/cron.yml` oluşturun:

```yaml
name: Scheduled Issue Check

on:
  schedule:
    - cron: '0 6 * * 1-5'  # Her hafta içi 09:00 (UTC+3)
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger API
        run: |
          curl -f "https://your-domain.vercel.app/api/process?password=${{ secrets.API_PASSWORD }}"
```

**Secrets ekleyin:** Repository Settings > Secrets > Actions > New secret
- Name: `API_PASSWORD`
- Value: Şifreniz

## ⏰ Önerilen Schedule

**Hafta içi sabah 09:00** (Pazartesi-Cuma)

- **Cron Expression:** `0 9 * * 1-5`
- **cron-job.org:** "Every weekday at 09:00"
- **GitHub Actions:** `'0 6 * * 1-5'` (UTC için 6, Türkiye UTC+3)

## 🧪 Test

### Lokal Test
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=test123&dryRun=true" -Method GET

# veya tarayıcıda
http://localhost:3000/api/process?password=test123&dryRun=true
```

### Production Test
```bash
# PowerShell
Invoke-WebRequest -Uri "https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD&dryRun=true" -Method GET
```

## 📊 Response Örnekleri

### Başarılı
```json
{
  "success": true,
  "message": "Process completed successfully",
  "stats": {
    "totalIssues": 79,
    "processed": 79,
    "sent": 3,
    "skipped": 76,
    "errors": 0
  }
}
```

### Yanlış Şifre
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing password"
}
```

### Hata
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message here"
}
```

## 🔍 Monitoring

### Log Kontrolü

**Vercel'de:**
1. Dashboard > Your Project
2. Deployments > Functions
3. `/api/process` fonksiyonunun log'larını görün

**Cron job servisinde:**
- Execution history'yi kontrol edin
- HTTP status code 200 olmalı
- Response time < 30 saniye

### Alerting

Cron job servisinizde email alerting açın:
- HTTP status ≠ 200
- Response time > 30 saniye
- Request timeout

## 🐛 Troubleshooting

### Şifre Çalışmıyor
```bash
# .env.local'de API_PASSWORD var mı kontrol edin
# Vercel'de Environment Variable eklenmiş mi kontrol edin
```

### Cron Job Çalışmıyor
- URL doğru mu?
- Şifre URL'de var mı?
- HTTPS kullanılıyor mu?
- Timeout süresi yeterli mi? (en az 60 saniye)

### Rate Limiting
GitHub API rate limit: 5,000 request/hour
- Saatte bir kereden fazla çalıştırmayın
- Günde 2-3 kez yeterli

## 📝 Deployment Checklist

- [ ] `.env.local`'de `API_PASSWORD` ayarlandı
- [ ] Vercel'de `API_PASSWORD` environment variable eklendi
- [ ] Cron job servisi ayarlandı
- [ ] URL'de şifre doğru
- [ ] Schedule hafta içi 09:00 ayarlandı
- [ ] Test edildi (`dryRun=true`)
- [ ] Production test edildi
- [ ] Monitoring/alerting aktif

## 🎯 Production Kullanımı

1. **İlk Deploy**
   ```bash
   git push
   # Vercel otomatik deploy eder
   ```

2. **Environment Variable Ekle**
   - Vercel Dashboard
   - Project Settings > Environment Variables
   - `API_PASSWORD` ekle

3. **Cron Job Kur**
   - cron-job.org'a kayıt ol
   - URL'yi ekle (şifre ile birlikte)
   - Schedule ayarla

4. **İlk Test**
   ```
   GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD&dryRun=true&limit=5
   ```

5. **Production'a Geç**
   ```
   GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD
   ```

6. **Monitor Et**
   - İlk çalışmayı bekle
   - Vercel log'larını kontrol et
   - GitHub'da comment'leri gör

---

## 💡 İpuçları

- Şifreyi güvenli tutun (1Password, LastPass, vb.)
- İlk günler günde 2-3 kez test edin
- Log'ları düzenli kontrol edin
- Hafta sonları tatil günleri otomatik atlanır
- Duplicate comment'ler engellenir (7 gün)

**Sorularınız için:** README.md ve USAGE.md dosyalarına bakın.

