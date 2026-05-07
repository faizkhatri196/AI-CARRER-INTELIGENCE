import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os
import pickle

class CareerPredictor:
    def __init__(self):
        self.model_dir = os.path.dirname(__file__)
        self.data_path = os.path.join(os.path.dirname(self.model_dir), 'data', 'salary_data.csv')
        self.salary_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.level_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.le = LabelEncoder()
        self.is_trained = False
        
    def train(self):
        if not os.path.exists(self.data_path):
            print("No training data found.")
            return False
            
        df = pd.read_csv(self.data_path)
        
        # Features
        X = df[['experience_years', 'skills_count', 'projects_count']]
        
        # Targets
        y_salary = df['salary_lpa']
        y_level = self.le.fit_transform(df['job_level'])
        
        self.salary_model.fit(X, y_salary)
        self.level_model.fit(X, y_level)
        self.is_trained = True
        return True
        
    def predict(self, experience_years, skills_count, projects_count):
        if not self.is_trained:
            self.train()
            
        X_pred = pd.DataFrame([[experience_years, skills_count, projects_count]], 
                              columns=['experience_years', 'skills_count', 'projects_count'])
        
        salary_pred = self.salary_model.predict(X_pred)[0]
        level_pred_idx = self.level_model.predict(X_pred)[0]
        level_pred = self.le.inverse_transform([level_pred_idx])[0]
        
        return {
            "predicted_level": level_pred,
            "predicted_salary_lpa": round(salary_pred, 2)
        }

predictor = CareerPredictor()
predictor.train()
