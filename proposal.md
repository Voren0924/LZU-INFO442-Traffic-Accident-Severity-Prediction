# M1 Project Proposal

## Project Title

**Traffic-Accident-Severity-Prediction**


## 1. Domain and Motivation

This project focuses on the **urban transportation and public safety** domain. Traffic accidents are a major public safety issue because they can cause injuries, fatalities, traffic congestion, emergency response pressure, and economic losses. As urban traffic systems become more complex, accident severity may be influenced by many interacting factors, including weather, lighting, road surface conditions, crash type, traffic control devices, and the number of vehicles involved.

The goal of this project is not only to predict the severity of traffic accidents, but also to identify the factors most strongly associated with severe injury outcomes. Understanding these factors can provide data-driven support for traffic safety management, emergency response prioritization, infrastructure improvement, and accident prevention.

This problem matters because transportation agencies and emergency services need to know which accident conditions are most dangerous. If high-risk factors can be identified, decision-makers may be able to improve road design, adjust traffic control strategies, strengthen safety warnings, and allocate emergency resources more effectively.

The practical decision supported by this project is:

> Given the conditions of a traffic accident, can we estimate the likely severity level and identify which factors make the accident more dangerous?

A successful model could help transportation agencies and emergency services focus interventions on high-risk accident scenarios and improve public safety outcomes.



## 2. Dataset Description

We plan to use the public **Traffic Accidents** dataset from Kaggle. The dataset was created by **Oktay Rdeki** and contains approximately **210,000 traffic accident records** with **24 attributes**. The dataset includes temporal, environmental, roadway, crash-related, and injury-related information.

### Dataset Source

| Item | Description |
|---|---|
| Platform | Kaggle |
| Dataset name | Traffic Accidents |
| Dataset URL | https://www.kaggle.com/datasets/oktayrdeki/traffic-accidents |
| Author | Oktay Rdeki |
| Access method | Direct download from Kaggle |
| Format | CSV |

### Dataset Size and Structure

| Item | Description |
|---|---|
| Number of records | Approximately 210,000 |
| Number of attributes | 24 |
| Data type | Structured tabular dataset |
| Requirement fit | Satisfies the course requirement of at least 1,000 rows and 8 features |

### Main Feature Groups

The dataset contains the following types of variables:

#### Temporal Features

- `crash_date`
- `crash_hour`
- `crash_day_of_week`
- `crash_month`

#### Roadway and Traffic Condition Features

- `trafficway_type`
- `alignment`
- `roadway_surface_cond`
- `road_defect`
- `traffic_control_device`
- `intersection_related_i`

#### Environmental Features

- `weather_condition`
- `lighting_condition`

#### Crash-Related Features

- `first_crash_type`
- `crash_type`
- `prim_contributory_cause`
- `num_units`

#### Injury-Related Variables

- `most_severe_injury`
- `injuries_total`
- `injuries_fatal`
- `injuries_incapacitating`
- `injuries_non_incapacitating`
- `injuries_reported_not_evident`
- `injuries_no_indication`

### Target Variable

The target variable is:

```text
most_severe_injury
```

This variable represents the most serious injury level recorded in each crash. It will be used as the classification label for accident severity prediction.

### Predictor Variables

To avoid data leakage, we will not use injury-count variables such as:

- `injuries_total`
- `injuries_fatal`
- `injuries_incapacitating`
- `injuries_non_incapacitating`
- `injuries_reported_not_evident`
- `injuries_no_indication`

These variables directly describe accident consequences and are too closely related to the target variable.

Instead, we plan to use features that are available at or before the accident event, such as:

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
- selected temporal variables such as `crash_hour`, `crash_day_of_week`, and `crash_month`

### Ethical Considerations

The dataset is publicly available on Kaggle. Since the dataset describes traffic accidents rather than directly identifying individuals, the direct privacy risk appears limited. However, we will still consider the following ethical issues:

- verify the dataset license and Kaggle terms of use;
- avoid attempting to identify individuals involved in accidents;
- avoid unsupported causal claims from observational data;
- consider possible reporting bias in accident records;
- clearly document model limitations, especially for rare severe and fatal accident categories;
- avoid using the model as the sole basis for safety or emergency decisions without human review.


