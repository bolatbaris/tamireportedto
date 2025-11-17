# Tami Reported To - GitHub Issue Automation

GitHub Issue'larını otomatik kontrol eder ve belirli koşullar sağlandığında raporlayan kullanıcının tokenı ile otomatik comment gönderir.

## 🚀 Hızlı Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun:

```env
# GitHub Token (raporlayan kullanıcının tokenı)
GITHUB_TOKEN=ghp_reporter_user_token

# API Password (GET endpoint için)
API_PASSWORD=your_secure_password
```

### 3. Çalıştır

```bash
npm run dev
```

## 📋 Nasıl Çalışır?

1. **Hedef Assignee'ler:** `@bolatbaris`, `@kazimmadan` veya `@brkeudunman`'a assign edilmiş açık issue'ları çeker
2. GitHub Project (#2) üzerinden `reportedTo` ve `Status` field'larını okur
3. Koşullar sağlanırsa **raporlayan kullanıcının tokenı ile** comment gönderir:
   - ✅ `reportedTo` field'ı dolu ve **en az 3 karakter**
   - ✅ `Status` → "In Test", "In QA" veya "In Prod"
   - ✅ Issue hedef assignee'lerden birine assign edilmiş
   - ✅ Bugün tatil/hafta sonu değil

**Comment Formatları:**
- **In Test:** `@reportedTo Test ortamına deployu sağlanmıştır. Lütfen, test edip dönüş sağlayınız 😊`
- **In QA:** `@reportedTo QA ortamına deployu sağlanmıştır. Lütfen, uat kapsamında kontrol edip dönüş sağlayınız 🔍`
- **In Prod:** `@reportedTo Issue production ortamına deploy edilmiştir. Lütfen production ortamında kontrollerinizi gerçekleştiriniz ve issue'ı kapatınız 🚀`

## 🌐 API Kullanımı

### GET /api/process (Cron Job İçin)

Password korumalı endpoint. Harici cron servisiniz bu URL'yi çağıracak:

```
GET https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD
```

**Parametreler:**
- `password` (zorunlu) - API şifreniz

**⚠️ Güvenlik:**
- ✅ Sadece GET metodu desteklenir
- ✅ Yanlış şifre ile yapılan istekler reddedilir (401 Unauthorized)
- ✅ Development modunda otomatik olarak dry-run aktif (comment göndermez)
- ✅ Production'da gerçek comment gönderir

**Örnek:**

```bash
curl "https://your-domain.vercel.app/api/process?password=YOUR_PASSWORD"
```

## ⏰ Cron Job Kurulumu

Detaylı bilgi için: [CRON_SETUP.md](CRON_SETUP.md)

**Önerilen:** [cron-job.org](https://cron-job.org) - Ücretsiz, hafta içi 09:00

## 🏗️ Proje Yapısı

```
├── app/api/process/route.ts    # API endpoint
├── services/
│   ├── github.service.ts       # GitHub API işlemleri
│   ├── comment.service.ts      # Comment mantığı
│   └── orchestrator.service.ts # Ana koordinasyon
├── config/
│   ├── holidays.ts             # Tatil günleri (2025-2027)
│   └── tokens.ts               # Token yönetimi
└── types/github.ts             # TypeScript types
```

## 🔒 Güvenlik

- ✅ GET endpoint password korumalı
- ✅ Environment variables ile token yönetimi
- ✅ `.gitignore` ile sensitive data koruması
- ✅ Rate limiting (1 saniye bekleme)

## 📅 Tatil Günleri

### 🔒 3 Katmanlı Koruma

1. **API Endpoint** - İlk kontrol, hiçbir işlem başlamaz
2. **Comment Service** - Double check, ekstra güvenlik
3. **Tatil Listesi** - 2025-2027 tam liste + hafta sonları

**Garanti:** Tatil/hafta sonu günlerinde API çağrısı yapılsa bile **kesinlikle** comment gönderilmez!

### Kontrol Edilen Günler

- ✅ Hafta sonları (Cumartesi, Pazar)
- ✅ Resmi tatiller (2025-2027):
  - Yılbaşı, Ramazan & Kurban Bayramları
  - 23 Nisan, 1 Mayıs, 19 Mayıs, 30 Ağustos, 29 Ekim

Test senaryoları için: [TESTING.md](TESTING.md)

## 🐛 Troubleshooting

### Password Çalışmıyor
- `.env.local`'de `API_PASSWORD` var mı?
- Sunucuyu yeniden başlattınız mı? (`npm run dev`)

### Comment Gönderilmiyor
- Issue'nun tüm kriterleri sağladığından emin olun
- Development modunda test edin (otomatik dry-run)
- Console log'larını kontrol edin

### Development vs Production

**Development** (`npm run dev`):
- Her zaman dryRun=true (comment göndermez)
- Test ve geliştirme için güvenli

**Production** (Vercel):
- Gerçek comment gönderir
- Sadece doğru password ile çalışır

## 📦 Deployment

### Vercel (Önerilen)

1. GitHub'a push edin
2. [Vercel](https://vercel.com) dashboard'dan import edin
3. Environment variables ekleyin:
   - `GITHUB_DEFAULT_TOKEN`
   - `GITHUB_TOKEN_*` (her kullanıcı için)
   - `API_PASSWORD`
4. Deploy edin

### URL Örneği

```
https://your-project.vercel.app/api/process?password=YOUR_PASSWORD
```

Bu URL'yi cron job servisinize verin.

## 📝 Geliştirme

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## 📄 Lisans

MIT
