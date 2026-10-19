# Rubel Telecom

## ওয়েবসাইট ও অ্যাডমিন প্যানেল

- মূল ওয়েবসাইট: https://viralsadmix-sudo.github.io/rubel-telecom-/
- অ্যাডমিন প্যানেল: https://viralsadmix-sudo.github.io/rubel-telecom-/admin.html
- GitHub repository: https://github.com/viralsadmix-sudo/rubel-telecom-

## পরে ওয়েবসাইট আপডেট করার সহজ নিয়ম

1. GitHub-এ repository খুলুন।
2. যে ফাইল বদলাতে হবে সেটি খুলুন (মূল সাইটের জন্য `index.html`, অ্যাডমিন প্যানেলের জন্য `admin.html`)।
3. পেন্সিল **Edit** আইকনে চাপ দিয়ে পরিবর্তন করুন।
4. নিচে **Commit changes** চাপুন।
5. GitHub Actions/Pages কাজ শেষ হলে ওয়েবসাইট আবার খুলুন। প্রয়োজনে ব্রাউজারে Refresh করুন।

## গুরুত্বপূর্ণ: অ্যাডমিন প্যানেলে অনুমতি

Gmail দিয়ে লগইন সফল হলেও যদি `The current user is not authorized to perform the requested action` আসে, সেটি Appwrite Database/Table-এর read permission-এর সমস্যা। শুধু GitHub-এর HTML বদলে এই অনুমতি ঠিক করা যায় না। Appwrite Console-এ সঠিক Table permissions দিতে হবে। নিরাপত্তার জন্য Customer data-কে public read করবেন না; শুধু অনুমোদিত অ্যাডমিন ব্যবহারকারীকে access দিন।

## Appwrite তথ্য

এই প্রজেক্টে আগে থেকে তৈরি Appwrite project ব্যবহার করা হয়। নতুন project বানানোর প্রয়োজন নেই। Project ID, Database ID, Table ID ও Bucket ID বদলাবেন না, যদি না Appwrite-এ সত্যিই নতুন resource তৈরি করেন।


## Android অ্যাপ (APK) তৈরি

এই রিপোজিটরিতে এখন আলাদা Android WebView অ্যাপের সোর্স কোড আছে। অ্যাপটি বর্তমান লাইভ ওয়েবসাইট খুলবে; কাস্টমারের ছবি/ডকুমেন্ট বাছাইয়ের জন্য Android ফাইল পিকার সাপোর্ট যোগ করা হয়েছে। ওয়েবসাইটের কাস্টমার জমা ও AI Prompt-এর মূল কোড আলাদাভাবে পরিবর্তন করা হয়নি।

### APK কোথায় পাবেন

1. GitHub-এ এই repository খুলুন।
2. **Actions** ট্যাবে যান।
3. **Build Rubel Telecom Android APK** workflow বেছে নিন।
4. সবুজ **Run workflow** বোতাম চাপুন; অথবা নতুন Android সোর্স পরিবর্তনের পর workflow স্বয়ংক্রিয়ভাবে চলবে।
5. সফল রান খুলে **Artifacts** থেকে `Rubel-Telecom-Android-APK` ডাউনলোড করুন।
6. ZIP ফাইল খুললে `app-debug.apk` পাবেন। এটি পরীক্ষামূলক APK; Play Store-এ দেওয়ার জন্য আলাদা signed release/AAB ও নীতিমালা যাচাই প্রয়োজন।

**গুরুত্বপূর্ণ:** এই অ্যাপটি ওয়েবসাইটের অনলাইন সংস্করণ ব্যবহার করে, তাই ইন্টারনেট প্রয়োজন। APK workflow প্রথমবার সফল হয়েছে কি না Actions-এ দেখে নিশ্চিত করতে হবে। Play Store প্রকাশের আগে সাইন করা release build, privacy/data-safety বিবরণ, এবং Android-এ বাস্তব পরীক্ষা করতে হবে।
