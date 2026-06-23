# Local Web App

This folder contains the local web app for the crash severity prediction demo.

## Run

```bash
pip install -r requirements.txt
python server.py
```

Open the localhost URL printed in the terminal. The default port is `8090`.

## Files

- `index.html` — web page entry point.
- `assets/css/styles.css` — page styling.
- `assets/js/app.js` — front-end interaction logic.
- `server.py` — local server and prediction API.
- `requirements.txt` — Python packages required for the local server.
- `M5/model_outputs/` and `data/processed/M5/` — saved model files and metadata used by the local predictor.
