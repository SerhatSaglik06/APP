# Test Credentials

## Apple App Store Review Demo Account
- **Email:** reviewer@test.com
- **Password:** TestReview123!
- **Status:** ✅ Oluşturuldu (Local Development Database)

## Local Test Account
- **Email:** test@test.com
- **Password:** test123
- **Status:** ✅ Oluşturuldu

## Important Notes
- ⚠️ **ÖNEMLİ:** Bu hesaplar sadece LOCAL veritabanında oluşturuldu.
- Apple incelemecisi için demo hesabın **CANLI (production) backend'e** kayıt edilmesi gerekiyor.
- Kullanıcının canlı backend URL'sine `POST /api/auth/register` yapması gerekmektedir.
- Hesap silme özelliği profil sayfasından erişilebilir.

## Canlı Backend'e Demo Hesap Oluşturma Komutu
```bash
curl -X POST https://YOUR-PRODUCTION-BACKEND-URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewer@test.com","username":"reviewer","password":"TestReview123!"}'
```
