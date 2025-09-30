import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# Load data
df = pd.read_excel("C:\Users\Dnyanada\OneDrive\ドキュメント\air-pollution-backend\air-pollution-backend\air-pollution-backend\final_cleaned_data.xlsx")

# Drop rows with missing AQI_Category
df = df.dropna(subset=['AQI_Category'])

# Clean Latitude and Longitude
df['Latitude'] = df['Latitude'].apply(lambda x: float(re.sub(r'[^\d\.-]', '', str(x))))
df['Longitude'] = df['Longitude'].apply(lambda x: float(re.sub(r'[^\d\.-]', '', str(x))))

# Features and target
X = df[['PM2.5', 'PM10', 'Latitude', 'Longitude']]
y = df['AQI_Category']

# Preprocessing
preprocessor = ColumnTransformer([
    ('scale', StandardScaler(), ['PM2.5', 'PM10', 'Latitude', 'Longitude'])
])

# Pipeline
clf_pipeline = Pipeline([
    ('preprocess', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
clf_pipeline.fit(X_train, y_train)

# Save model
joblib.dump(clf_pipeline, 'aqi_classification_model.pkl')
print("✅ Classification model saved as 'aqi_classification_model.pkl'")

# Evaluate
y_pred = clf_pipeline.predict(X_test)
print("\n📄 Classification Report:")
print(classification_report(y_test, y_pred))









