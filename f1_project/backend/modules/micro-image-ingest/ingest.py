import requests

def send_images(bucket, images, folder=""):
    images = [{"url": img} if isinstance(img, str) else img for img in images]

    payload = {"bucket_name": bucket, "images": images}
    if folder:
        payload["folder"] = folder

    respuesta = requests.post(
        "http://localhost:8081/ingest/images",
        json=payload,
    )
    print(respuesta.status_code, respuesta.text)