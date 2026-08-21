# راهنمای اسناد Peppers Operations DEV

این پوشه برای پروژه اپلیکیشن داخلی رستوران Peppers ساخته شده است. هدف آن این است که هم Codex دقیقاً بداند چه چیزی باید بسازد و هم شما بعداً بتوانید بفهمید هر قسمت برای چه کاری ساخته شده است.

## پروژه GitHub بررسی‌شده

- مخزن درست: `MRparchini/core`
- شاخه اصلی: `main`
- فرانت‌اند: `client/core`
- محل اسناد موجود پروژه: `client/core/docs`
- بک‌اند Google Apps Script: `server/appScripts/src`

در مخزن، سرویس‌ها و صفحه‌های `Customers`، `Products` و `Menus` وجود دارند. ورک‌شیت `MenuItems` هدر و داده دارد، اما هنگام بررسی مخزن، سرویس یا صفحه‌ای برای آن پیدا نشد. بنابراین فایل مربوط به MenuItems می‌گوید این ماژول با الگوی سه سرویس موجود ساخته شود و داده‌های فعلی حفظ شوند.

این بررسی فقط مخزن را خوانده است؛ هیچ Commit یا Push روی GitHub انجام نشده است.

## داخل این پوشه چه چیزهایی وجود دارد؟

- `PRD.md`: توضیح کلی محصول، نسخه اول برنامه و نحوه استفاده از خروجی Clover.
- `SHEET-HEADERS-SUMMARY.md`: فهرست سریع تمام ورک‌شیت‌ها و سرستون‌های پیشنهادی.
- `00_SHARED-RULES.md`: قوانین مشترکی که Codex باید در تمام ماژول‌ها رعایت کند.
- `00_MASTER-PROMPT.md`: متن آماده برای دادن به Codex.
- `CLOVER-IMPORT-TASK.md`: دستور فنی ساخت قابلیت واردکردن فایل Inventory خروجی Clover.
- پوشه `worksheets`: برای هر ورک‌شیت یک فایل Markdown جدا دارد.

## فایل Google Sheets بررسی‌شده

نام فایل:

`Peppers Operations DEV`

ورک‌شیت‌های فعلی آن به ترتیب عبارت‌اند از:

1. `Customers`
2. `Products`
3. `ProductVariants`
4. `ModifierGroups`
5. `Modifiers`
6. `ProductModifierGroups`
7. `Menus`
8. `MenuItems`
9. `Orders`
10. `OrderItems`
11. `OrderItemModifiers`
12. `DeliveryRuns`
13. `DeliveryStops`
14. `Payments`
15. `Settings`

در زمان بررسی، فقط `Customers`، `Products`، `Menus` و `MenuItems` دارای هدر یا داده بودند. بقیه ورک‌شیت‌ها هنوز خالی بودند.

## تصمیم مهم درباره ساده نگه‌داشتن پروژه

قرار نیست تمام ورک‌شیت‌ها هم‌زمان تبدیل به ماژول کامل شوند. ترتیب عملی پیشنهادی:

### مرحله 1: اطلاعات پایه

- `Customers`
- `Products`
- `Menus`
- `MenuItems`
- واردکردن فایل Clover

سه ماژول `Customers`، `Products` و `Menus` از قبل در کد پروژه ساخته شده‌اند؛ Codex باید آن‌ها را بررسی و تکمیل کند، نه اینکه بی‌دلیل از نو بنویسد. `MenuItems` باید با همان الگو ساخته شود، بدون اینکه هدرها یا داده‌های فعلی آن از بین بروند.

### مرحله 2: سفارش و تحویل یکشنبه

- `Orders`
- `OrderItems`
- `DeliveryRuns`
- `DeliveryStops`
- `Payments`

این مرحله همان چیزی است که برای ثبت سفارش Delivery و Collection، نمای آشپزخانه، مسیر راننده و جمع‌کردن پول لازم است.

### مرحله 3: انتخاب‌های غذا

- `ModifierGroups`
- `Modifiers`
- `ProductModifierGroups`
- `OrderItemModifiers`

این قسمت برای انتخاب‌هایی مثل نوع سس، نوع نان، Mash، No Gravy و موارد مشابه است.

### فعلاً به تعویق افتاده

- `ProductVariants`

برای نسخه اول، هر آیتم Clover مستقیماً یک Product در نظر گرفته می‌شود؛ حتی اگر نام آن شامل Small یا Large باشد. بعداً، در صورت نیاز، می‌توان Small/Standard/Large را به Variant واقعی تبدیل کرد. این تصمیم عمداً گرفته شده تا نسخه اول بیش از حد پیچیده نشود.

## چگونه این فایل‌ها را در Cursor و Codex استفاده کنم؟

