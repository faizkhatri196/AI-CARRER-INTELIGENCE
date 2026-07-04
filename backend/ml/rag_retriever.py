import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class JobMarketRAGEngine:
    def __init__(self):
        self.csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai_job_market.csv"))
        self.df = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self.is_initialized = False
        self.initialize_retriever()

    def initialize_retriever(self):
        try:
            if not os.path.exists(self.csv_path):
                logger.error(f"Job market data file not found at {self.csv_path}")
                return False
            
            # Load the CSV
            self.df = pd.read_csv(self.csv_path)
            
            # Combine fields for vectorization
            # We combine job_title, skills_required, tools_preferred, and industry to make a rich text document
            self.df['skills_required'] = self.df['skills_required'].fillna('')
            self.df['tools_preferred'] = self.df['tools_preferred'].fillna('')
            self.df['job_title'] = self.df['job_title'].fillna('')
            self.df['industry'] = self.df['industry'].fillna('')
            
            self.df['combined_text'] = (
                self.df['job_title'] + " " + 
                self.df['skills_required'] + " " + 
                self.df['tools_preferred'] + " " + 
                self.df['industry']
            )
            
            # Initialize TF-IDF Vectorizer
            self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
            self.tfidf_matrix = self.vectorizer.fit_transform(self.df['combined_text'])
            self.is_initialized = True
            logger.info("JobMarketRAGEngine initialized successfully.")
            return True
        except Exception as e:
            logger.exception(f"Error initializing JobMarketRAGEngine: {str(e)}")
            self.is_initialized = False
            return False

    def retrieve_matching_jobs(self, query_text: str, top_k: int = 5) -> list:
        """
        Retrieves top_k jobs matching the query text.
        Falls back to keyword matching if TF-IDF matrix is not initialized.
        """
        if not self.is_initialized or self.df is None:
            # Re-attempt initialization
            if not self.initialize_retriever():
                return []

        try:
            # Vectorize query
            query_vec = self.vectorizer.transform([query_text])
            
            # Compute cosine similarities
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            # Get top indices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                row = self.df.iloc[idx]
                
                # Parse salary range
                salary_range = str(row.get('salary_range_usd', '60000-120000'))
                
                results.append({
                    "job_id": int(row.get('job_id', 0)),
                    "company_name": str(row.get('company_name', 'Unknown')),
                    "industry": str(row.get('industry', 'Tech')),
                    "job_title": str(row.get('job_title', 'Software Engineer')),
                    "skills_required": [s.strip() for s in str(row.get('skills_required', '')).split(',') if s.strip()],
                    "tools_preferred": [t.strip() for t in str(row.get('tools_preferred', '')).split(',') if t.strip()],
                    "experience_level": str(row.get('experience_level', 'Mid')),
                    "location": str(row.get('location', 'Remote')),
                    "salary_range_usd": salary_range,
                    "similarity_score": round(score, 4)
                })
            
            return results
        except Exception as e:
            logger.error(f"Error during job retrieval: {str(e)}")
            # Simple keyword-based fallback if vector search fails
            return self._fallback_keyword_search(query_text, top_k)

    def _fallback_keyword_search(self, query_text: str, top_k: int = 5) -> list:
        if self.df is None:
            return []
        try:
            query_words = set(query_text.lower().split())
            scores = []
            for idx, row in self.df.iterrows():
                combined = f"{row['job_title']} {row['skills_required']} {row['tools_preferred']}".lower()
                overlap = len(query_words.intersection(set(combined.split())))
                scores.append((overlap, idx))
            
            scores.sort(reverse=True)
            top_indices = [idx for _, idx in scores[:top_k]]
            
            results = []
            for idx in top_indices:
                row = self.df.iloc[idx]
                results.append({
                    "job_id": int(row.get('job_id', 0)),
                    "company_name": str(row.get('company_name', 'Unknown')),
                    "industry": str(row.get('industry', 'Tech')),
                    "job_title": str(row.get('job_title', 'Software Engineer')),
                    "skills_required": [s.strip() for s in str(row.get('skills_required', '')).split(',') if s.strip()],
                    "tools_preferred": [t.strip() for t in str(row.get('tools_preferred', '')).split(',') if t.strip()],
                    "experience_level": str(row.get('experience_level', 'Mid')),
                    "location": str(row.get('location', 'Remote')),
                    "salary_range_usd": str(row.get('salary_range_usd', '60000-120000')),
                    "similarity_score": 0.5  # default fallback score
                })
            return results
        except Exception as e:
            logger.error(f"Error in fallback keyword search: {str(e)}")
            return []

    def get_role_statistics(self, matching_jobs: list) -> dict:
        """
        Calculates aggregate statistics from matching jobs,
        such as average salary in USD, conversion to LPA, and best-fit titles.
        """
        if not matching_jobs:
            return {
                "recommended_role": "AI Engineer",
                "avg_salary_usd": 100000,
                "avg_salary_lpa": 12.0,
                "salary_range_usd": "80,000 - 120,000",
                "salary_range_lpa": "10 - 15"
            }
        
        salaries = []
        titles = []
        
        for job in matching_jobs:
            titles.append(job['job_title'])
            salary_str = job['salary_range_usd']
            if '-' in salary_str:
                try:
                    parts = salary_str.split('-')
                    low = float(parts[0])
                    high = float(parts[1])
                    salaries.append((low + high) / 2.0)
                except ValueError:
                    pass
            else:
                try:
                    salaries.append(float(salary_str))
                except ValueError:
                    pass
        
        avg_salary_usd = int(np.mean(salaries)) if salaries else 110000
        # Convert USD to domestic LPA (using a normalized conversion scale: $100k USD in US correlates to approx 12-18 LPA in India for AI roles relative to PPP/market scale)
        # Let's say: 10,000 USD ~ 1.2 Lakhs Per Annum (or standard purchasing power parity translation)
        # E.g. $100,000 USD is about 12 LPA on this scale. Let's make it: LPA = USD / 8000
        avg_salary_lpa = round(avg_salary_usd / 8000.0, 1)
        
        # Get most common title
        from collections import Counter
        title_counts = Counter(titles)
        recommended_role = title_counts.most_common(1)[0][0]
        
        # Calculate range
        if salaries:
            min_sal = int(min(salaries))
            max_sal = int(max(salaries))
        else:
            min_sal = 80000
            max_sal = 140000
            
        min_lpa = round(min_sal / 8000.0, 1)
        max_lpa = round(max_sal / 8000.0, 1)
        
        return {
            "recommended_role": recommended_role,
            "avg_salary_usd": avg_salary_usd,
            "avg_salary_lpa": avg_salary_lpa,
            "salary_range_usd": f"{min_sal:,} - {max_sal:,}",
            "salary_range_lpa": f"{min_lpa} - {max_lpa}"
        }

# Instantiate global retriever instance
job_rag_retriever = JobMarketRAGEngine()
