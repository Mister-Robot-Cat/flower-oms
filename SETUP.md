# Flower OMS - Sistem Quraşdırma Təlimatı

## 📋 Tələblər

- Node.js 20+
- MySQL 8.0+
- npm və ya yarn

## 🚀 Quraşdırma Addımları

### 1. Layihəni yükləyin
```bash
cd flower-oms
```

### 2. Asılılıqları quraşdırın
```bash
npm install
```

### 3. MySQL bazasını yaradın
```sql
CREATE DATABASE IF NOT EXISTS flower_oms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. `.env` faylını konfiqurasiya edin
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/flower_oms"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Prisma bazasını sinxronlaşdırın
```bash
npx prisma generate
npx prisma db push
```

### 6. Test istifadəçilərini yaradın
```bash
npx tsx scripts/seed-users.ts
```

### 7. Test sifarişlərini yaradın (opsional)
```bash
npx tsx scripts/seed-test-orders.ts
```

### 8. Serveri işə salın
```bash
npm run dev-webpack
```

Brauzerdə açın: **http://localhost:3000**

## 👥 İstifadəçi Hesabları

| Rol | İstifadəçi adı | Şifrə | Təsvir |
|-----|----------------|-------|--------|
| **ADMIN** | `admin` | `password123` | Tam sistem idarəetməsi |
| **CALL_CENTER** | `operator1` | `password123` | Zəng mərkəzi operatoru |
| **CALL_CENTER** | `operator2` | `password123` | Zəng mərkəzi operatoru |
| **FLORIST** | `florist1` | `password123` | Florist - sifariş hazırlama |
| **FLORIST** | `florist2` | `password123` | Florist - sifariş hazırlama |

## 🎯 Əsas Funksiyalar

### Admin
- ✅ Bütün sifarişləri idarə etmək
- ✅ Çiçək anbarını idarə etmək
- ✅ İstifadəçiləri idarə etmək
- ✅ Hesabatlar və statistika
- ✅ Sistem parametrləri

### Zəng Mərkəzi Operatoru
- ✅ Yeni sifariş yaratmaq
- ✅ Sifarişləri redaktə etmək
- ✅ Müştəri məlumatlarını idarə etmək
- ✅ Sifariş statusunu dəyişmək
- ✅ Çatdırılma və ya götürmə qərarı vermək

### Florist
- ✅ Təyin edilmiş sifarişləri görmək
- ✅ Sifarişləri hazırlamaq
- ✅ Çiçək istifadəsini qeyd etmək
- ✅ Sifariş şəkillərini yükləmək
- ✅ Hazır sifarişləri təsdiqləmək

## 🔧 Əlavə Skriptlər

```bash
# Bütün istifadəçi şifrələrini yeniləmək
npx tsx scripts/fix-all-passwords.ts

# Giriş testini yoxlamaq
npx tsx scripts/test-login.ts

# Prisma Studio açmaq (verilənlər bazası UI)
npx prisma studio
```

## 📱 Texnologiyalar

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MySQL + Prisma ORM
- **Real-time**: Socket.io
- **Validation**: Zod
- **Authentication**: bcryptjs + JWT

## 🐛 Problemlərin həlli

### Port artıq istifadə olunur
```bash
# Windows-da portu boşaltın
Get-Process -Name node | Stop-Process -Force
```

### Prisma .env oxumur
```bash
# Əl ilə environment variable təyin edin
$env:DATABASE_URL="mysql://root:password@localhost:3306/flower_oms"
npx prisma db push
```

### Turbopack xətası (Access Denied)
```bash
# PowerShell-i Administrator kimi açın və ya
npm run dev-webpack  # Turbopack olmadan işlədir
```

## 📞 Dəstək

Problemlə qarşılaşsanız:
1. `.env` faylının düzgün konfiqurasiya olunduğunu yoxlayın
2. MySQL serverinin işlədiyini yoxlayın
3. `node_modules` və `.next` qovluqlarını silib yenidən quraşdırın

---

**Uğurlar!** 🌸
