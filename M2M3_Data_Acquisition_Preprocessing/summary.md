# Data Quality Summary

## 1. Purpose

This document summarizes the data quality of the processed traffic accident dataset. It focuses on:

- null rates
- class balance
- outlier treatment
- schema

The cleaned dataset is saved as `data/processed/traffic_accidents_cleaned.csv`.  
The model-ready dataset is saved as `data/processed/traffic_accidents_model_ready.csv`.

---

## 2. Dataset Overview

| Dataset | Shape |
|---|---:|
| Raw dataset | `(209306, 24)` |
| Cleaned dataset | `(209275, 17)` |
| Model-ready dataset | `(209275, 70)` |

During preprocessing, `31` exact duplicate raw records were removed.

---

## 3. Null Rates

After preprocessing, the cleaned dataset contains no missing values.

| Column | Missing Values | Missing Rate |
|---|---:|---:|
| `record_id` | 0 | 0.0000% |
| `traffic_control_device` | 0 | 0.0000% |
| `weather_condition` | 0 | 0.0000% |
| `lighting_condition` | 0 | 0.0000% |
| `first_crash_type` | 0 | 0.0000% |
| `trafficway_type` | 0 | 0.0000% |
| `alignment` | 0 | 0.0000% |
| `roadway_surface_cond` | 0 | 0.0000% |
| `road_defect` | 0 | 0.0000% |
| `crash_type` | 0 | 0.0000% |
| `intersection_related_i` | 0 | 0.0000% |
| `prim_contributory_cause` | 0 | 0.0000% |
| `num_units` | 0 | 0.0000% |
| `num_units_was_missing` | 0 | 0.0000% |
| `flag_num_units_nonpositive` | 0 | 0.0000% |
| `flag_num_units_high_outlier` | 0 | 0.0000% |
| `most_severe_injury` | 0 | 0.0000% |

---

## 4. Class Balance

The target variable is `most_severe_injury`.

| Class | Rows | Percentage |
|---|---:|---:|
| `NO INDICATION OF INJURY` | 154767 | 73.9539% |
| `NONINCAPACITATING INJURY` | 31521 | 15.0620% |
| `REPORTED, NOT EVIDENT` | 16073 | 7.6803% |
| `INCAPACITATING INJURY` | 6563 | 3.1361% |
| `FATAL` | 351 | 0.1677% |

The class distribution is highly imbalanced. Most records belong to `NO INDICATION OF INJURY`, while `FATAL` cases are rare. This imbalance should be considered when selecting evaluation metrics and training models.

---

## 5. Numeric Feature Summary

The numeric predictor is `num_units`.

| Statistic | Value |
|---|---:|
| Count | 209275 |
| Mean | 2.063299 |
| Standard deviation | 0.396030 |
| Minimum | 1 |
| 25th percentile | 2 |
| Median | 2 |
| 75th percentile | 2 |
| Maximum | 11 |

Most records involve `2` units, while the maximum observed value is `11`.

---

## 6. Outlier Treatment

Outlier treatment was applied to `num_units`.

The method used was the IQR rule:

- Q1 = `2.0`
- Q3 = `2.0`
- IQR = `0.0`
- High outlier upper bound = `2.0`

Rows were flagged as high outliers when `num_units` was greater than the upper bound.

| Flag | Rows |
|---|---:|
| `num_units_was_missing` | 0 |
| `flag_num_units_nonpositive` | 0 |
| `flag_num_units_high_outlier` | 14815 |

Outliers were flagged, not removed. This preserves potentially meaningful accident records while still making unusual values visible for later analysis.

---

## 7. Categorical Cardinality

After rare category grouping, categorical predictors have the following number of unique values:

| Column | Unique Values |
|---|---:|
| `traffic_control_device` | 5 |
| `weather_condition` | 6 |
| `lighting_condition` | 6 |
| `first_crash_type` | 9 |
| `trafficway_type` | 9 |
| `alignment` | 3 |
| `roadway_surface_cond` | 5 |
| `road_defect` | 3 |
| `crash_type` | 2 |
| `intersection_related_i` | 2 |
| `prim_contributory_cause` | 14 |

Categories appearing in less than 1% of rows were grouped as `OTHER_RARE`.

| Column | Rows Grouped as `OTHER_RARE` |
|---|---:|
| `traffic_control_device` | 2259 |
| `weather_condition` | 1965 |
| `lighting_condition` | 0 |
| `first_crash_type` | 6797 |
| `trafficway_type` | 8362 |
| `alignment` | 1723 |
| `roadway_surface_cond` | 1781 |
| `road_defect` | 3150 |
| `crash_type` | 0 |
| `intersection_related_i` | 0 |
| `prim_contributory_cause` | 13864 |

---

## 8. Cleaned Dataset Schema

| Column | Data Type |
|---|---|
| `record_id` | `int64` |
| `traffic_control_device` | `string` |
| `weather_condition` | `string` |
| `lighting_condition` | `string` |
| `first_crash_type` | `string` |
| `trafficway_type` | `string` |
| `alignment` | `string` |
| `roadway_surface_cond` | `string` |
| `road_defect` | `string` |
| `crash_type` | `string` |
| `intersection_related_i` | `string` |
| `prim_contributory_cause` | `string` |
| `num_units` | `int64` |
| `num_units_was_missing` | `int64` |
| `flag_num_units_nonpositive` | `int64` |
| `flag_num_units_high_outlier` | `int64` |
| `most_severe_injury` | `string` |

---

## 9. Model-Ready Dataset Schema Summary

The model-ready dataset contains `70` columns.

Column groups:

- `record_id`
- one-hot encoded categorical predictor columns
- numeric and flag columns
- `most_severe_injury_encoded`

Model-ready dataset dtype counts:

| Data Type | Number of Columns |
|---|---:|
| `float64` | 64 |
| `int64` | 6 |

Categorical predictors were encoded using `OneHotEncoder`.

Number of one-hot encoded feature columns: `64`.

The target variable was encoded using `LabelEncoder`.

| Original Class | Encoded Value |
|---|---:|
| `FATAL` | 0 |
| `INCAPACITATING INJURY` | 1 |
| `NO INDICATION OF INJURY` | 2 |
| `NONINCAPACITATING INJURY` | 3 |
| `REPORTED, NOT EVIDENT` | 4 |

---

## 10. Final Output Confirmation

| Output File | Rows | Columns |
|---|---:|---:|
| `traffic_accidents_cleaned.csv` | 209275 | 17 |
| `traffic_accidents_model_ready.csv` | 209275 | 70 |