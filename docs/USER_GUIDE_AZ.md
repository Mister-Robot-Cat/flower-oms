# Flower OMS — işçilər üçün təlimat

Bu təlimat mağazanın bütün işçiləri üçündür. Hər rol üçün ayrıca bölmə var. Özünüzə aid bölməni oxuyun.

- [Ümumi: sistemə giriş](#ümumi-sistemə-giriş)
- [Operator (zəng mərkəzi / satıcı)](#operator)
- [Florist](#florist)
- [Administrator](#administrator)
- [Tez-tez verilən suallar](#tez-tez-verilən-suallar)

> Şəkillər kompüter (1280 px) və telefon (390 px) ekranından götürülüb. Sistem hər ikisində işləyir.

---

## Ümumi: sistemə giriş

1. Brauzerdə mağazanın ünvanını açın (məsələn, `https://sifaris.magaza.az`).
2. **İstifadəçi adı** və **şifrə** daxil edin. Onları sizə administrator verir.
3. **Daxil ol** düyməsini basın.

![Giriş](./screens/00-login-390.png)

- Şifrəni bir neçə dəfə səhv yazsanız, sistem bir müddət girişi bağlayır. Bir az gözləyin.
- Şifrəni dəyişmək üçün yuxarıda adınıza basın → **Profil**.
- İşi bitirəndə **Çıxış** düyməsini basın. Bu, xüsusən ortaq kompüterdə vacibdir.

Girişdən sonra **Panel** açılır. Orada sizin rolunuza uyğun bölmələr görünür.

---

## Operator

Operator zəngi qəbul edir, sifarişi yaradır, müştərini tapır, hazır sifarişi kuryerə verir və ya mağazada təhvil verir, ödənişi qəbul edir.

![Operator paneli](./screens/01-operator-dashboard-d.png)

### 1. Müştəri zəng edir: əvvəlcə axtarın

1. Yuxarıdakı menyudan **Sifarişlər** bölməsini açın.
2. Axtarış xanasına müştərinin adını və ya telefonunu yazın, **Axtar** düyməsini basın.
3. Müştərinin bütün məlumatlarını görmək üçün **Müştərilər** bölməsinə keçin. Orada sifariş tarixçəsi və borcu görünür.

![Sifarişlər siyahısı](./screens/02-operator-orders-d.png)
![Müştərilər](./screens/04-operator-customers-d.png)

> 💡 Telefonu `+994…` formatında axtarmaq ən etibarlısıdır. Həmçinin nömrənin son 7 rəqəmi ilə də axtara bilərsiniz.

### 2. Yeni sifariş yaratmaq

1. **Sifarişlər** → **➕ Yeni sifariş**.
2. Xanaları doldurun:
   - **Müştərinin tam adı** və **Telefon nömrəsi**. Telefon avtomatik `+994…` formatına salınır. Bu nömrə ilə müştəri artıq varsa, sifariş onun kartına bağlanır.
   - **Çatdırılma tarixi** və **vaxtı**. Mağazadan götürmədə müştərinin gələcəyi vaxtı yazın.
   - **Sifariş növü**: *Mağazadan götürmə* və ya *Çatdırılma*.
   - **Məbləğ (AZN)**. Vergül də, nöqtə də olar: `85,50` və ya `85.50`.
   - **Ünvan**. Çatdırılma üçün məcburidir.
   - **Qeyd / xüsusi istəklər**. Alıcının adı və telefonu, açıqcanın mətni, rəng istəyi və s.
   - **Şəkillər**. Müştərinin göndərdiyi nümunə şəkil (5-ə qədər). Florist bu şəkilləri görəcək.
3. **Sifarişi yarat** düyməsini basın.

![Yeni sifariş](./screens/06-operator-new-order-filled-d.png)

> ⚠️ Məcburi xana boş qalarsa, sistem sifarişi yaratmır və xəbərdarlıq edir.

### 3. Sifariş kartı

Siyahıda sifariş nömrəsinə (`#4`) basın. Kartda bunlar var:

- sifarişi **redaktə** etmək (tarix, vaxt, məbləğ, ünvan) və **Yenilə** düyməsi;
- **Status**. Siyahıdan seçib **Statusu yenilə** basın;
- **Ödəniş**, **İstifadə olunan çiçəklər**, **Tarixçə** (kim nə vaxt nə edib), **Şəkillər**.

![Sifariş kartı](./screens/07-operator-order-detail-d.png)

### 4. Ödəniş qəbul etmək

Sifariş kartında **Ödəniş** bölməsində yuxarıda **Məbləğ**, **Ödənilib** və **Qalıq** görünür.

| Düymə | Nə vaxt |
|---|---|
| 💵 **Nağd ödəniş (X ₼)** | Müştəri qalığın hamısını nağd ödəyir |
| 💳 **Kart ilə ödəniş (X ₼)** | Qalığın hamısı kartla (POS) |
| 🔀 **Qarışıq / qismən ödəniş** | Bir hissə nağd, bir hissə kart, və ya yalnız beh (avans) |
| 📝 **Borc** | Müştəri sonra ödəyəcək. Qeyddə nə vaxt ödəyəcəyini yazın |

![Qarışıq ödəniş](./screens/21-operator-payment-mixed-d.png)

> ⚠️ **Diqqət:** «Nağd» və «Kart» düymələri bir toxunuşla **bütün qalığı** qeyd edir. Pul əlinizdə olmadan basmayın. Səhv ödənişi yalnız administrator ləğv edə bilər.

Borc sonra ödənildikdə həmin sifarişi açın və nağd və ya kart düyməsi ilə ödənişi qeyd edin.

### 5. Hazır sifarişi göndərmək və bağlamaq

1. Menyuda **Zəng mərkəzi** bölməsini açın.
2. **Hazır sifarişlər** blokunda hər sifariş üçün seçin:
   - **Mağazadan götürmə**: buket mağazada müştərini gözləyir;
   - **Çatdırılma**: buket kuryerə verildi.
3. Müştəri buketi alanda **Yolda / Mağazada gözləyən** blokunda **Tamamlandı** düyməsini basın.

![Zəng mərkəzi](./screens/20-operator-callcenter-d.png)

> ⚠️ **Tamamlandı** basmazdan əvvəl ödənişin tam olduğunu yoxlayın. Qalıq varsa, əvvəlcə ödənişi və ya borcu qeyd edin.

---

## Florist

Florist günün sifarişlərini görür, sifarişi götürür, istifadə etdiyi çiçəkləri qeyd edir, buketin şəklini çəkir və «hazırdır» qeyd edir. Telefonla işləmək çox rahatdır.

### 1. Günün sifarişləri

1. Menyuda **Florist** bölməsini açın.
2. Yuxarıda tarixi seçin. Standart olaraq bu gün seçilir.
3. Kartın rəngi:
   - 🔴 **qırmızı**: yeni, hələ heç kim götürməyib;
   - 🟡 **sarı**: hazırlanır və ya hazırdır;
   - 🟢 **yaşıl**: göndərilib və ya tamamlanıb.
4. Kartda vaxt, növ (🏪 Mağaza / 🚚 Çatdırılma), məbləğ, florist və nümunə şəkil var.

![Florist lövhəsi](./screens/11-florist-board-m.png)

### 2. Sifarişi hazırlamaq

1. Karta basın. Sifarişin bütün məlumatları açılır: tarix, vaxt, müştəri, ünvan, qeyd, nümunə şəkillər.
2. **🛠️ Hazırlamağa başla** düyməsini basın. Sifariş sizin adınıza keçir və başqa florist onu dəyişə bilməz.
3. **🌷 İstifadə olunan çiçəklər**: axtarışda çiçəyi tapın, **+** və **−** ilə miqdarı qeyd edin.
4. **Mütləq «Çiçəkləri yadda saxla» düyməsini basın.** Anbar yalnız bundan sonra azalır.

![Sifarişin hazırlanması](./screens/12-florist-order-m.png)

> ⚠️ **Vacib:** «Çiçəkləri yadda saxla» basmadan **Buket hazırdır** düyməsini bassanız, çiçəklər **yadda qalmır**. Əvvəlcə çiçəkləri saxlayın, sonra statusu dəyişin.
>
> Anbarda kifayət qədər çiçək yoxdursa, sistem xəbərdarlıq edir. Bunu administratora deyin.

### 3. Buketin şəkli

1. Aşağıda **📸 Hazır buketin şəkillərini əlavə et** → **Şəkil seçin**.
2. Telefonda kamera açılır: şəkil çəkin. Bir neçə şəkil də olar (hər biri 10 MB-a qədər).
3. Şəkil **🌸 Hazır buketin şəkilləri** blokunda görünür. Səhv şəkli 🗑️ ilə silin.

### 4. Hazırdır

1. İstəsəniz, **Hazırlıq qeydi** yazın (məsələn, «qırmızı lent əlavə olundu»).
2. **✅ Buket hazırdır** düyməsini basın. Operator sifarişi dərhal «Hazır» siyahısında görür.
3. Sonra lazım olsa:
   - **🚚 Kuryerə verildi** və ya **🏪 Müştəri gözlənilir**;
   - **↩️ Yenidən hazırlanır**, əgər buketi düzəltmək lazımdırsa.

![Hazır buket](./screens/14-florist-ready-m.png)

### 5. Ödəniş (mağazada müştəri gələndə)

**💳 Ödəniş idarə et** düyməsi pəncərə açır. Qaydalar operatordakı kimidir ([Ödəniş qəbul etmək](#4-ödəniş-qəbul-etmək)).

![Florist ödəniş](./screens/15-florist-payment-modal-m.png)

---

## Administrator

Administrator anbarı, işçiləri, hesabatları idarə edir və operator ilə floristin bütün imkanlarına sahibdir.

![Admin paneli](./screens/30-admin-dashboard-d.png)

### 1. Anbar (çiçəklər)

1. Menyu → **Anbar**.
2. **Yeni çiçək**: ad, vahid (*ədəd*, *dəstə*, *qutu*), ehtiyat, aşağı səviyyə, sonra **Əlavə et**.
3. Cədvəldə mövcud çiçəyin ehtiyatını dəyişin və **Yenilə** basın. Hər dəyişiklik tarixçədə saxlanır.
4. **Aşağı səviyyə**: ehtiyat bu rəqəmə düşəndə çiçək sarı rənglə və «Aşağı ehtiyat» nişanı ilə göstərilir.
5. İstifadə olunmayan çiçəyi silməyin, **Aktiv** işarəsini götürün.

![Anbar](./screens/31-admin-stock-d.png)

### 2. İşçilər

1. Menyu → **İstifadəçilər** → **➕ Yeni İstifadəçi**.
2. İstifadəçi adı, ad, rol (*Administrator*, *Operator*, *Florist*) və şifrəni (ən azı 8 simvol) daxil edin.
3. İşdən çıxan işçi üçün **Deaktiv et** düyməsini basın. O, dərhal sistemdən çıxır, amma onun sifariş tarixçəsi qalır.
4. Şifrəni unudan işçi üçün redaktə pəncərəsində yeni şifrə təyin edin.

![İşçilər](./screens/32-admin-users-d.png)

### 3. Hesabatlar və Excel

**Satışlar** bölməsində:

1. **Başlanğıc** və **Son** tarixləri seçin, **Göstər** basın.
2. Sifariş sayı, mağazadan götürmə və çatdırılma, toplam məbləğ, nağd, kart, ödənilməmiş (borc) və günlər üzrə cədvəl görünür.
3. **⬇️ CSV (Excel)** düyməsi faylı yükləyir. Excel-də birbaşa açılır, Azərbaycan hərfləri düzgün görünür.

![Satış hesabatı](./screens/33-admin-sales-d.png)

> ℹ️ Hesabat sifarişlərin **çatdırılma tarixinə** görə hesablanır, ödəniş tarixinə görə yox.

**Performans** bölməsi seçilmiş dövrdə hər floristin neçə buket hazırladığını və neçə çiçək işlətdiyini göstərir.

![Performans](./screens/34-admin-performance-d.png)

### 4. Səhv ödənişi ləğv etmək

Sifariş kartında **Ödəniş tarixçəsi** siyahısında səhv ödənişin yanında **Ləğv et** düyməsini basın. Ləğv tarixçədə kimin etdiyi ilə birlikdə qalır.

---

## Tez-tez verilən suallar

**Sistemə girə bilmirəm.** İstifadəçi adını və şifrəni yoxlayın. Bir neçə səhv cəhddən sonra bir az gözləyin. Hesabınız deaktiv edilibsə, administratora müraciət edin.

**Sifarişi başqa florist götürüb, mən dəyişə bilmirəm.** Bu normaldır: sifariş yalnız onu götürən floristə məxsusdur. Lazım olsa, administrator dəyişə bilər.

**Müştəri ləğv etdi, nə edim?** Hələ «Ləğv edildi» statusu yoxdur. Qeyddə «LƏĞV» yazın və administratora xəbər verin.

**Pulu səhv qeyd etdim.** Administratora deyin. O, ödənişi ləğv edəcək, sonra düzgün ödənişi yenidən qeyd edin.

**Telefonda nəsə ekrana sığmır.** Telefonu üfüqi çevirin və ya kompüterdən istifadə edin, və administratora xəbər verin.
