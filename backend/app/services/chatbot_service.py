import os
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("chatbot")

class CareerAndRecruiterChatbot:
    def __init__(self):
        self.client = None
        self._init_llm()

    def _init_llm(self):
        api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        if api_key and api_key != "YOUR_FALLBACK_KEY_HERE_IF_TESTING_LOCALLY":
            try:
                from langchain_groq import ChatGroq
                self.client = ChatGroq(
                    groq_api_key=api_key,
                    model_name=settings.GROQ_MODEL,
                    temperature=0.3
                )
                logger.info("ChatGroq initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize ChatGroq: {e}. Will use contextual intelligence fallback.")
                self.client = None
        else:
            self.client = None

    def respond(self, query: str, context_dict: Dict[str, Any], mode: str = "candidate") -> str:
        # Build grounding context
        context_str = ""
        if mode == "candidate":
            context_str = (
                f"Candidate Name: {context_dict.get('name', 'Candidate')}\n"
                f"Recommended Role: {context_dict.get('recommended_role', 'Software Engineer')}\n"
                f"Job Fit Score: {context_dict.get('resume_score', 75)}/100\n"
                f"Predicted Level: {context_dict.get('predicted_level', 'SDE1')}\n"
                f"Verified Skills: {', '.join(context_dict.get('skills', []))}\n"
                f"Missing Skills: {', '.join(context_dict.get('missing_skills', []))}\n"
                f"Strengths: {', '.join(context_dict.get('strengths', []))}\n"
                f"Resume Content Summary: {context_dict.get('resume_text', '')[:1000]}"
            )
        else:
            # Recruiter Mode
            context_str = (
                f"Active Job Title: {context_dict.get('job_title', 'Software Engineer')}\n"
                f"Required Skills: {', '.join(context_dict.get('required_skills', []))}\n"
                f"Total Applications: {context_dict.get('total_candidates', 0)}\n"
                f"Top Candidates: {context_dict.get('top_candidates_summary', 'N/A')}\n"
            )

        if self.client:
            try:
                from langchain_core.prompts import ChatPromptTemplate
                if mode == "candidate":
                    system_msg = (
                        "You are an Elite AI Career Intelligence Advisor and Technical Architect. "
                        "Answer the candidate's question with precise, honest, evidence-grounded career advice. "
                        "Refer to their actual skills, strengths, and missing requirements directly from the context. "
                        "Never fabricate accomplishments."
                    )
                else:
                    system_msg = (
                        "You are an Executive Recruitment Intelligence Partner. "
                        "Help the recruiter evaluate candidate pools, compare qualifications, identify hidden transferable capabilities, "
                        "and understand the multidimensional scoring factors grounded strictly in the provided data."
                    )

                prompt = ChatPromptTemplate.from_messages([
                    ("system", system_msg),
                    ("human", f"Context Data:\n{context_str}\n\nQuestion: {query}")
                ])
                chain = prompt | self.client
                res = chain.invoke({})
                return res.content
            except Exception as e:
                logger.warning(f"Groq invocation failed: {e}. Falling back to contextual template.")

        # Contextual Fallback Response
        q_lower = query.lower()
        if mode == "candidate":
            if "score" in q_lower or "why" in q_lower:
                return (
                    f"Your overall score is determined by our 8-dimensional scoring model. "
                    f"You have strong evidence in **{', '.join(context_dict.get('skills', [])[:3])}**, "
                    f"but gaps in **{', '.join(context_dict.get('missing_skills', [])[:3])}** impacted the required skills dimension. "
                    f"Adding concrete measurable project outcomes can raise your evidence strength score."
                )
            elif "learn" in q_lower or "roadmap" in q_lower or "skill" in q_lower:
                missing = context_dict.get('missing_skills', ['Docker', 'Kubernetes', 'CI/CD'])
                return (
                    f"To reach the next seniority level, prioritize these three competencies: "
                    f"1. **{missing[0] if len(missing) > 0 else 'Cloud Architecture'}** — core prerequisite.\n"
                    f"2. **{missing[1] if len(missing) > 1 else 'Distributed Systems'}** — builds architectural depth.\n"
                    f"3. **{missing[2] if len(missing) > 2 else 'Automated Testing'}** — increases production readiness."
                )
            else:
                return (
                    f"Based on your profile for **{context_dict.get('recommended_role', 'Software Engineer')}**, "
                    f"your current technical foundation is solid with {len(context_dict.get('skills', []))} verified skills. "
                    f"I recommend tailoring your project bullets with the Google X-Y-Z formula in the Resume Redesign Studio."
                )
        else:
            return (
                f"In your applicant pool for **{context_dict.get('job_title', 'this role')}**, "
                f"candidates are ranked using required skill coverage (25%), experience duration (15%), and verified project evidence (15%). "
                f"You can toggle 'Fair Screening Mode' to review candidates without unconscious demographic bias."
            )

career_recruiter_chatbot = CareerAndRecruiterChatbot()
