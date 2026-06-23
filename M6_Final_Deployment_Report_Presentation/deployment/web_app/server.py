#!/usr/bin/env python3
"""Local server for the traffic accident severity dashboard.

Run:
    python server.py

The dashboard works in two modes:
1. Local model mode when the saved model files are available:
   - M5/model_outputs/ft_transformer_model.pt
   - M5/model_outputs/ft_numeric_scaler.joblib
   - M5/model_outputs/ft_category_maps.json
   - M5/model_outputs/training_summary.json
   - data/processed/M5/preprocessing_metadata.json
2. Demo mode when those files are missing. Demo mode is clearly reported in the UI.
"""

from __future__ import annotations

import json
import math
import mimetypes
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import socket
from pathlib import Path
from typing import Any

PORT = 8090
HERE = Path(__file__).resolve().parent


def find_project_root() -> Path | None:
    """Search upward and nearby for the expected project artifact structure."""
    starts = [Path.cwd().resolve(), HERE]
    checked: list[Path] = []
    for start in starts:
        for candidate in [start, *start.parents]:
            if candidate in checked:
                continue
            checked.append(candidate)
            model_path = candidate / "M5" / "model_outputs" / "ft_transformer_model.pt"
            metadata_path = candidate / "data" / "processed" / "M5" / "preprocessing_metadata.json"
            if model_path.exists() and metadata_path.exists():
                return candidate
    return None


class DemoPredictor:
    """Transparent browser/server fallback used when model files are unavailable."""

    demo_mode = True
    model_name = "Server demo heuristic"

    def status(self) -> dict[str, Any]:
        return {
            "demo_mode": True,
            "model": self.model_name,
            "message": (
                "Saved FT-Transformer files were not found. "
                "Predictions are illustrative until model_outputs and preprocessing metadata are available."
            ),
        }

    @staticmethod
    def _add(risk: float, points: float) -> float:
        return min(10.0, risk + points)

    def predict(self, record: dict[str, Any]) -> dict[str, Any]:
        risk = 1.8
        reasons: list[str] = []

        def add(points: float, reason: str) -> None:
            nonlocal risk
            risk = self._add(risk, points)
            reasons.append(reason)

        num_units = float(record.get("num_units") or 0)
        hour = int(record.get("crash_hour") or 12)
        day = int(record.get("crash_day_of_week") or 4)
        crash_type = str(record.get("first_crash_type", "")).upper()
        weather = str(record.get("weather_condition", "")).upper()
        surface = str(record.get("roadway_surface_cond", "")).upper()
        lighting = str(record.get("lighting_condition", "")).upper()
        cause = str(record.get("prim_contributory_cause", "")).upper()

        if num_units >= 3:
            add(1.1, "multi-unit crash")
        if num_units >= 5:
            add(1.4, "high number of involved units")
        if crash_type in {"PEDESTRIAN", "PEDALCYCLIST", "HEAD ON"}:
            add(2.2, "vulnerable road user or high-impact crash type")
        if crash_type in {"FIXED OBJECT", "ANGLE"}:
            add(0.9, "crash type associated with higher injury risk")
        if weather in {"RAIN", "SNOW", "FOG/SMOKE/HAZE"}:
            add(0.9, "adverse weather")
        if surface in {"WET", "ICE", "SNOW OR SLUSH"}:
            add(0.9, "reduced road friction")
        if "DARKNESS" in lighting:
            add(0.8, "dark lighting conditions")
        if cause in {
            "UNDER THE INFLUENCE OF ALCOHOL/DRUGS",
            "EXCEEDING AUTHORIZED SPEED LIMIT",
            "DISREGARDING TRAFFIC SIGNALS",
            "PHYSICAL CONDITION OF DRIVER",
        }:
            add(1.4, "high-risk contributory cause")
        if str(record.get("intersection_related_i", "N")).upper() == "Y":
            add(0.4, "intersection involvement")
        if hour <= 5 or hour >= 21:
            add(0.5, "late-night / low-light time window")
        if day in {1, 7}:
            add(0.3, "weekend pattern")

        severe = max(0.015, min(0.52, 0.015 + max(0.0, risk - 4.0) * 0.075))
        minor = max(0.12, min(0.62, 0.18 + risk * 0.045 - severe * 0.15))
        no_injury = max(0.05, 1.0 - minor - severe)
        total = no_injury + minor + severe
        probabilities = {
            "NO_INJURY": no_injury / total,
            "MINOR_INJURY": minor / total,
            "SEVERE_INJURY": severe / total,
        }
        predicted_label = max(probabilities, key=probabilities.get)
        return {
            "predicted_label": predicted_label,
            "confidence": probabilities[predicted_label],
            "probabilities": probabilities,
            "model": self.model_name,
            "demo_mode": True,
            "risk_score": round(risk, 2),
            "reasons": reasons[:4],
        }


