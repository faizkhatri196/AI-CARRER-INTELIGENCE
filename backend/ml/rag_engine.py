from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
import os
from pydantic import BaseModel, Field

class ResumeAnalysis(BaseModel):
    predicted_level: str = Field(description="The predicted job level (Intern, Fresher, SDE1, SDE2, Senior)")
    predicted_salary_lpa: int = Field(description="The predicted salary in Lakhs Per Annum (LPA) based on current market trends")
    skills: list[str] = Field(description="List of all technical skills found in the resume")
    missing_skills: list[str] = Field(description="Crucial skills the candidate is missing to reach the next level or be highly competitive")
    match_percentage: int = Field(description="Percentage match (0-100) of their current skills against market demands for their predicted level")
    suggested_companies: list[str] = Field(description="List of 5 real companies currently hiring for this specific profile and tech stack")

class RoadmapUpdate(BaseModel):
    missing_skills: list[str] = Field(description="Crucial skills the candidate needs to learn to reach the target level")
    match_percentage: int = Field(description="Percentage match (0-100) of their CURRENT skills against the TARGET level requirements")
    suggested_companies: list[str] = Field(description="List of 5 real companies that hire for the target level")

class CareerAIEngine:
    def __init__(self):
        # Always use Environment Variables for API keys to prevent GitHub leaks!
        api_key = os.environ.get("GROQ_API_KEY", "YOUR_FALLBACK_KEY_HERE_IF_TESTING_LOCALLY")
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.2
        )

    def analyze_resume(self, resume_text: str) -> dict:
        parser = PydanticOutputParser(pydantic_object=ResumeAnalysis)
        
        # Read current market scenario data
        scenario_data = ""
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "salary_data.csv")
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                scenario_data = f.read()

        prompt_template = PromptTemplate(
            template="""
            Act as a Senior Technical Recruiter and Engineering Manager in the 2026 tech market.
            Analyze the following resume deeply.
            
            Current Market Scenario Mapping (Experience, Skills, Projects -> Level, Salary):
            ---
            {scenario_data}
            ---
            
            Resume Content:
            ---
            {resume_text}
            ---
            
            Based on the Current Market Scenario Mapping provided above, accurately predict their job level and a realistic salary in LPA.
            Also extract their skills, identify critical missing skills for their growth, give a profile match score, and suggest 5 real companies from the mapping that hire this exact profile.
            
            {format_instructions}
            """,
            input_variables=["resume_text", "scenario_data"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        formatted_prompt = prompt_template.format(resume_text=resume_text, scenario_data=scenario_data)
        response = self.llm.invoke(formatted_prompt)
        parsed_result = parser.parse(response.content)
        return parsed_result.model_dump()

    def get_dynamic_roadmap(self, current_skills: list[str], target_level: str) -> dict:
        parser = PydanticOutputParser(pydantic_object=RoadmapUpdate)
        
        prompt_template = PromptTemplate(
            template="""
            The candidate has the following current skills: {current_skills}
            They want to target the {target_level} job level.
            What crucial skills are they missing to reach {target_level}? 
            What is their current match percentage for {target_level}?
            Suggest 5 real companies that hire {target_level} engineers.
            
            {format_instructions}
            """,
            input_variables=["current_skills", "target_level"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        formatted_prompt = prompt_template.format(current_skills=', '.join(current_skills), target_level=target_level)
        response = self.llm.invoke(formatted_prompt)
        parsed_result = parser.parse(response.content)
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
        
        prompt = PromptTemplate(
            input_variables=["context", "query"],
            template=prompt_template
        )
        
        formatted_prompt = prompt.format(context=context, query=query)
        response = self.llm.invoke(formatted_prompt)
        return response.content

career_ai = CareerAIEngine()
