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