class RealPredictor:
    """FT-Transformer inference wrapper for the prediction form."""

    demo_mode = False

    def __init__(self, project_root: Path):
        import joblib  # type: ignore
        import numpy as np  # type: ignore
        import pandas as pd  # type: ignore
        import torch  # type: ignore
        import torch.nn as nn  # type: ignore

        self.np = np
        self.pd = pd
        self.torch = torch
        self.nn = nn
        self.project_root = project_root
        self.data_dir = project_root / "data" / "processed" / "M5"
        self.model_dir = project_root / "M5" / "model_outputs"

        with (self.data_dir / "preprocessing_metadata.json").open(encoding="utf-8") as file:
            self.meta = json.load(file)
        with (self.model_dir / "training_summary.json").open(encoding="utf-8") as file:
            self.training_summary = json.load(file)
        with (self.model_dir / "ft_category_maps.json").open(encoding="utf-8") as file:
            self.category_maps = json.load(file)

        self.numeric_scaler = joblib.load(self.model_dir / "ft_numeric_scaler.joblib")
        self.selected_model = self.training_summary["selected_model"]
        if not str(self.selected_model).startswith("FT-Transformer"):
            raise RuntimeError(f"Saved winner is {self.selected_model!r}, not FT-Transformer.")

        self.cat_cols = self.meta["categorical_features"]
        self.num_cols = self.meta["numeric_features"]
        self.base_num_cols = ["num_units", "crash_hour", "crash_day_of_week", "crash_month"]
        self.input_features = self.cat_cols + self.base_num_cols
        self.numeric_medians = self.meta["numeric_medians_from_train"]
        self.rare_categories = {
            column: set(values)
            for column, values in self.meta["rare_categories_from_train"].items()
        }
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()

    def _load_model(self) -> None:
        torch = self.torch
        nn = self.nn

        class NumericalTokenizer(nn.Module):
            def __init__(self, n_features: int, d_token: int):
                super().__init__()
                self.weight = nn.Parameter(torch.empty(n_features, d_token))
                self.bias = nn.Parameter(torch.empty(n_features, d_token))
                nn.init.xavier_uniform_(self.weight)
                nn.init.zeros_(self.bias)

            def forward(self, values):
                return values.unsqueeze(-1) * self.weight.unsqueeze(0) + self.bias.unsqueeze(0)

        class FTTransformer(nn.Module):
            def __init__(self, category_sizes, n_numeric, n_classes, d_token=64, n_heads=8, n_layers=3, dropout=0.15):
                super().__init__()
                self.category_embeddings = nn.ModuleList([
                    nn.Embedding(size, d_token) for size in category_sizes
                ])
                self.numeric_tokenizer = NumericalTokenizer(n_numeric, d_token)
                self.cls_token = nn.Parameter(torch.zeros(1, 1, d_token))
                nn.init.normal_(self.cls_token, std=0.02)
                layer = nn.TransformerEncoderLayer(
                    d_model=d_token,
                    nhead=n_heads,
                    dim_feedforward=d_token * 4,
                    dropout=dropout,
                    activation="gelu",
                    batch_first=True,
                    norm_first=True,
                )
                self.transformer = nn.TransformerEncoder(layer, num_layers=n_layers)
                self.head = nn.Sequential(
                    nn.LayerNorm(d_token),
                    nn.Linear(d_token, d_token * 2),
                    nn.GELU(),
                    nn.Dropout(dropout),
                    nn.Linear(d_token * 2, n_classes),
                )

            def forward(self, categorical, numeric):
                categorical_tokens = torch.stack([
                    embedding(categorical[:, index])
                    for index, embedding in enumerate(self.category_embeddings)
                ], dim=1)
                numeric_tokens = self.numeric_tokenizer(numeric)
                cls = self.cls_token.expand(categorical.size(0), -1, -1)
                tokens = torch.cat([cls, categorical_tokens, numeric_tokens], dim=1)
                encoded = self.transformer(tokens)
                return self.head(encoded[:, 0])

        model_path = self.model_dir / "ft_transformer_model.pt"
        try:
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)
        except TypeError:
            checkpoint = torch.load(model_path, map_location=self.device)

        self.target_mapping = checkpoint["target_mapping"]
        self.id_to_label = {int(class_id): label for label, class_id in self.target_mapping.items()}
        self.model = FTTransformer(
            category_sizes=checkpoint["category_sizes"],
            n_numeric=len(checkpoint["numeric_features"]),
            n_classes=len(self.target_mapping),
            d_token=checkpoint["d_token"],
            n_heads=checkpoint["n_heads"],
            n_layers=checkpoint["n_layers"],
            dropout=checkpoint["dropout"],
        ).to(self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()
        self.use_calibration = str(self.selected_model).endswith("calibrated")
        self.probability_multipliers = self.np.asarray(
            self.training_summary["selected_tuning"]["FT-Transformer"]["probability_multipliers"],
            dtype=self.np.float64,
        )

    def status(self) -> dict[str, Any]:
        return {
            "demo_mode": False,
            "model": self.selected_model,
            "message": f"Loaded {self.selected_model} from {self.model_dir} on {self.device}.",
        }

    def get_input_schema(self) -> dict[str, Any]:
        """Return the exact model input schema used by the saved FT-Transformer."""
        fields: list[dict[str, Any]] = []
        for column in self.cat_cols:
            options = sorted(
                value for value in self.category_maps[column]
                if value not in {"MISSING", "OTHER_RARE"}
            )
            fields.append({
                "name": column,
                "type": "categorical",
                "required": True,
                "nullable": True,
                "options": options,
            })

        numeric_definitions = {
            "num_units": {"minimum": 0, "maximum": None},
            "crash_hour": {"minimum": 0, "maximum": 23},
            "crash_day_of_week": {"minimum": 1, "maximum": 7},
            "crash_month": {"minimum": 1, "maximum": 12},
        }
        for column in self.base_num_cols:
            fields.append({
                "name": column,
                "type": "number",
                "required": True,
                "nullable": True,
                "default_if_null": float(self.numeric_medians[column]),
                **numeric_definitions[column],
            })

        return {
            "model": self.selected_model,
            "input_fields": fields,
            "output_labels": [self.id_to_label[class_id] for class_id in sorted(self.id_to_label)],
            "demo_mode": False,
        }

    @staticmethod
    def _normalize_text(value: Any) -> str:
        import pandas as pd  # type: ignore
        if pd.isna(value):
            return "MISSING"
        normalized = " ".join(str(value).strip().upper().split())
        return "MISSING" if normalized in {"", "NAN", "NULL", "NONE", "UNKNOWN", "UNKNOWN/NA", "NOT APPLICABLE"} else normalized

    def _normalize_category(self, column: str, value: Any) -> str:
        normalized = self._normalize_text(value)
        known_values = self.category_maps[column]
        if normalized in self.rare_categories[column] or normalized not in known_values:
            normalized = "OTHER_RARE"
        return normalized

    def _prepare_model_inputs(self, record: dict[str, Any]):
        pd = self.pd
        np = self.np
        frame = pd.DataFrame([record])
        missing_columns = [column for column in self.input_features if column not in frame.columns]
        if missing_columns:
            raise ValueError(f"Missing required input fields: {missing_columns}")
        frame = frame[self.input_features].copy()

        for column in self.cat_cols:
            frame[column] = frame[column].map(lambda value: self._normalize_category(column, value))
        for column in self.base_num_cols:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

        frame["num_units_was_missing"] = frame["num_units"].isna().astype("int8")
        for column in self.base_num_cols:
            frame[column] = frame[column].fillna(self.numeric_medians[column])

        if (frame["num_units"] < 0).any():
            raise ValueError("num_units must be greater than or equal to 0.")
        if not frame["crash_hour"].between(0, 23).all():
            raise ValueError("crash_hour must be between 0 and 23.")
        if not frame["crash_day_of_week"].between(1, 7).all():
            raise ValueError("crash_day_of_week must be between 1 and 7.")
        if not frame["crash_month"].between(1, 12).all():
            raise ValueError("crash_month must be between 1 and 12.")

        frame["is_weekend"] = frame["crash_day_of_week"].isin([1, 7]).astype("int8")
        frame["hour_sin"] = np.sin(2 * np.pi * frame["crash_hour"] / 24)
        frame["hour_cos"] = np.cos(2 * np.pi * frame["crash_hour"] / 24)
        frame["day_of_week_sin"] = np.sin(2 * np.pi * (frame["crash_day_of_week"] - 1) / 7)
        frame["day_of_week_cos"] = np.cos(2 * np.pi * (frame["crash_day_of_week"] - 1) / 7)
        frame["month_sin"] = np.sin(2 * np.pi * (frame["crash_month"] - 1) / 12)
        frame["month_cos"] = np.cos(2 * np.pi * (frame["crash_month"] - 1) / 12)

        categorical = np.column_stack([
            frame[column].map(self.category_maps[column]).fillna(0).to_numpy(dtype=np.int64)
            for column in self.cat_cols
        ])
        numeric = self.numeric_scaler.transform(frame[self.num_cols]).astype(np.float32)
        return categorical, numeric

    def predict(self, record: dict[str, Any]) -> dict[str, Any]:
        categorical, numeric = self._prepare_model_inputs(record)
        categorical_tensor = self.torch.as_tensor(categorical, dtype=self.torch.long, device=self.device)
        numeric_tensor = self.torch.as_tensor(numeric, dtype=self.torch.float32, device=self.device)
        with self.torch.inference_mode():
            logits = self.model(categorical_tensor, numeric_tensor)
            probabilities = self.torch.softmax(logits, dim=1).cpu().numpy()
        decision_scores = probabilities.copy()
        if self.use_calibration:
            decision_scores *= self.probability_multipliers
        predicted_id = int(decision_scores.argmax(axis=1)[0])
        probability_row = probabilities[0]
        return {
            "predicted_class_id": predicted_id,
            "predicted_label": self.id_to_label[predicted_id],
            "confidence": float(probability_row[predicted_id]),
            "probabilities": {
                self.id_to_label[class_id]: float(probability_row[class_id])
                for class_id in sorted(self.id_to_label)
            },
            "model": self.selected_model,
            "demo_mode": False,
        }


def build_predictor() -> DemoPredictor | RealPredictor:
    project_root = find_project_root()
    if project_root is None:
        return DemoPredictor()
    try:
        return RealPredictor(project_root)
    except Exception as exc:  # Keep the dashboard usable and make the failure visible.
        predictor = DemoPredictor()
        predictor.model_name = "Server demo heuristic"
        predictor.load_error = str(exc)  # type: ignore[attr-defined]
        return predictor


PREDICTOR = build_predictor()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - stdlib method name
        route = self.path.split("?", 1)[0]
        if route == "/api/schema":
            if hasattr(PREDICTOR, "get_input_schema"):
                self._send_json(PREDICTOR.get_input_schema())  # type: ignore[attr-defined]
            else:
                self._send_json({"demo_mode": True, "error": "Real model schema unavailable"}, status=503)
            return
        if route == "/api/status":
            payload = PREDICTOR.status()
            if hasattr(PREDICTOR, "load_error"):
                payload["message"] += f" Load error: {getattr(PREDICTOR, 'load_error')}"
            self._send_json(payload)
            return
        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - stdlib method name
        if self.path.split("?", 1)[0] != "/api/predict":
            self._send_json({"error": "Not found"}, status=404)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_length)
            record = json.loads(raw.decode("utf-8"))
            if not isinstance(record, dict):
                raise ValueError("JSON body must be an object")
            result = PREDICTOR.predict(record)
            self._send_json(result)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=400)


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def make_server() -> tuple[ReusableThreadingHTTPServer, int]:
    last_error: OSError | None = None
    for port in range(PORT, PORT + 20):
        try:
            server = ReusableThreadingHTTPServer(("", port), Handler)
            server.daemon_threads = True
            return server, port
        except OSError as exc:
            last_error = exc
            continue
    raise OSError(f"Could not bind to any port from {PORT} to {PORT + 19}: {last_error}")


def main() -> None:
    mimetypes.add_type("text/javascript", ".js")
    server, actual_port = make_server()
    url = f"http://localhost:{actual_port}/"
    print(f"Serving dashboard folder: {HERE}", flush=True)
    print(f"Predictor status: {PREDICTOR.status()['message']}", flush=True)
    print(f"Open: {url}", flush=True)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")


if __name__ == "__main__":
    main()
