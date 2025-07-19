# Requirements Document

## Introduction

Bu özellik, multilanguage JSON dosyalarını yönetmek için bir web arayüzü sağlar. Sistem, çeviri anahtarlarını ve karşılık gelen dil çevirilerini görüntüler, eksik çevirileri tespit eder ve AI ile otomatik çeviri yapma imkanı sunar. Amaç, geliştiricilerin dil dosyalarını manuel olarak yönetme yükünü azaltmak ve çeviri sürecini otomatikleştirmektir.

## Requirements

### Requirement 1

**User Story:** Geliştirici olarak, multilanguage JSON dosyamı sisteme yükleyebilmek istiyorum, böylece tüm çeviri anahtarlarını ve mevcut çevirileri tek bir yerde görebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı bir JSON dosyası yüklediğinde THEN sistem dosyayı parse edip çeviri anahtarlarını ve dil karşılıklarını görüntüleyecek
2. WHEN JSON dosyası geçersiz formatta olduğunda THEN sistem kullanıcıya hata mesajı gösterecek
3. WHEN JSON dosyası başarıyla yüklendiğinde THEN sistem desteklenen dilleri otomatik olarak tespit edecek

### Requirement 2

**User Story:** Geliştirici olarak, eksik çevirileri kolayca görebilmek istiyorum, böylece hangi anahtarların hangi dillerde eksik olduğunu hızlıca anlayabilirim.

#### Acceptance Criteria

1. WHEN sistem çeviri dosyasını analiz ettiğinde THEN eksik çevirileri kırmızı veya farklı bir renkte vurgulayacak
2. WHEN kullanıcı "Eksikleri Göster" filtresini aktifleştirdiğinde THEN sadece eksik çevirileri olan anahtarlar görüntülenecek
3. WHEN bir anahtar için bazı dillerde çeviri eksikse THEN eksik olan diller açıkça belirtilecek

### Requirement 3

**User Story:** Geliştirici olarak, eksik çevirileri AI ile otomatik olarak doldurabilmek istiyorum, böylece manuel çeviri yapma zamanımı tasarruf edebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı "Eksikleri Doldur" butonuna tıkladığında THEN sistem AI kullanarak eksik çevirileri otomatik olarak oluşturacak
2. WHEN AI çeviri tamamlandığında THEN kullanıcı değişiklikleri onaylayabilir veya düzenleyebilir
3. WHEN çeviri işlemi başarısız olduğunda THEN sistem kullanıcıya hata mesajı gösterecek

### Requirement 4

**User Story:** Geliştirici olarak, yeni dil ekleyebilmek istiyorum, böylece projeme yeni dil desteği kolayca ekleyebilirim.

#### Acceptance Criteria

1. WHEN kullanıcı "Yeni Dil Ekle" butonuna tıkladığında THEN sistem dil kodu girişi için form gösterecek
2. WHEN yeni dil eklendikinde THEN sistem mevcut tüm anahtarlar için o dilde boş çeviri alanları oluşturacak
3. WHEN yeni dil eklendikten sonra THEN kullanıcı AI ile tüm anahtarları o dile çevirebilecek

### Requirement 5

**User Story:** Geliştirici olarak, düzenlenmiş çeviri dosyasını indirebilmek istiyorum, böylece güncellenmiş JSON dosyasını projemde kullanabilirim.

#### Acceptance Criteria

1. WHEN kullanıcı "İndir" butonuna tıkladığında THEN sistem güncellenmiş JSON dosyasını indirecek
2. WHEN indirme işlemi gerçekleştiğinde THEN dosya orijinal format ve yapıyı koruyacak
3. WHEN dosya indirildiğinde THEN tüm değişiklikler dosyaya yansıtılmış olacak

### Requirement 6

**User Story:** Geliştirici olarak, çeviri anahtarlarını arayabilmek ve filtreleyebilmek istiyorum, böylece büyük dosyalarda istediğim anahtarları hızlıca bulabilirim.

#### Acceptance Criteria

1. WHEN kullanıcı arama kutusuna metin girdiğinde THEN sistem anahtarları ve çeviri değerlerini filtreleyecek
2. WHEN kullanıcı dil filtresini seçtiğinde THEN sadece seçilen dillerdeki çeviriler görüntülenecek
3. WHEN arama sonucu boşsa THEN sistem "Sonuç bulunamadı" mesajı gösterecek