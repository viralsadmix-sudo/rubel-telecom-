import os
import tempfile
import urllib.request
from pathlib import Path

import gradio as gr
import numpy as np
import torch
from PIL import Image

from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

MODEL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/RealESRGAN_x4plus.pth"
MODEL_PATH = Path("/tmp/RealESRGAN_x4plus.pth")
upsampler = None


def get_upsampler():
    global upsampler
    if upsampler is not None:
        return upsampler
    if not MODEL_PATH.exists():
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    model = RRDBNet(
        num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23,
        num_grow_ch=32, scale=4
    )
    use_gpu = torch.cuda.is_available()
    upsampler = RealESRGANer(
        scale=4, model_path=str(MODEL_PATH), model=model,
        tile=256 if use_gpu else 128, tile_pad=10, pre_pad=0,
        half=use_gpu
    )
    return upsampler


def enhance_image(image):
    if image is None:
        raise gr.Error("আগে একটি ছবি বেছে নিন।")
    if image.width * image.height > 16_000_000:
        raise gr.Error("ছবিটি অনেক বড়। ১৬ মেগাপিক্সেলের মধ্যে ছবি ব্যবহার করুন।")
    rgb = image.convert("RGB")
    try:
        engine = get_upsampler()
        output, _ = engine.enhance(np.array(rgb), outscale=4)
        return Image.fromarray(output)
    except Exception as exc:
        raise gr.Error("AI ছবি উন্নত করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।") from exc


with gr.Blocks(title="Rubel Telecom AI Photo Enhancer") as demo:
    gr.Markdown(
        "# Rubel Telecom — AI ছবি পরিষ্কার করুন\n"
        "ছবি আপলোড করুন। Real-ESRGAN ছবির রেজোলিউশন বাড়িয়ে উন্নত করার চেষ্টা করবে। "
        "ফ্রি সার্ভারে অপেক্ষা বা ব্যবহারের সীমা থাকতে পারে।"
    )
    source = gr.Image(type="pil", label="মূল ছবি", image_mode="RGB")
    run = gr.Button("✨ AI দিয়ে ছবি উন্নত করুন", variant="primary")
    result = gr.Image(type="pil", label="উন্নত ছবি")
    run.click(enhance_image, inputs=source, outputs=result)
    gr.Markdown("**গোপনীয়তা:** ছবি এই AI Space-এ প্রসেসিংয়ের জন্য পাঠানো হয়। সংবেদনশীল ছবি আপলোড করবেন না।")


if __name__ == "__main__":
    demo.queue(max_size=2).launch()
