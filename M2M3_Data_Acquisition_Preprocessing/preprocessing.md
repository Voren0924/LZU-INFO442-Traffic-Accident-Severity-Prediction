# Preprocessing Log

## 1. Purpose

This document records the preprocessing transformations applied to the raw traffic accident dataset and provides a short justification for each step.

The goal of preprocessing is to convert the raw dataset into two usable outputs:

- `data/processed/traffic_accidents_cleaned.csv`
- `data/processed/traffic_accidents_model_ready.csv`

The cleaned dataset keeps human-readable values for inspection and exploratory analysis. The model-ready dataset converts categorical variables into numeric features for machine learning.

---

## 2. Input and Output

| File Type | Path |
|---|---|
| Raw input file | `data/raw/traffic_accidents.csv` |
| Cleaned output file | `data/processed/traffic_accidents_cleaned.csv` |
| Model-ready output file | `data/processed/traffic_accidents_model_ready.csv` |

**Justification:**  
Keeping raw data, cleaned data, and model-ready data in separate folders preserves the original dataset and makes the preprocessing workflow easier to reproduce.

---

## 3. Feature Selection

From the original dataset, the preprocessing pipeline selects 12 predictor columns and 1 target column.

### Selected Predictor Columns

- `traffic_control_device`
- `weather_condition`
- `lighting_condition`
- `first_crash_type`
- `trafficway_type`
- `alignment`
- `roadway_surface_cond`
- `road_defect`
- `crash_type`
- `intersection_related_i`
- `prim_contributory_cause`
- `num_units`

### Target Column

- `most_severe_injury`

**Justification:**  
This step is treated as feature selection because the pipeline keeps a subset of the original variables instead of creating new compressed variables.

The selected predictors describe crash context, road environment, weather and lighting conditions, crash type, contributing cause, and number of involved units. These variables are logically related to the task of predicting `most_severe_injury`.

Injury-count columns such as `injuries_total`, `injuries_fatal`, `injuries_incapacitating`, `injuries_non_incapacitating`, `injuries_reported_not_evident`, and `injuries_no_indication` are not used as predictors because they are closely related to the target variable. Including them could create target leakage and lead to unrealistically high model performance.

The `damage` column is also excluded because it represents post-crash outcome information. Since the modeling goal is to predict injury severity from crash conditions and crash characteristics, including damage could make the prediction setting less realistic.

---

## 4. Column Type Definition

The selected predictors are divided into categorical and numeric columns.

### Categorical Predictor Columns

- `traffic_control_device`
- `weather_condition`
- `lighting_condition`
- `first_crash_type`
- `trafficway_type`
- `alignment`
- `roadway_surface_cond`
- `road_defect`
- `crash_type`
- `intersection_related_i`
- `prim_contributory_cause`

### Numeric Predictor Column

- `num_units`

**Justification:**  
Categorical and numeric variables require different preprocessing operations. Separating them makes the pipeline clearer and helps avoid applying inappropriate transformations.

---

## 5. Schema Validation

Before preprocessing, the script checks whether all selected predictor columns and the target column exist in the raw dataset.

If any required column is missing, the script stops and raises an error.

**Justification:**  
This prevents the pipeline from producing incomplete or incorrect output when the raw dataset does not match the expected structure.

---

## 6. Create Working Dataset and Add `record_id`

The selected columns are copied into a new working dataset. A new column named `record_id` is added to identify each processed row.

**Justification:**  
Creating a working copy avoids modifying the raw dataframe directly. The `record_id` improves traceability during later inspection, debugging, and model evaluation.

---

## 7. Standardize Column Names

Column names are standardized by:

- removing leading and trailing spaces
- converting names to lowercase
- replacing spaces with underscores
- replacing hyphens with underscores

**Justification:**  
Consistent column names reduce formatting-related errors and make the dataset easier to use in Python.

---

## 8. Standardize Categorical Values

For each categorical predictor and the target column, the script:

- converts values to string format
- removes leading and trailing spaces
- converts text to uppercase
- compresses repeated whitespace into a single space

**Justification:**  
This prevents equivalent category values from being treated as different categories because of capitalization or spacing differences.

For example, values such as `clear`, `Clear`, and ` CLEAR ` would be standardized into the same category format.

---

## 9. Convert Placeholder Strings to Missing Values

The script converts common placeholder strings into missing values.

The following values are treated as missing:

- empty string
- `NAN`
- `NULL`
- `NONE`
- `UNKNOWN`
- `UNKNOWN/NA`
- `NOT APPLICABLE`

**Justification:**  
These placeholder values do not represent meaningful categories. Converting them to missing values allows the pipeline to handle them consistently.

---

## 10. Convert Numeric Column

The `num_units` column is converted to numeric format. Values that cannot be converted are changed to missing values.

**Justification:**  
The `num_units` variable must be numeric for analysis and model training. Invalid numeric values should not remain as text.

---

## 11. Remove Exact Duplicate Records

Exact duplicate records are removed based on the raw dataset rows.

The pipeline checks duplicate rows in the raw dataset instead of checking only the selected modeling columns.

**Justification:**  
Using all raw columns for duplicate detection is more conservative. If duplicate removal were based only on the selected predictors, different accidents with the same selected feature values might be incorrectly removed.

