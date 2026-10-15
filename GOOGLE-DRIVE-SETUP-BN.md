# Rubel Telecom — Google Drive + Google Sheets সেটআপ (বাংলা)

এই ফোল্ডারের ফাইলগুলো নতুন Google Apps Script প্রজেক্টে কপি করতে হবে। GitHub থেকে সরাসরি Google Apps Script প্রকাশ করা যায় না, তাই আপনার Google অ্যাকাউন্টে একবার অনুমতি ও deployment করতে হবে।

## কী হবে
- কাস্টমার পেজে নাম, ফোন, কাজের বিবরণ এবং JPG/PNG/WEBP/PDF ফাইল নেওয়া হবে।
- ফাইল আপনার Google Drive-এর ব্যক্তিগত ফোল্ডারে যাবে।
- রেকর্ড আপনার ব্যক্তিগত Google Sheet-এ থাকবে।
- Sheet এবং Drive folder public করা হবে না।
- প্রতি ফাইল সর্বোচ্চ ৫ MB।

## Android ফোনে সেটআপ
1. Chrome-এ https://script.google.com/ খুলুন এবং আপনার নিজের Google অ্যাকাউন্টে ঢুকুন।
2. New project চাপুন। প্রজেক্টের নাম দিন Rubel Telecom Upload System।
3. ডিফল্ট Code.gs ফাইলের সব লেখা মুছে এই ফোল্ডারের Code.gs-এর সম্পূর্ণ কোড বসান।
4. + চাপুন → HTML নির্বাচন করুন → ফাইলের নাম দিন Index। তারপর Index.html-এর সম্পূর্ণ কোড বসান।
5. Save আইকন চাপুন।
6. ফাংশন তালিকা থেকে setupRubelTelecom নির্বাচন করে Run চাপুন। প্রথমবার Google permission চাইলে আপনার নিজের অ্যাকাউন্টে অনুমতি দিন। কাজ শেষ হলে Execution log-এ Spreadsheet URL দেখুন।
7. Sheet খুলে নিশ্চিত করুন নাম Rubel Telecom Customers এবং ট্যাব Customer Submissions আছে। Sheet বা Drive folder-এ Anyone access দেবেন না।
8. Deploy → New deployment চাপুন। Type gear-এ Web app নির্বাচন করুন।
9. Execute as: Me (আপনি) নির্বাচন করুন। Who has access: Anyone নির্বাচন করুন, যদি এই অপশনটি আপনার অ্যাকাউন্টে পাওয়া যায়। তারপর Deploy চাপুন এবং Google-এর অনুমতি সম্পন্ন করুন।
10. প্রকাশের পর যে URL https://script.google.com/macros/s/.../exec দিয়ে শেষ হয় সেটি কাস্টমারের লিংক। শুধু সেই URL-টাই কাস্টমারকে দিন—Sheet-এর URL নয়।

## খুব জরুরি নিরাপত্তা
- Spreadsheet বা Drive folder কখনো public করবেন না।
- Apps Script-এ Anyone access না থাকলে anonymous customer upload চালু করা যাবে না; তখন যে error দেখায় সেটার screenshot দিন।
- প্রথমে নিজের ফোনে একটি ছোট পরীক্ষামূলক ছবি পাঠিয়ে Sheet-এ রেকর্ড ও Drive-এ ফাইল তৈরি হয়েছে কি না দেখুন। পরীক্ষা সফল না হওয়া পর্যন্ত পুরোনো সাইট মুছবেন না।
- এই সংস্করণে admin panel হিসেবে private Google Sheet ব্যবহার হবে; পুরোনো Appwrite-ভিত্তিক admin.html এখনো নতুন সিস্টেমে সংযুক্ত নয়।
