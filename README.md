# 🌸 Flower OMS - Gül Mağazası Sifariş İdarəetmə Sistemi

Peşəkar çiçək mağazaları üçün tam funksional sifariş idarəetmə sistemi.

## ✨ Əsas Xüsusiyyətlər

### 🎯 Rol-əsaslı İdarəetmə
- **Administrator** - Tam sistem nəzarəti, hesabatlar, anbar idarəetməsi
- **Zəng Mərkəzi** - Sifariş yaratma, müştəri xidməti, çatdırılma koordinasiyası
- **Florist** - Sifariş hazırlama, çiçək istifadəsi, şəkil yükləmə

### 📊 Dashboard & Statistika
- Real-vaxt sifariş statistikası
- Günlük/aylıq hesabatlar
- Florist performans izləmə
- Anbar vəziyyəti monitorinqi

### 🔍 Güclü Axtarış & Filtrlər
- Müştəri adı və telefon nömrəsi ilə axtarış
- Status, tarix, vaxt, florist üzrə filtrlər
- Sürətli naviqasiya və məlumat tapma

### 🔔 İstifadəçi Təcrübəsi
- Toast bildirişləri (uğur/xəta/məlumat)
- Yükləmə göstəriciləri
- Təsdiq dialoqları kritik əməliyyatlar üçün
- Mobil-uyğun responsive dizayn
- Müasir kosmik tema

### 📱 Funksionallıq
- Sifariş yaratma və redaktə
- Çiçək anbarı idarəetməsi
- Sifariş şəkilləri yükləmə
- Tarixçə və audit log
- CSV formatında data eksport
- İstifadəçi profili və statistika

## 🚀 Quraşdırma

Ətraflı quraşdırma təlimatları üçün [SETUP.md](./SETUP.md) faylına baxın.

### Sürətli Başlanğıc

```bash
# 1. Asılılıqları quraşdırın
npm install

# 2. .env faylını konfiqurasiya edin
DATABASE_URL="mysql://root:password@localhost:3306/flower_oms"
NEXTAUTH_SECRET="your-secret-key"

# 3. Bazanı hazırlayın
npx prisma generate
npx prisma db push

# 4. Test məlumatları əlavə edin
npx tsx scripts/seed-users.ts
npx tsx scripts/seed-test-orders.ts

# 5. Serveri işə salın
npm run dev-webpack
```

## 🔐 Test Hesabları

| Rol | İstifadəçi | Şifrə |
|-----|-----------|-------|
| Admin | `admin` | `password123` |
| Operator | `operator1` | `password123` |
| Florist | `florist1` | `password123` |

## 🛠️ Texnologiyalar

- **Framework**: Next.js 16.1.1 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Database**: MySQL + Prisma ORM
- **Auth**: NextAuth.js + bcryptjs
- **Real-time**: Socket.io
- **Validation**: Zod
- **Language**: TypeScript

## 📁 Layihə Strukturu

```
flower-oms/
├── src/
│   ├── app/              # Next.js səhifələri və API
│   │   ├── admin/        # Admin paneli
│   │   ├── callcenter/   # Zəng mərkəzi
│   │   ├── florist/      # Florist paneli
│   │   ├── orders/       # Sifariş idarəetməsi
│   │   ├── profile/      # İstifadəçi profili
│   │   └── api/          # API endpoints
│   ├── components/       # Yenidən istifadə olunan komponentlər
│   └── lib/              # Utility funksiyalar
├── prisma/               # Database schema
├── scripts/              # Seed və utility skriptlər
└── public/               # Statik fayllar
```

## 🎨 Dizayn Sistemi

Layihə müasir "Cosmic" teması ilə dizayn edilib:
- Kosmik bənövşəyi və çəhrayı gradient
- Glow effektləri və animasiyalar
- Qaranlıq tema dəstəyi
- Accessibility standartlarına uyğun

## 📝 Əsas Skriptlər

```bash
npm run dev-webpack    # Development server (Turbopack olmadan)
npm run build          # Production build
npm run start          # Production server
npm run lint           # ESLint yoxlama
npx prisma studio      # Database UI
```

## 🔧 Konfiqurasiya

### Environment Variables

```env
DATABASE_URL="mysql://user:pass@host:port/db"
NEXTAUTH_SECRET="random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Prisma

```bash
npx prisma generate    # Client yaratmaq
npx prisma db push     # Schema sinxronlaşdırmaq
npx prisma studio      # UI açmaq
```

## 🐛 Məlum Problemlər

1. **Turbopack Access Denied** - PowerShell-i admin kimi açın və ya `npm run dev-webpack` istifadə edin
2. **Port məşğul** - `Get-Process -Name node | Stop-Process -Force`
3. **Prisma .env oxumur** - Environment variable əl ilə təyin edin

## 🚀 Gələcək Təkmilləşdirmələr

- [ ] SMS bildirişləri
- [ ] Email avtomatlaşdırması
- [ ] Mobil tətbiq
- [ ] Ödəniş inteqrasiyası
- [ ] QR kod sifariş izləmə
- [ ] Çoxdilli dəstək

## 📄 Lisenziya

Bu layihə şəxsi və kommersiya məqsədləri üçün istifadə edilə bilər.

## 🤝 Töhfə

Pull request-lər xoş qarşılanır! Böyük dəyişikliklər üçün əvvəlcə issue açın.

---

**Hazırlanıb ❤️ ilə Azərbaycanda** 🇦🇿