## 3. Scientific Question

### Main Scientific Question

> Can environmental, roadway, temporal, and crash-related factors be used to predict the most severe injury level of a traffic accident, and which factors contribute most to severe outcomes?

This question is specific and measurable because the outcome variable is clearly defined as `most_severe_injury`, and the predictor variables are available in the dataset. Model performance can be evaluated using classification metrics such as accuracy, precision, recall, F1-score, AUC, and confusion matrix. Feature importance and interpretability methods can also be used to identify key risk factors.

### Supporting Sub-Questions

1. Which features have the strongest relationship with accident severity?
2. Do adverse weather, poor lighting, wet or icy roads, and uncontrolled intersections increase the probability of severe accidents?
3. How does class imbalance affect the model’s ability to identify severe and fatal accidents?

### Connection to Real Decisions

The results can support real traffic safety decisions. For example:

- if poor lighting is strongly related to severe accidents, city planners may prioritize lighting improvements;
- if wet, snowy, or icy roads are associated with higher injury severity, transportation departments may improve road maintenance and warning systems;
- if certain crash types are strongly associated with severe injuries, traffic safety campaigns can target those scenarios;
- if the model identifies high-risk accident conditions, emergency services may use similar models to support triage or resource allocation.

Because this dataset is observational, this project will focus on association and prediction rather than unsupported causal claims.


## 4. Preliminary Hypothesis

### Main Hypothesis

Crash-related variables such as `crash_type`, `first_crash_type`, `prim_contributory_cause`, and `num_units` will be stronger predictors of `most_severe_injury` than general environmental variables, because they directly describe the mechanism and structure of the accident.

### Supporting Hypotheses

1. Adverse environmental and road conditions, such as poor lighting, bad weather, wet roads, snowy roads, or icy roads, will be associated with a higher probability of severe injury.
2. Accidents at locations with no traffic controls or limited traffic control devices will be more likely to result in severe injuries than accidents at properly signalized locations.
3. Because severe and fatal accidents are rare, models optimized only for accuracy will perform poorly on minority severity classes.


## 5. Biases, Risks, and Feasibility

### Potential Biases and Risks

The dataset only includes recorded traffic accidents, so minor or unreported accidents may be missing. This may introduce selection bias because the dataset may not fully represent all traffic accidents.

Some variables, such as `weather_condition`, `roadway_surface_cond`, and `prim_contributory_cause`, may also contain measurement or reporting inconsistencies. These issues may affect the reliability of the model and the interpretation of feature importance.

Another important risk is class imbalance. Severe and fatal accidents are likely to be much less common than accidents with no injury or minor injury. Therefore, a model may achieve high overall accuracy while performing poorly on the most important severe-injury classes.

### Feasibility

This project is feasible within the course timeline because the dataset is publicly available, structured as a CSV file, and large enough for machine learning analysis. The target variable is clearly defined as `most_severe_injury`, and the dataset contains enough predictor variables to support classification, feature analysis, and model comparison.

To reduce risk, we will avoid causal overclaiming, check missing values and class balance, exclude injury-count variables that may cause data leakage, and evaluate models using metrics beyond accuracy, such as recall, F1-score, and confusion matrix.


## 6. Roles

| Name         | Student ID | Responsibility |
|--------------|---:|---|
| Haoye Chen   | 320230941721 | Data acquisition, dataset source documentation, and GitHub repository organization |
| Fangzhou Liu | 320230942161 | Data cleaning, preprocessing, missing value handling, and feature encoding |
| Xiuru Li     | 320230942091 | Exploratory data analysis, visualization, and interpretation of accident patterns |
| Shaoyi Zong  | 320230942831 | Baseline model building, evaluation metrics, and model comparison |
| Yukun Su     | 320230942311 | Advanced modeling, model interpretation, SHAP analysis, and final report integration |

All team members will also participate in scientific question refinement, hypothesis discussion, code review, GitHub maintenance, and final project integration.
