# 🧪 Test Senaryoları

## Tatil Günü Testi

### Manuel Test (Sistem Saatini Değiştirerek)

**Windows PowerShell (Yönetici):**
```powershell
# Sistemi 1 Ocak 2025'e ayarla (Yılbaşı)
Set-Date -Date "2025-01-01 10:00:00"

# API'yi test et
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# Tarihi geri al (bugün)
Set-Date -Date (Get-Date)
```

**Beklenen Response:**
```json
{
  "success": true,
  "message": "Today is a holiday or weekend (2025-01-01). Process skipped.",
  "stats": {
    "totalIssues": 0,
    "processed": 0,
    "sent": 0,
    "skipped": 0,
    "errors": 0
  }
}
```

**Console Log:**
```
⛔ Today is a holiday or weekend (2025-01-01 - Çarşamba). Skipping process.
```

---

## Hafta Sonu Testi

### Cumartesi
```powershell
# Sistemi Cumartesi'ye ayarla
Set-Date -Date "2025-11-15 10:00:00"  # Cumartesi

# Test
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET
```

### Pazar
```powershell
# Sistemi Pazar'a ayarla
Set-Date -Date "2025-11-16 10:00:00"  # Pazar

# Test
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET
```

---

## Çalışma Günü Testi

```powershell
# Sistemi Pazartesi'ye ayarla
Set-Date -Date "2025-11-17 10:00:00"  # Pazartesi

# Test
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET
```

**Beklenen:** Normal çalışma, issue'lar işlenecek

---

## Tüm 2025-2027 Tatil Günleri Testi

### 2025 Tatilleri
```powershell
# Yılbaşı
Set-Date -Date "2025-01-01 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# Ramazan Bayramı
Set-Date -Date "2025-04-01 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# 23 Nisan
Set-Date -Date "2025-04-23 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# 1 Mayıs
Set-Date -Date "2025-05-01 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# 19 Mayıs
Set-Date -Date "2025-05-19 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# Kurban Bayramı
Set-Date -Date "2025-06-08 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# 30 Ağustos
Set-Date -Date "2025-08-30 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET

# 29 Ekim
Set-Date -Date "2025-10-29 10:00"
Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET
```

Her biri için:
```json
{
  "success": true,
  "message": "Today is a holiday or weekend (TARIH). Process skipped."
}
```

---

## Güvenlik Kontrolleri

### ✅ 3 Katmanlı Koruma

1. **API Endpoint** (`app/api/process/route.ts`)
   - İlk kontrol burada yapılır
   - Hiçbir işlem başlamaz

2. **Comment Service** (`services/comment.service.ts`)
   - Double check - ekstra güvenlik
   - Issue'lar çekilse bile comment gönderilmez

3. **Tatil Listesi** (`config/holidays.ts`)
   - 2025-2027 tam liste
   - Hafta sonları her zaman engellenir

### ⚠️ 2027 Sonrası Warning

2028 veya sonrası bir tarih gelirse:
```
⚠️ Warning: Holiday data not available for year 2028. System will only check weekends.
```

Hafta sonları yine de engellenir ama resmi tatiller kontrol edilemez.

---

## Otomatik Test Script

`test-holidays.ps1` oluşturun:

```powershell
# Test edilecek tatil günleri
$holidays = @(
    "2025-01-01",  # Yılbaşı
    "2025-04-01",  # Ramazan Bayramı
    "2025-04-23",  # 23 Nisan
    "2025-05-01",  # 1 Mayıs
    "2025-05-19",  # 19 Mayıs
    "2025-06-08",  # Kurban Bayramı
    "2025-08-30",  # 30 Ağustos
    "2025-10-29"   # 29 Ekim
)

$originalDate = Get-Date

foreach ($holiday in $holidays) {
    Write-Host "`n🧪 Testing: $holiday" -ForegroundColor Yellow
    
    Set-Date -Date "$holiday 10:00:00"
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/process?password=ERTO" -Method GET
    $json = $response.Content | ConvertFrom-Json
    
    if ($json.message -like "*holiday or weekend*") {
        Write-Host "✅ PASSED: $holiday blocked correctly" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: $holiday NOT blocked!" -ForegroundColor Red
    }
}

# Tarihi geri al
Set-Date -Date $originalDate
Write-Host "`n✅ Tests completed. Date restored." -ForegroundColor Green
```

Çalıştırma:
```powershell
# Yönetici olarak PowerShell açın
.\test-holidays.ps1
```

---

## Production Test (Vercel)

Cron job'ınızı hafta sonu/tatil gününe ayarlayın:

```
# cron-job.org'da
# Execution time: Cumartesi 10:00
```

Log'larda göreceksiniz:
```
⛔ Today is a holiday or weekend (2025-11-15 - Cumartesi). Skipping process.
```

---

## Doğrulama Checklist

Bir tatil gününde:
- [ ] API çağrısı yapıldı
- [ ] Response success: true
- [ ] Message "holiday or weekend" içeriyor
- [ ] stats tümü 0
- [ ] Console'da ⛔ emoji ile log var
- [ ] Hiçbir issue çekilmedi
- [ ] Hiçbir comment gönderilmedi

---

## Hata Durumları

### Yanlış Sistem Saati
Eğer sunucu saati yanlışsa (UTC vs local), tatil kontrolü başarısız olabilir.

**Çözüm:** Sunucu timezone'unu Türkiye'ye ayarlayın.

### 2027 Sonrası
Tatil listesi yoksa sadece hafta sonları kontrol edilir.

**Çözüm:** `config/holidays.ts`'ye yeni yılların tatillerini ekleyin.

---

## Güvenlik Garantisi

✅ **API endpoint'te ilk kontrol** - Hiçbir işlem başlamaz
✅ **CommentService'te double check** - Ekstra güvenlik
✅ **2025-2027 tam liste** - Tüm resmi tatiller
✅ **Hafta sonları her zaman** - 7/24 kontrol
✅ **Status 200 döner** - Cron job başarılı sayar, tekrar denemez

**Sonuç:** Tatil/hafta sonu günlerinde kesinlikle comment gönderilmez! 🔒

