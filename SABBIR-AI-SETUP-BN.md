# Sabbir AI — পরবর্তী সংযোগের ধাপ (বাংলা)

## এখন কী যোগ করা হয়েছে
- `sabbir-ai.html`: আলাদা টেক্সট চ্যাট ও AI ছবি-এডিট ইন্টারফেস।
- মূল `index.html`, কাস্টমার ফটো আপলোড এবং পুরোনো প্রম্পট ফাইল পরিবর্তন করা হয়নি।
- এই পেজটি এখন প্রস্তুতিমূলক UI: এটি স্পষ্টভাবে জানায় AI backend সংযুক্ত নয়; মিথ্যা AI উত্তর দেয় না এবং নির্বাচিত ছবি কোথাও আপলোড করে না।

## গুরুত্বপূর্ণ সীমা
GitHub Pages শুধু static HTML/JS চালায়। Gemini API key-কে HTML/JavaScript-এ রাখলে যে কেউ key চুরি করতে পারে। তাই আসল AI উত্তর ও ছবি এডিট চালাতে একটি নিরাপদ server-side backend লাগবে। Google Drive-এ ফাইল রাখতেও Google OAuth/Apps Script authorization এবং আপনার নিজের Google অ্যাকাউন্ট থেকে অনুমতি প্রয়োজন। এই অনুমতি বাইরে থেকে আপনার হয়ে সম্পন্ন করা যায় না।

## বাস্তব সংযোগের পরিকল্পনা
1. নিরাপদ backend (Appwrite Function বা Google Apps Script Web App) তৈরি করা।
2. Gemini API key backend-এর secret/environment variable-এ রাখা—কখনো public frontend-এ নয়।
3. আলাদা chat database/table তৈরি করা; প্রতিটি visitor-এর session আলাদা এবং admin access server-side-এ যাচাই করা।
4. Google Drive API/OAuth দিয়ে ছবি ও backup ফাইল ব্যক্তিগত Drive folder-এ রাখা।
5. image-editing endpoint-এ নির্বাচিত image + prompt পাঠানো, ফলাফল Drive-এ রাখা।
6. আলাদা test page-এ upload/chat পরীক্ষা করে সফল হলে তবেই মূল homepage-এ link যোগ করা।

## প্রকাশ
এই কাজটি `feature/sabbir-ai-chat-photo` branch-এ রাখা হয়েছে। এটি এখনো `main` branch-এ merge হয়নি এবং live site-এর design পরিবর্তন করেনি। Gemini API key/Google authorization না থাকায় এখনো বাস্তব AI response, image generation/editing বা Drive backup চালু নয়।
