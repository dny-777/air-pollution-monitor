import pandas as pd
import numpy as np
import re
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# Load data
df = pd.read_excel("C:\Users\Dnyanada\OneDrive\ドキュメント\air-pollution-backend\air-pollution-backend\air-pollution-backend\final_cleaned_data.xlsx")

# Drop rows with missing PM2.5
df = df.dropna(subset=['PM2.5'])

# Clean Latitude and Longitude
df['Latitude'] = df['Latitude'].apply(lambda x: float(re.sub(r'[^\d\.-]', '', str(x))))
df['Longitude'] = df['Longitude'].apply(lambda x: float(re.sub(r'[^\d\.-]', '', str(x))))

# Define features and target
X = df[['PM10', 'Latitude', 'Longitude']]
y = df['PM2.5']

# Preprocessing pipeline
preprocessor = ColumnTransformer([
    ('scale', StandardScaler(), ['PM10', 'Latitude', 'Longitude'])
])

# Full pipeline
regression_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
regression_pipeline.fit(X_train, y_train)

# Save model
joblib.dump(regression_pipeline, 'pm25_regression_model.pkl')
print("✅ Regression model saved as 'pm25_regression_model.pkl'")

# Evaluation
y_pred = regression_pipeline.predict(X_test)
print(f"📊 MAE: {mean_absolute_error(y_test, y_pred):.2f}")
print(f"📊 RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.2f}")
print(f"📊 R² Score: {r2_score(y_test, y_pred):.2f}")














