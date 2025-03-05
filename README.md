# Bordro Hesaplama Uygulaması

Bu uygulama, babam için hazırladığım 2025 yılı Türkiye vergi sistemine göre çalışan maaş bordro hesaplamalarını kolaylaştıran bir araçtır. Asgari ücret istisnalarını ve gelir vergisi dilimlerini otomatik hesaplar.

## Özellikler

### Temel Özellikler
- **Doğru Maaş Hesaplama**: Saat ücreti, çalışma günü ve izin bilgilerine göre brüt ve net maaş hesaplama
- **Kademeli Vergi Sistemi**: Türkiye'nin 2025 yılı için güncel gelir vergisi dilimlerine göre otomatik vergi hesaplaması
- **Asgari Ücret İstisnaları**: 7194 Sayılı Kanun kapsamında asgari ücret vergi istisnalarının otomatik uygulanması
- **Özel Durumlar**: Emekli çalışan, çocuk yardımı, fazla mesai gibi özel durumları destekleme
- **Detaylı Bordro**: Profesyonel görünümlü, yazdırılabilir bordro çıktısı

### Gelişmiş Özellikler
- **Vergi Dilimi Takibi**: Önceki aylardaki kümülatif gelir matrahını kullanarak vergi dilimlerini doğru hesaplama
- **Detaylı Vergi Açıklamaları**: Her vergi diliminde ne kadar ödeme yapıldığını gösterme
- **İlerleyen Vergi Dilimi Bilgisi**: Bir sonraki vergi dilimine ne kadar kaldığını gösterme
- **Devamsızlık ve İzin Hesaplamaları**: Yıllık izin, ücretsiz izin, hastalık izni ve devamsızlıkları hesaplamaya dahil etme
- **Emekli Çalışan Desteği**: Emekli çalışanlar için özel SGK, işsizlik sigortası ve izin hesaplamaları

## Hesaplanan Kalemler

### Gelir Kalemleri
- Normal çalışma ücreti
- Yıllık izin ücreti
- Hafta sonu çalışma ücreti
- Fazla mesai (2x ücret)
- Gece çalışma tazminatı (%10)
- İkramiye (75 saat)
- Çocuk yardımı
- Yakacak yardımı
- Özel sağlık yardımı

### Kesinti Kalemleri
- SGK işçi payı (%14 normal çalışan, %7 emekli çalışan)
- İşsizlik sigortası işçi payı (%1 normal çalışan, %0 emekli çalışan)
- Gelir vergisi (kademeli vergi sistemine göre)
- Asgari ücret gelir vergisi istisnası (7194 S.K.)
- Damga vergisi (%0.759, brüt asgari ücret istisnalı)
- Sendika aidatı (isteğe bağlı)
- Avans kesintisi

## Vergi Dilimleri (2025 Yılı)
- 0 TL - 158.000 TL arası: %15
- 158.000 TL - 330.000 TL arası: %20
- 330.000 TL - 1.200.000 TL arası: %27
- 1.200.000 TL - 4.300.000 TL arası: %35
- 4.300.000 TL üzeri: %40

## Nasıl Kullanılır

1. Çalışan bilgilerini girin (ad-soyad, emeklilik durumu, dönem)
2. Ücret bilgilerini girin (saat ücreti, çalışma günü, hafta sonu çalışması, gece vardiyası, vergi oranı)
3. Vergi bilgilerini girin (önceki aylardaki kümülatif gelir vergisi matrahı)
4. İzin ve devamsızlık bilgilerini girin (yıllık izin, ücretsiz izin, devamsızlık, hastalık izni)
5. Varsa avans, çocuk yardımı ve fazla mesai bilgilerini girin
6. İsterseniz gelişmiş ayarları özelleştirin
7. "Maaş Bordrosu Hesapla" düğmesine tıklayın
8. Sonuçları görüntüleyin ve isterseniz yazdırın

## Teknik Bilgiler

- Tamamen tarayıcı tabanlı, internet bağlantısı gerektirmeyen uygulama
- JavaScript, HTML ve CSS ile geliştirilmiş
- Mobil cihazlarda da uyumlu tasarım
- Basit bir dosya yapısı ile kolaylıkla taşınabilir veya paylaşılabilir

## Sık Sorulan Sorular

**S: Uygulama verilerimi kaydediyor mu?**
C: Hayır, tüm hesaplamalar tarayıcınızda yapılır ve hiçbir veri uzak sunucularda saklanmaz.

**S: Gelir vergisi istisnaları nasıl hesaplanır?**
C: 7194 Sayılı Kanun uyarınca asgari ücrete denk gelen gelir vergisi tutarı hesaplanıp asıl gelir vergisinden düşülür.

**S: Emekli çalışan hesaplamalarında fark nedir?**
C: Emekli çalışanlar için SGK işçi payı %7'dir, işsizlik sigortası kesilmez ve yıllık izin dışındaki tüm devamsızlıklar ücretsiz izin olarak değerlendirilir.

---

*Bu uygulama, 2025 yılı Türkiye vergi mevzuatına göre geliştirilmiştir. Resmi bordro hesaplamalarınızda muhasebe departmanınıza danışmanız önerilir.*