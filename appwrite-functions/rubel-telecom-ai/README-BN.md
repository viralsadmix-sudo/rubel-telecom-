# Sabbir AI — Appwrite chat backend (বাংলা)

এই ফোল্ডারটি Rubel Telecom-এর `sabbir-ai.html` পেজের জন্য নিরাপদ server-side chat proxy। AI provider key কখনো HTML/JavaScript-এ রাখা হয় না।

## এই কোড কী করে
- OpenRouter API-কে আগে চেষ্টা করে; ব্যর্থ হলে Gemini API-তে fallback করে (দুই key-ই সেট করা থাকলে)।
- key server-side Appwrite Function Variables থেকে পড়ে।
- প্রশ্ন ও সাম্প্রতিক চ্যাটের সীমিত context পাঠায়।
- customer chat স্থায়ীভাবে database-এ লেখে না।
- ছবি এডিট/জেনারেশন এই function-এ এখনো যুক্ত নয়।

## Appwrite Function সেটআপ
আগের Function ID `6ad3b30f00177c07dd71` / নাম `rubel-telecom-ai` থাকলে সেটির নতুন deployment হিসেবে এই কোড ব্যবহার করুন। আগে Function-এর বর্তমান deployment/variables দেখে নিন; অন্য ফিচার ব্যবহার করলে যাচাই না করে সেটি overwrite করবেন না।

1. Appwrite Console → **Rubel Telecom app** → **Functions** → `rubel-telecom-ai`।
2. Git repository connection ব্যবহার করলে repository `viralsadmix-sudo/rubel-telecom-`, branch `main`, root/folder `appwrite-functions/rubel-telecom-ai` নির্বাচন করুন; entrypoint `src/main.js` এবং Node.js runtime বাছুন। যদি console folder/path সেট করতে না দেয়, এই ফোল্ডারের ফাইলগুলো Appwrite-এর function source upload/deployment পদ্ধতিতে deploy করুন।
3. Function Variables/Secrets-এ **একটি** provider key যোগ করুন:
   - `OPENROUTER_API_KEY` — তোমার OpenRouter key; অথবা
   - `GEMINI_API_KEY` — Google AI Studio API key।
   ঐচ্ছিক: `OPENROUTER_MODEL` (default `openrouter/free`), `GEMINI_MODEL` (default `gemini-2.5-flash`)।
4. Deploy করুন। Function-এর public invocation permission/URL যেন browser থেকে POST নিতে পারে তা সেট করুন। যেহেতু এটি public customer page, provider-এর usage limit/budget সেট করুন এবং Appwrite-এর abuse/rate-limit protections ব্যবহার করুন।
5. Function-এর URL অবশ্যই এই URL-এর সঙ্গে মেলাতে হবে যা পেজে সেট করা আছে: `https://starter-function-bs1o.nyc.appwrite.run`। Function-এর URL আলাদা হলে `sabbir-ai.html`-এর `AI_FUNCTION_URL` বদলাতে হবে।
6. Live পেজে একটি সহজ প্রশ্ন পাঠিয়ে উত্তর পরীক্ষা করুন। Function logs-এ API key বা পুরো chat text লগ করবেন না।

## নিরাপত্তা ও সীমাবদ্ধতা
- Android অ্যাপে সেভ করা API key ফোনের private storage-এ থাকে; website সেটি পড়তে পারে না। তাই Appwrite Function-এর Variables-এ server-side key সেট করতে হবে।
- GitHub Pages static; এখানে secret রাখা যাবে না।
- এই chat function শুধু text answer দেয়। ছবি এডিট/জেনারেশন, Google Drive backup এবং ব্যক্তিগত chat history database আলাদা কাজ—এগুলোকে এই deployment সম্পন্ন হয়েছে বলে ধরে নেবেন না।
