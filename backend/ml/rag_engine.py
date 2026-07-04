import os
import logging
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from .rag_retriever import job_rag_retriever

logger = logging.getLogger(__name__)

# Manual env loading from backend/.env if it exists
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

class ResumeAnalysis(BaseModel):
    predicted_level: str = Field(description="The predicted job level (Intern, Fresher, SDE1, SDE2, Senior)")
    predicted_salary_lpa: int = Field(description="The predicted salary in Lakhs Per Annum (LPA) based on current market trends")
    recommended_role: str = Field(description="The recommended job title based on matched job market postings")
    resume_score: int = Field(description="Overall resume score from 0 to 100 indicating quality and readiness")
    skills: list[str] = Field(description="List of all technical skills found in the resume")
    missing_skills: list[str] = Field(description="Crucial skills the candidate is missing to reach the next level or be highly competitive")
    match_percentage: int = Field(description="Percentage match (0-100) of their current skills against market demands for their predicted level")
    suggested_companies: list[str] = Field(description="List of 5 real companies currently hiring for this specific profile and tech stack")
    salary_range_lpa: str = Field(description="Estimated salary range in LPA, e.g. '8.0 - 15.0'")

class RoadmapUpdate(BaseModel):
    missing_skills: list[str] = Field(description="Crucial skills the candidate needs to learn to reach the target level")
    match_percentage: int = Field(description="Percentage match (0-100) of their CURRENT skills against the TARGET level requirements")
    suggested_companies: list[str] = Field(description="List of 5 real companies that hire for the target level")

class ImprovementSuggestion(BaseModel):
    overall_score: int = Field(description="Overall score for the resume from 0 to 100")
    formatting_score: int = Field(description="Score for formatting and structure from 0 to 100")
    formatting_feedback: list[str] = Field(description="Actionable formatting and layout improvements (minimum 3)")
    impact_score: int = Field(description="Score for impact, projects, and metrics from 0 to 100")
    impact_feedback: list[str] = Field(description="Actionable feedback on making bullet points results-oriented and using numbers (minimum 3)")
    ats_score: int = Field(description="ATS compatibility and readability score from 0 to 100")
    ats_feedback: list[str] = Field(description="ATS optimization advice, keywords to add, etc. (minimum 3)")
    skills_score: int = Field(description="Skills relevance score from 0 to 100")
    skills_feedback: list[str] = Field(description="Specific tools, frameworks, and skills to pick up based on market trends (minimum 3)")