---

## 12. Handle Missing Target Values

Rows with missing values in the target column `most_severe_injury` are removed.

**Justification:**  
The project uses supervised learning, so each training row must have a valid target label. Rows without the target value cannot be used for model training or evaluation.

---

## 13. Handle Missing Categorical Predictors

Missing values in categorical predictor columns are filled with `MISSING`.

**Justification:**  
This keeps rows that would otherwise be removed and preserves missingness as an explicit category. Missingness may contain useful information for later analysis or modeling.

---

## 14. Handle Missing Numeric Predictor

For the numeric predictor `num_units`, the script:

1. creates a missingness flag named `num_units_was_missing`
2. fills missing `num_units` values using the median value

**Justification:**  
Median imputation is less sensitive to extreme values than mean imputation. The missingness flag preserves whether the value was originally missing before imputation.

---

## 15. Add Anomaly Flags for `num_units`

The script creates two anomaly flag columns:

- `flag_num_units_nonpositive`
- `flag_num_units_high_outlier`

The non-positive flag marks records where `num_units <= 0`.

The high outlier flag is created using the IQR rule:

- calculate Q1
- calculate Q3
- calculate IQR as `Q3 - Q1`
- define the upper bound as `Q3 + 1.5 * IQR`
- flag rows where `num_units` is greater than the upper bound

**Justification:**  
Unusual values are flagged instead of deleted. This preserves potentially meaningful accident records while making possible anomalies visible for later review.

---

## 16. Group Rare Categorical Levels

For each categorical predictor, categories appearing in less than 1% of rows are grouped into `OTHER_RARE`.

**Justification:**  
Rare categories can create many sparse one-hot encoded columns. Grouping rare categories reduces feature sparsity and helps keep the model-ready dataset more stable.

---

## 17. Create the Cleaned Dataset

The cleaned dataset includes:

- `record_id`
- selected categorical predictors
- `num_units`
- `num_units_was_missing`
- `flag_num_units_nonpositive`
- `flag_num_units_high_outlier`
- `most_severe_injury`

The cleaned dataset is saved to `data/processed/traffic_accidents_cleaned.csv`.

**Justification:**  
This output keeps values readable and is suitable for inspection, exploratory analysis, and data quality checking.

---

## 18. One-Hot Encode Categorical Predictors

Categorical predictor columns are encoded using `OneHotEncoder`.

The encoder uses `handle_unknown="ignore"`.

**Justification:**  
The selected categorical predictors are nominal variables, meaning they do not have a natural order. One-hot encoding converts them into numeric model inputs without creating artificial ranking relationships.

Using `handle_unknown="ignore"` also makes the encoding process safer if unseen categories appear later.

---

## 19. Keep Numeric and Flag Columns

The model-ready dataset keeps the following numeric and flag columns:

- `num_units`
- `num_units_was_missing`
- `flag_num_units_nonpositive`
- `flag_num_units_high_outlier`

**Justification:**  
These columns contain useful numeric information and data quality indicators that may help the model predict injury severity.

---

## 20. Encode the Target Variable

The target variable `most_severe_injury` is encoded using `LabelEncoder`.

The encoded target column is named `most_severe_injury_encoded`.

**Justification:**  
Machine learning models require the target variable to be represented numerically. Label encoding converts the injury severity classes into numeric labels.

---

## 21. Create the Model-Ready Dataset

The model-ready dataset combines:

- `record_id`
- one-hot encoded categorical predictors
- numeric and flag columns
- encoded target variable

The final model-ready dataset is saved to `data/processed/traffic_accidents_model_ready.csv`.

**Justification:**  
This output is suitable for machine learning because all predictors and the target variable are represented in numeric form.

---

## 22. Summary of Transformations

| Step | Transformation | Justification |
|---|---|---|
| 1 | Load raw dataset | Start from the original data source |
| 2 | Select 12 predictors and 1 target | Keep relevant original variables and avoid leakage |
| 3 | Validate required columns | Prevent incomplete processing |
| 4 | Add `record_id` | Improve row-level traceability |
| 5 | Standardize column names | Reduce formatting-related errors |
| 6 | Standardize categorical values | Make category labels consistent |
| 7 | Convert placeholders to missing values | Treat invalid or non-informative labels consistently |
| 8 | Convert `num_units` to numeric | Enable numeric analysis and modeling |
| 9 | Remove exact duplicate raw records | Avoid repeated observations without over-removing valid records |
| 10 | Drop rows with missing target | Required for supervised learning |
| 11 | Fill missing categorical values with `MISSING` | Preserve rows and missingness information |
| 12 | Median-impute missing `num_units` | Handle numeric missing values robustly |
| 13 | Add missingness and anomaly flags | Preserve information about missing or unusual values |
| 14 | Group rare categories into `OTHER_RARE` | Reduce sparse encoded features |
| 15 | Save cleaned dataset | Provide a readable analysis-ready dataset |
| 16 | One-hot encode categorical predictors | Prepare nominal variables for modeling |
| 17 | Label-encode target variable | Prepare target for machine learning |
| 18 | Save model-ready dataset | Provide numeric data for model training |