# Rubel Telecom — Google Drive backup (বাংলা)

## লক্ষ্য
Appwrite আগের মতোই থাকবে। এই Apps Script একটি ব্যক্তিগত Google Drive ফোল্ডারে অনুমোদিত JSON backup ফাইল সংরক্ষণের receiver। এটি নিজে থেকে Appwrite-এর পুরোনো ডেটা পড়ে না, কোনো ফটো-আপলোড ফিচার পরিবর্তন করে না এবং নিজে থেকে scheduled backup চালায় না।

## ১) Google Drive-এ ফোল্ডার তৈরি
1. নিজের Google Drive-এ একটি নতুন ফোল্ডার তৈরি করুন, যেমন `Rubel Telecom Backups`।
2. ফোল্ডারটি Private রাখুন; “Anyone with the link” করবেন না।
3. ফোল্ডারের URL থেকে folder ID কপি করুন (URL-এর `/folders/`-এর পরের অংশ)।

## ২) Apps Script তৈরি
1. `https://script.google.com` খুলুন এবং New project চাপুন।
2. এই ফোল্ডারের `Code.gs`-এর সম্পূর্ণ কোড Apps Script-এর editor-এ বসান।
3. Project Settings → Script Properties-এ দুটি property যোগ করুন:
   - `DRIVE_FOLDER_ID` = আপনার Drive ফোল্ডারের ID
   - `BACKUP_TOKEN` = দীর্ঘ, অনুমান করা কঠিন গোপন token
4. Deploy → New deployment → Web app।
5. Execute as: **Me**। Who has access: **Anyone** নির্বাচন করলে URL-টি প্রকাশ্য endpoint হয়; তাই token অবশ্যই গোপন রাখতে হবে। প্রতিষ্ঠানের Workspace-এ বিকল্প access policy থাকলে সেটি ব্যবহার করুন।
6. Google অনুমতি চাইলে নিজের অ্যাকাউন্টে Drive access অনুমোদন করুন। Web app URL কপি করুন। URL-এ `/exec` থাকা deployment URL ব্যবহার করুন।

## ৩) নিরাপত্তা
- `BACKUP_TOKEN` HTML, GitHub Pages, APK, query string, screenshot বা chat-এ দেবেন না।
- কেবল server-side Appwrite Function-এর secret variable-এ token রাখা হবে।
- এই receiver সর্বোচ্চ প্রায় 900 KB JSON payload গ্রহণ করে। বড় ছবি সরাসরি এই JSON receiver-এ পাঠাবেন না; ছবির backup-এর জন্য Appwrite Storage থেকে ফাইল আলাদা করে স্থানান্তর করতে হবে।
- Google Drive-এ থাকা ফাইলগুলোকে অন্য গ্রাহকের কাছে public করবেন না।
- API key, password, session token বা অন্য অপ্রয়োজনীয় secret backup payload-এ দেবেন না।

## ৪) টেস্ট (শুধু manual-test)
Apps Script web app URL-এ POST করে JSON পাঠানো যায়। উদাহরণ:
```json
{
  "token": "YOUR_BACKUP_TOKEN",
  "backupType": "manual-test",
  "data": {
    "message": "Rubel Telecom backup test",
    "testOnly": true
  }
}
```
এটি শুধু receiver-এ একটি পরীক্ষামূলক JSON ফাইল তৈরি করে। প্রকৃত customer chat/photo data backup হয়েছে—এমন অর্থ নয়।

## ৫) Appwrite-এর সঙ্গে প্রকৃত সংযোগ (পরবর্তী ধাপ)
1. Appwrite-এ একটি **আলাদা** backup Function তৈরি/ব্যবহার করতে হবে; চলমান `rubel-telecom-ai` Function বা customer upload কোডকে অন্ধভাবে overwrite করবেন না।
2. Function Variables/Secrets-এ `DRIVE_BACKUP_URL` (Apps Script /exec URL) এবং `DRIVE_BACKUP_TOKEN` যোগ করুন।
3. Function-কে server-side থেকে নির্দিষ্ট Appwrite TablesDB data এবং Storage file metadata পড়ার অনুমতি দিন; এর জন্য scoped Appwrite API key বা উপযুক্ত server-side permissions দরকার।
4. আগে নিশ্চিত করতে হবে customer submissions কোন table/collection-এ লেখা হয় এবং storage file IDs কীভাবে সেই records-এর সঙ্গে যুক্ত। এই schema যাচাই না করে auto-backup চালু করা হবে না।
5. প্রথমে শুধু `manual-test` দিয়ে পরীক্ষা করুন; পরে allowlisted table data backup, এরপর file bytes backup, এবং সবশেষে schedule/restore test যোগ করুন।

এই ফোল্ডারে থাকা কোড নিরাপদ receiver-এর প্রাথমিক অংশ। এটি এখনো Appwrite থেকে স্বয়ংক্রিয় export করে না। বর্তমান customer photo upload, prompt feature বা live site code-এ কোনো পরিবর্তন প্রয়োজন নেই এই receiver deploy করার জন্য।
