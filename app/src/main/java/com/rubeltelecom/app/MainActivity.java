package com.rubeltelecom.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://viralsadmix-sudo.github.io/rubel-telecom-/";
    private static final String BASE_URL = HOME_URL;
    private static final int FILE_CHOOSER_REQUEST = 4102;

    private final int navy = Color.rgb(6, 17, 38);
    private final int panel = Color.rgb(13, 31, 59);
    private final int blue = Color.rgb(8, 124, 240);
    private final int cyan = Color.rgb(0, 184, 213);
    private final int white = Color.rgb(239, 247, 255);
    private final int muted = Color.rgb(177, 198, 224);

    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> fileCallback;
    private View nativeHome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 21, 47));
        getWindow().setNavigationBarColor(navy);
        buildAppShell();
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
            if (webView.getUrl() != null) showWebView();
            else showNativeHome();
        } else {
            showNativeHome();
        }
    }

    private void buildAppShell() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(navy);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString() + " RubelTelecomAndroid/1.1");
        webView.setBackgroundColor(navy);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUrl(request.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUrl(Uri.parse(url));
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException | SecurityException e) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });

        nativeHome = buildNativeHome();
        root.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));
        root.addView(nativeHome, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgressTintList(android.content.res.ColorStateList.valueOf(cyan));
        progressBar.setBackgroundColor(Color.TRANSPARENT);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP
        );
        root.addView(progressBar, progressParams);
        setContentView(root);
        showNativeHome();
    }

    private View buildNativeHome() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(navy);

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(18), dp(22), dp(18), dp(24));

        LinearLayout brandRow = new LinearLayout(this);
        brandRow.setGravity(Gravity.CENTER_VERTICAL);
        brandRow.setOrientation(LinearLayout.HORIZONTAL);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        brandRow.addView(logo, new LinearLayout.LayoutParams(dp(58), dp(58)));

        LinearLayout brandText = new LinearLayout(this);
        brandText.setOrientation(LinearLayout.VERTICAL);
        brandText.setPadding(dp(12), 0, 0, 0);
        TextView name = text("Rubel Telecom", 23, white, true);
        TextView tagline = text("আপনার বিশ্বস্ত ডিজিটাল সেবা কেন্দ্র", 12, muted, false);
        brandText.addView(name);
        brandText.addView(tagline);
        brandRow.addView(brandText, new LinearLayout.LayoutParams(0, -2, 1));
        page.addView(brandRow);

        LinearLayout hero = new LinearLayout(this);
        hero.setOrientation(LinearLayout.VERTICAL);
        hero.setPadding(dp(20), dp(21), dp(20), dp(20));
        hero.setBackground(roundedGradient(new int[]{Color.rgb(15, 54, 101), Color.rgb(8, 26, 53)}, dp(22), Color.rgb(36, 108, 166)));
        LinearLayout.LayoutParams heroParams = new LinearLayout.LayoutParams(-1, -2);
        heroParams.topMargin = dp(22);
        page.addView(hero, heroParams);

        TextView chip = text("●  RUBEL TELECOM • DIGITAL SERVICES", 10, Color.rgb(151, 239, 255), true);
        hero.addView(chip);
        TextView heading = text("সব ডিজিটাল সেবা\nএখন এক অ্যাপে", 27, white, true);
        heading.setLineSpacing(dp(2), 1.0f);
        LinearLayout.LayoutParams headingParams = new LinearLayout.LayoutParams(-1, -2);
        headingParams.topMargin = dp(12);
        hero.addView(heading, headingParams);
        TextView description = text("ছবি ও ডকুমেন্ট জমা দিন, AI প্রম্পট দেখুন, চাকরি ও দরকারি লিংক খুলুন—সহজেই।", 14, muted, false);
        description.setLineSpacing(dp(3), 1.0f);
        LinearLayout.LayoutParams descParams = new LinearLayout.LayoutParams(-1, -2);
        descParams.topMargin = dp(8);
        hero.addView(description, descParams);
        TextView primary = text("📷   ছবি / ডকুমেন্ট জমা দিন", 15, Color.WHITE, true);
        primary.setGravity(Gravity.CENTER);
        primary.setPadding(dp(12), dp(13), dp(12), dp(13));
        primary.setBackground(roundedGradient(new int[]{blue, cyan}, dp(13), Color.rgb(77, 220, 255)));
        primary.setOnClickListener(v -> openInApp(BASE_URL + "customer.html"));
        LinearLayout.LayoutParams primaryParams = new LinearLayout.LayoutParams(-1, -2);
        primaryParams.topMargin = dp(16);
        hero.addView(primary, primaryParams);

        TextView section = text("আপনার প্রয়োজনীয় সেবা", 19, white, true);
        LinearLayout.LayoutParams sectionParams = new LinearLayout.LayoutParams(-1, -2);
        sectionParams.topMargin = dp(25);
        sectionParams.bottomMargin = dp(12);
        page.addView(section, sectionParams);

        addTileRow(page,
            tile("✨", "AI প্রম্পট", "ছবির জন্য প্রম্পট", BASE_URL + "#ai"),
            tile("🪄", "ফটো HD / Enhance", "ছবি পরিষ্কার করুন", BASE_URL + "#enhance"));
        addTileRow(page,
            tile("💼", "চাকরির খবর", "চাকরি ও আবেদন", BASE_URL + "#jobs"),
            tile("🎬", "মুভি ও সিরিজ", "ভিডিও লিংক", BASE_URL + "#movies"));
        addTileRow(page,
            tile("🏏", "T Sports Live", "ক্রিকেট লাইভ পেজ", BASE_URL + "tsports.html"),
            tile("📲", "APK / অ্যাপ", "অ্যাপ ডাউনলোড", BASE_URL + "#app-download"));
        addTileRow(page,
            tile("🛍️", "দোকানের সেবা", "সেবা ও তথ্য", BASE_URL + "#shop-services"),
            tile("☎️", "যোগাযোগ", "ফোন ও ঠিকানা", BASE_URL + "contact.html"));
        addTileRow(page,
            tile("🔐", "অ্যাডমিন প্যানেল", "মালিকের লগইন", BASE_URL + "admin.html"),
            tile("🌐", "ওয়েবসাইট খুলুন", "সম্পূর্ণ ওয়েবসাইট", BASE_URL + "#home"));

        LinearLayout footer = new LinearLayout(this);
        footer.setOrientation(LinearLayout.VERTICAL);
        footer.setGravity(Gravity.CENTER);
        footer.setPadding(dp(12), dp(18), dp(12), dp(8));
        TextView phone = text("📞 01784904304", 14, Color.rgb(131, 225, 255), true);
        phone.setGravity(Gravity.CENTER);
        footer.addView(phone);
        TextView address = text("Nandina Khondkar Bazar, Gaibandha Sadar, Gaibandha", 11, muted, false);
        address.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams addressParams = new LinearLayout.LayoutParams(-1, -2);
        addressParams.topMargin = dp(5);
        footer.addView(address, addressParams);
        TextView copyright = text("Rubel Telecom • আপনার সেবায়", 11, Color.rgb(115, 143, 180), false);
        copyright.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams copyParams = new LinearLayout.LayoutParams(-1, -2);
        copyParams.topMargin = dp(9);
        footer.addView(copyright, copyParams);
        LinearLayout.LayoutParams footerParams = new LinearLayout.LayoutParams(-1, -2);
        footerParams.topMargin = dp(10);
        page.addView(footer, footerParams);

        scroll.addView(page);
        return scroll;
    }

    private Tile tile(String emoji, String title, String subtitle, String url) {
        return new Tile(emoji, title, subtitle, url);
    }

    private void addTileRow(LinearLayout parent, Tile left, Tile right) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
        rowParams.bottomMargin = dp(10);
        parent.addView(row, rowParams);
        row.addView(makeTile(left), new LinearLayout.LayoutParams(0, dp(112), 1));
        View gap = new View(this);
        row.addView(gap, new LinearLayout.LayoutParams(dp(10), 1));
        row.addView(makeTile(right), new LinearLayout.LayoutParams(0, dp(112), 1));
    }

    private View makeTile(Tile item) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setPadding(dp(14), dp(12), dp(10), dp(12));
        card.setBackground(roundedGradient(new int[]{Color.rgb(17, 43, 78), panel}, dp(17), Color.rgb(36, 72, 113)));
        TextView icon = text(item.emoji, 22, white, true);
        TextView title = text(item.title, 14, white, true);
        TextView subtitle = text(item.subtitle, 11, muted, false);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(-1, -2);
        titleParams.topMargin = dp(5);
        card.addView(icon);
        card.addView(title, titleParams);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(-1, -2);
        subParams.topMargin = dp(2);
        card.addView(subtitle, subParams);
        card.setClickable(true);
        card.setFocusable(true);
        card.setOnClickListener(v -> openInApp(item.url));
        return card;
    }

    private void openInApp(String url) {
        showWebView();
        webView.loadUrl(url);
    }

    private void showWebView() {
        nativeHome.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
    }

    private void showNativeHome() {
        webView.setVisibility(View.GONE);
        nativeHome.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.GONE);
    }

    private boolean routeUrl(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        if ("https".equalsIgnoreCase(scheme) && "viralsadmix-sudo.github.io".equalsIgnoreCase(uri.getHost())) {
            return false;
        }
        if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)
                || "mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) { }
            return true;
        }
        return true;
    }

    private TextView text(String value, float size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL);
        view.setIncludeFontPadding(true);
        return view;
    }

    private GradientDrawable roundedGradient(int[] colors, int radiusDp, int strokeColor) {
        GradientDrawable shape = new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
        shape.setCornerRadius(dp(radiusDp));
        shape.setStroke(dp(1), strokeColor);
        return shape;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && fileCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(results);
            fileCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.getVisibility() == View.VISIBLE) {
            if (webView.canGoBack()) webView.goBack();
            else showNativeHome();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private static class Tile {
        final String emoji, title, subtitle, url;
        Tile(String emoji, String title, String subtitle, String url) {
            this.emoji = emoji;
            this.title = title;
            this.subtitle = subtitle;
            this.url = url;
        }
    }
}
