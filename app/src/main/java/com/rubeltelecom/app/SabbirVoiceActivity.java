package com.rubeltelecom.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.util.ArrayList;
import java.util.Locale;

public class SabbirVoiceActivity extends Activity {
    private static final int MIC_PERMISSION = 7201;
    private static final int SPEECH_REQUEST = 7202;
    private static final String HOME = "https://viralsadmix-sudo.github.io/rubel-telecom-/";
    private TextToSpeech tts;
    private TextView status;
    private final int navy = Color.rgb(6, 17, 38);
    private final int white = Color.rgb(239, 247, 255);
    private final int cyan = Color.rgb(0, 184, 213);

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(7, 21, 47));
        getWindow().setNavigationBarColor(navy);
        tts = new TextToSpeech(this, result -> {
            if (result == TextToSpeech.SUCCESS) {
                int lang = tts.setLanguage(new Locale("bn", "BD"));
                if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(new Locale("bn", "IN"));
                }
            }
        });
        buildScreen();
    }

    private void buildScreen() {
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(navy);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setGravity(Gravity.CENTER_HORIZONTAL);
        page.setPadding(dp(24), dp(36), dp(24), dp(30));

        TextView title = text("🎙️  সাব্বির", 30, white, true);
        title.setGravity(Gravity.CENTER);
        page.addView(title);

        TextView intro = text("তোমার বাংলা ভয়েস সহকারী", 16, cyan, true);
        intro.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams introP = new LinearLayout.LayoutParams(-1, -2);
        introP.topMargin = dp(8);
        page.addView(intro, introP);

        status = text("মাইক্রোফোনে চাপ দিয়ে বাংলায় কথা বলো।", 16, white, false);
        status.setGravity(Gravity.CENTER);
        status.setPadding(dp(12), dp(22), dp(12), dp(22));
        status.setBackground(bg(Color.rgb(13,31,59), dp(18), Color.rgb(36,72,113)));
        LinearLayout.LayoutParams statusP = new LinearLayout.LayoutParams(-1, -2);
        statusP.topMargin = dp(28);
        page.addView(status, statusP);

        TextView mic = text("🎤  কথা বলুন", 18, Color.WHITE, true);
        mic.setGravity(Gravity.CENTER);
        mic.setPadding(dp(18), dp(16), dp(18), dp(16));
        mic.setBackground(bg(cyan, dp(16), cyan));
        mic.setOnClickListener(v -> startListening());
        LinearLayout.LayoutParams micP = new LinearLayout.LayoutParams(-1, -2);
        micP.topMargin = dp(22);
        page.addView(mic, micP);

        TextView help = text("প্রথম সংস্করণে বলতে পারো:\n• ওয়েবসাইট খোলো\n• ছবি জমা দেওয়ার পেজ খোলো\n• AI প্রম্পট খোলো\n• রুবেল টেলিকমে কল করতে চাই", 14, Color.rgb(177,198,224), false);
        help.setLineSpacing(dp(5), 1f);
        LinearLayout.LayoutParams helpP = new LinearLayout.LayoutParams(-1, -2);
        helpP.topMargin = dp(24);
        page.addView(help, helpP);

        TextView back = text("← Rubel Telecom-এ ফিরে যান", 15, cyan, true);
        back.setGravity(Gravity.CENTER);
        back.setPadding(dp(12), dp(18), dp(12), dp(12));
        back.setOnClickListener(v -> finish());
        page.addView(back);
        scroll.addView(page);
        setContentView(scroll);
    }

    private void startListening() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION);
            return;
        }
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "bn-BD");
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "bn-BD");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "সাব্বিরকে বাংলায় বলুন");
            startActivityForResult(intent, SPEECH_REQUEST);
        } catch (ActivityNotFoundException e) {
            reply("এই ফোনে বাংলা ভয়েস শনাক্ত করার সেবা পাওয়া যাচ্ছে না। Google অ্যাপ আপডেট করে আবার চেষ্টা করো।");
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == MIC_PERMISSION) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) startListening();
            else reply("কথা শোনার জন্য মাইক্রোফোনের অনুমতি প্রয়োজন।");
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SPEECH_REQUEST && resultCode == RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) handleCommand(matches.get(0));
        }
    }

    private void handleCommand(String spoken) {
        String s = spoken == null ? "" : spoken.toLowerCase(new Locale("bn", "BD")).trim();
        if (s.contains("ছবি") || s.contains("ডকুমেন্ট") || s.contains("জমা")) {
            reply("ছবি বা ডকুমেন্ট জমা দেওয়ার পেজ খুলছি।");
            openPage(HOME + "customer.html");
        } else if (s.contains("প্রম্পট") || s.contains("এ আই") || s.contains("এআই")) {
            reply("AI প্রম্পটের অংশ খুলছি।");
            openPage(HOME + "#ai");
        } else if (s.contains("কল") || s.contains("ফোন")) {
            reply("রুবেল টেলিকমের নম্বর ডায়ালারে খুলছি। কল করার আগে তুমি নম্বরটি দেখে নাও।");
            try { startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:01784904304"))); }
            catch (ActivityNotFoundException e) { reply("এই ফোনে ডায়ালার খোলা যাচ্ছে না।"); }
        } else if (s.contains("ওয়েবসাইট") || s.contains("ওয়েবসাইট") || s.contains("হোম")) {
            reply("Rubel Telecom ওয়েবসাইট খুলছি।");
            openPage(HOME);
        } else if (s.contains("সময়") || s.contains("সময়")) {
            java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("h:mm a", new Locale("bn", "BD"));
            reply("এখন সময় " + fmt.format(new java.util.Date()) + "।");
        } else {
            reply("তোমার কথা শুনেছি: " + spoken + "। এই কাজটি এখনও আমার মধ্যে যোগ করা হয়নি।");
        }
    }

    private void openPage(String url) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("open_url", url);
        startActivity(intent);
        finish();
    }

    private void reply(String message) {
        status.setText(message);
        if (tts != null) tts.speak(message, TextToSpeech.QUEUE_FLUSH, null, "sabbir_reply");
    }

    private TextView text(String value, float size, int color, boolean bold) {
        TextView v = new TextView(this);
        v.setText(value); v.setTextSize(size); v.setTextColor(color);
        v.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL);
        return v;
    }
    private GradientDrawable bg(int color, int radius, int stroke) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color); d.setCornerRadius(dp(radius)); d.setStroke(dp(1), stroke);
        return d;
    }
    private int dp(int v) { return (int)(v * getResources().getDisplayMetrics().density + 0.5f); }

    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.onDestroy();
    }
}
