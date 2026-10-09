# Layan Khalil Ibrahim, website

Static site. No build step.

```
index.html
assets/
  css/styles.css
  js/main.js
  images/   hero, project, capability and about images (WebP)
```

Run locally from this folder with any static server, for example `python3 -m http.server 8000`, then open http://localhost:8000.

Three.js (r128) and GSAP 3.13 load from public CDNs. To self-host them, download the files into `assets/js/vendor/` and update the three script tags at the bottom of `index.html`.

To replace an image, overwrite the file in `assets/images/` with one of the same name.