1. پوشه `peppers-operations-dev-docs` را داخل مسیر `client/core/docs` پروژه قرار بده.
2. Cursor را روی ریشه پروژه باز کن؛ همان جایی که پوشه‌های `client` و `server` دیده می‌شوند.
3. در پنجره Codex فقط یک ماژول را در هر نوبت اجرا کن.
4. متن زیر را بده و نام فایل هدف را تغییر بده:

```text
Read these files completely:

1. ./client/core/AGENTS.md
2. ./client/core/docs/peppers-operations-dev-docs/00_SHARED-RULES.md
3. ./client/core/docs/peppers-operations-dev-docs/worksheets/09-Orders.md

Inspect the existing repository first, then implement only the requested module end-to-end. Preserve working code, run relevant checks, review the final diff, and report every changed file and any remaining issue.
```

مثلاً برای `Payments` مسیر فایل هدف را به این تغییر بده:

```text
./client/core/docs/peppers-operations-dev-docs/worksheets/14-Payments.md
```

برای قابلیت واردکردن فایل Clover از این استفاده کن:

```text
Read these files completely:

1. ./client/core/AGENTS.md
2. ./client/core/docs/peppers-operations-dev-docs/00_SHARED-RULES.md
3. ./client/core/docs/peppers-operations-dev-docs/PRD.md
4. ./client/core/docs/peppers-operations-dev-docs/CLOVER-IMPORT-TASK.md

Inspect the repository first, then implement only the Clover inventory import MVP described in these files. Do not implement deferred features. Preserve working services, run relevant checks, review the final diff, and report every changed file and any remaining issue.
```

## چند اصطلاح ساده

| اصطلاح | معنی ساده |
|---|---|
| Worksheet | یک صفحه داخل فایل Google Sheets |
| Header | نام ستون در ردیف اول |
| CRUD | ساختن، خواندن، ویرایش‌کردن و غیرفعال‌کردن اطلاعات |
| Backend | بخشی که اطلاعات را می‌خواند، بررسی می‌کند و در Google Sheets می‌نویسد |
| Frontend | صفحه‌هایی که شما در مرورگر می‌بینید و با آن‌ها کار می‌کنید |
| ID | شناسه یکتا برای پیدا کردن دقیق یک رکورد |
| UUID | نوعی ID طولانی که احتمال تکرارش تقریباً صفر است |
| Foreign Key | ستونی که ID یک رکورد در ورک‌شیت دیگر را نگه می‌دارد |
| Snapshot | ذخیره نسخه همان لحظه؛ مثلاً نام و قیمت غذا در زمان ثبت سفارش |
| Modifier | انتخاب یا تغییر روی غذا؛ مثل No Gravy یا Extra Cheese |
| Pence | واحد پولی بدون اعشار؛ £13.50 برابر `1350` پنس است |
| Soft delete | پاک‌نکردن ردیف و فقط غیرفعال‌کردن آن |
| Import | واردکردن اطلاعات از یک فایل دیگر |
| Idempotent | اگر یک فایل دوباره وارد شد، اطلاعات تکراری نسازد و رکورد قبلی را به‌روزرسانی کند |

## چرا قیمت‌ها به Pence ذخیره می‌شوند؟

اعداد اعشاری در برنامه‌نویسی گاهی خطای محاسباتی ایجاد می‌کنند. به همین دلیل قیمت £13.50 به شکل عدد صحیح `1350` ذخیره می‌شود. هنگام نمایش، برنامه آن را دوباره به `£13.50` تبدیل می‌کند.

## چرا اطلاعات مشتری داخل سفارش دوباره ذخیره می‌شود؟

آدرس یا شماره تلفن مشتری ممکن است بعداً عوض شود. سفارش باید نشان دهد در همان روز دقیقاً به چه نام، شماره و آدرسی ثبت شده بود. به همین دلیل `Orders` علاوه بر `CustomerID`، یک Snapshot از اطلاعات لازم را نگه می‌دارد.

## چرا بعضی ردیف‌ها پاک نمی‌شوند؟

اگر Product یا Menu قبلی پاک شود، سفارش‌های تاریخی ممکن است خراب شوند. بنابراین در بیشتر ماژول‌ها حذف به معنی `IsActive = false` است. اطلاعات قدیمی باقی می‌ماند، اما دیگر در انتخاب‌های جدید نمایش داده نمی‌شود.

## نکته امنیتی

هیچ رمز، API Key، Clover OAuth Token یا اطلاعات کارت بانکی نباید داخل Google Sheets، فایل‌های Markdown یا کد قابل Commit ذخیره شود. این موارد فقط باید در محل امن تنظیمات محیطی یا Script Properties قرار بگیرند.

## چه چیزی در فایل Google Sheets تغییر داده شده است؟

هیچ تغییری توسط این بررسی در فایل Google Sheets انجام نشده است. این اسناد فقط وضعیت فعلی را خوانده‌اند و ساختار پیشنهادی را ثبت کرده‌اند.
