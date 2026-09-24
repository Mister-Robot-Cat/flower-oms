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
- CSV (Excel) formatında data eksport
- Ödənişlər: nağd, kart, qarışıq, borc
- İstifadəçi profili və statistika

## 🚀 Quraşdırma

Ətraflı quraşdırma təlimatları üçün [SETUP.md](./SETUP.md) faylına baxın.

### Sürətli Başlanğıc

```bash
npm install                       # asılılıqlar + Prisma client
cp .env.example .env              # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run db:migrate                # cədvəlləri yarat
npm run db:admin -- admin "Admin" # ilk administrator (şifrə ekranda göstərilir)
npm run dev
```

## 🔐 Hesablar

Standart şifrələr **yoxdur**. İlk administratoru `npm run db:admin` yaradır, qalan istifadəçiləri admin
"İstifadəçilər" bölməsindən əlavə edir. Yerli test üçün `npm run db:seed-demo` demo istifadəçilər yaradır.

## 🛡️ Təhlükəsizlik

- Şəkillər `uploads/` qovluğunda saxlanılır və yalnız daxil olmuş işçilərə API vasitəsilə göstərilir
- Yalnız həqiqi JPG/PNG/WEBP/GIF faylları qəbul olunur (faylın məzmunu yoxlanılır)
- Deaktiv edilmiş istifadəçi dərhal sistemdən çıxarılır
- Florist yalnız özünə təyin edilmiş sifarişlər üzərində işləyə bilər
- Girişdə şifrə sınaqlarına limit, təhlükəsiz yönləndirmə, təhlükəsizlik başlıqları

## 🛠️ Texnologiyalar

- **Framework**: Next.js 16.1.1 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Database**: MySQL / MariaDB + Prisma ORM (driver adapter, native binary olmadan)
- **Auth**: NextAuth.js + bcryptjs
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
npm run dev                 # Development server
npm run build && npm start  # Production
npm run typecheck           # TypeScript yoxlaması
npm run lint                # ESLint
npm run db:migrate          # Miqrasiyalar
npm run db:admin            # Admin yarat / şifrəni sıfırla
npm run db:link-customers   # Köhnə sifarişləri müştərilərə bağla (yeniləmədən sonra bir dəfə)
npx prisma studio           # Database UI
```

Ətraflı quraşdırma və köhnə versiyadan yeniləmə: [SETUP.md](./SETUP.md).

## 🚀 Gələcək Təkmilləşdirmələr

- [ ] SMS bildirişləri
- [ ] Email avtomatlaşdırması
- [ ] Mobil tətbiq
- [x] Ödənişlərin qeydiyyatı (nağd / kart / qarışıq / borc)
- [ ] Onlayn ödəniş inteqrasiyası
- [ ] WhatsApp bildirişləri
- [ ] QR kod sifariş izləmə
- [ ] Çoxdilli dəstək

## 📄 Lisenziya

Bu layihə şəxsi və kommersiya məqsədləri üçün istifadə edilə bilər.

## 🤝 Töhfə

Pull request-lər xoş qarşılanır! Böyük dəyişikliklər üçün əvvəlcə issue açın.

---

**Hazırlanıb ❤️ ilə Azərbaycanda** 🇦🇿