class CareerAIEngine:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "YOUR_FALLBACK_KEY_HERE_IF_TESTING_LOCALLY")
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.2
        )

    def analyze_resume(self, resume_text: str) -> dict:
        # RAG Search over job market data
        matching_jobs = job_rag_retriever.retrieve_matching_jobs(resume_text, top_k=6)
        stats = job_rag_retriever.get_role_statistics(matching_jobs)
        
        # Serialize matching jobs for context
        jobs_context = ""
        for job in matching_jobs:
            jobs_context += f"Company: {job['company_name']} | Title: {job['job_title']} | Skills Required: {', '.join(job['skills_required'])} | Tools: {', '.join(job['tools_preferred'])} | Salary Range: {job['salary_range_usd']} | Level: {job['experience_level']}\n"
        
        # Scenario mapping from the local data file (as supplementary guide)
        scenario_data = ""
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "salary_data.csv")
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                scenario_data = f.read()

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Senior Technical Recruiter and Career Advisor in the AI/Tech domain. "
                       "Your job is to analyze the candidate's resume and return structured data about it. "
                       "You must output the results by invoking the tool/function. Do not output any other text."),
            ("human", """
            Analyze the following resume deeply. Use the retrieved job market context and local scenarios to guide your scoring, level prediction, and salary prediction.
            
            Retrieved Real-Time Job Postings (RAG Context):
            ---
            {jobs_context}
            ---

            Aggregate Statistics from Job Market:
            - Best Fit Role: {recommended_role}
            - Average Salary: {avg_salary_usd} USD (~{avg_salary_lpa} LPA)
            - Salary Range: {salary_range_lpa} LPA
            
            Additional Reference Scenarios:
            ---
            {scenario_data}
            ---
            
            Resume Content:
            ---
            {resume_text}
            ---
            """)
        ])
        
        structured_llm = self.llm.with_structured_output(ResumeAnalysis)
        chain = prompt | structured_llm
        parsed_result = chain.invoke({
            "resume_text": resume_text,
            "jobs_context": jobs_context,
            "scenario_data": scenario_data,
            "recommended_role": stats["recommended_role"],
            "avg_salary_usd": stats["avg_salary_usd"],
            "avg_salary_lpa": stats["avg_salary_lpa"],
            "salary_range_lpa": stats["salary_range_lpa"]
        })
        return parsed_result.model_dump()

    def suggest_improvements(self, resume_text: str, target_role: str = None) -> dict:
        # Use target role to retrieve specific matching jobs
        query = target_role if target_role else resume_text
        matching_jobs = job_rag_retriever.retrieve_matching_jobs(query, top_k=5)
        
        jobs_context = ""
        for job in matching_jobs:
            jobs_context += f"Job Title: {job['job_title']} | Skills Required: {', '.join(job['skills_required'])} | Tools: {', '.join(job['tools_preferred'])}\n"

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert Resume Critic and ATS Optimizer. "
                       "Your job is to analyze the candidate's resume and return structured improvement suggestions. "
                       "You must output the results by invoking the tool/function. Do not output any other text."),
            ("human", """
            Analyze the following resume and recommend improvements specifically to align it with this target job market context.
            
            Target Job Market Context:
            ---
            {jobs_context}
            ---
            
            Resume Content:
            ---
            {resume_text}
            ---
            
            Provide structured suggestions on:
            1. Formatting and Structure (overall organization, sections, length).
            2. Impact and Quantifiable Results (making bullet points action-oriented, adding metrics/numbers).
            3. ATS Compatibility (keywords, headers, formatting for scanners).
            4. Skills (technical tools, languages, and methodologies needed for the matching jobs).
            
            Provide a score (0-100) for each category, along with a list of actionable, clear recommendations.
            """)
        ])
        
        structured_llm = self.llm.with_structured_output(ImprovementSuggestion)
        chain = prompt | structured_llm
        parsed_result = chain.invoke({
            "resume_text": resume_text,
            "jobs_context": jobs_context
        })
        return parsed_result.model_dump()

    def rewrite_resume(self, resume_text: str, target_role: str) -> str:
        # Retrieve target role jobs to tailor the resume
        matching_jobs = job_rag_retriever.retrieve_matching_jobs(target_role, top_k=3)
        
        jobs_context = ""
        for job in matching_jobs:
            jobs_context += f"Job Title: {job['job_title']} | Skills: {', '.join(job['skills_required'])} | Tools: {', '.join(job['tools_preferred'])}\n"

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Professional Resume Writer. "
                       "Your job is to rewrite the candidate's resume text to be highly tailored for the target role in beautiful, clean Markdown format. "
                       "DO NOT add any conversational text or explanation. Output ONLY the raw Markdown resume itself."),
            ("human", """
            Rewrite the following resume text to be highly tailored for the target role: "{target_role}".
            Use details from the target job market context to write high-impact bullet points and align technical skills.
            
            Target Job Market Context:
            ---
            {jobs_context}
            ---
            
            Original Resume Content:
            ---
            {resume_text}
            ---
            
            Instructions for writing the improved resume:
            - Structure it with: Name & Contact (use placeholders if not in original), Professional Summary, Technical Skills (categorized, emphasizing target tools), Professional Experience, and Projects.
            - In the Experience section, rewrite bullet points using the Google X-Y-Z formula: "Accomplished [X], as measured by [Y], by doing [Z]". Incorporate relevant numbers and metrics.
            - Integrate missing keywords and tools from the Job Market Context.
            """)
        ])
        
        chain = prompt | self.llm
        response = chain.invoke({
            "resume_text": resume_text,
            "target_role": target_role,
            "jobs_context": jobs_context
        })
        return response.content

    def get_dynamic_roadmap(self, current_skills: list[str], target_level: str) -> dict:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a career development specialist. "
                       "Your job is to identify missing skills, match percentage, and list companies for the target level by invoking the tool. "
                       "Do not output any other text."),
            ("human", """
            The candidate has the following current skills: {current_skills}
            They want to target the {target_level} job level.
            """)
        ])
        
        structured_llm = self.llm.with_structured_output(RoadmapUpdate)
        chain = prompt | structured_llm
        parsed_result = chain.invoke({
            "current_skills": ', '.join(current_skills),
            "target_level": target_level
        })
        return parsed_result.model_dump()

    def chat(self, query: str, context: str = "") -> str:
        prompt_template = """
        You are a senior AI career advisor and technical architect.
        Use the following context about the user's resume and predicted profile to answer their question.
        If the answer is not in the context, give general career advice based on their predicted level.
        
        Context:
        {context}
        
        User Question: {query}
        
        Helpful Answer:"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a senior AI career advisor and technical architect. "
                       "Use the context about the user's resume and predicted profile to answer their question. "
                       "If the answer is not in the context, give general career advice based on their predicted level."),
            ("human", """
            Context:
            {context}
            
            User Question: {query}
            """)
        ])
        
        chain = prompt | self.llm
        response = chain.invoke({
            "context": context,
            "query": query
        })
        return response.content

career_ai = CareerAIEngine()
