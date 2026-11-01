import re
from typing import List, Dict, Tuple, Set, Optional
from app.models.schemas import SkillProvenance

# Extensive Technical Skill Dictionary
SKILL_TAXONOMY = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "dart", "sql", "bash",
        "shell", "powershell", "html", "html5", "css", "css3", "sass", "scss", "matlab"
    ],
    "frameworks": [
        "fastapi", "django", "flask", "react", "react.js", "next.js", "vue", "vue.js",
        "angular", "svelte", "express", "express.js", "nestjs", "node.js", "nodejs",
        "spring", "spring boot", "asp.net", ".net core", "ruby on rails", "laravel",
        "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn", "huggingface",
        "langchain", "llamaindex", "pandas", "numpy", "scipy", "opencv", "tailwind css",
        "bootstrap", "graphql", "apollo", "trpc", "electron", "react native", "flutter"
    ],
    "databases": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
        "cassandra", "dynamodb", "sqlite", "mariadb", "oracle", "neo4j", "snowflake",
        "bigquery", "redshift", "clickhouse", "couchdb", "firebase", "supabase"
    ],
    "cloud_devops": [
        "aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud platform",
        "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "github actions",
        "gitlab ci", "ci/cd", "continuous integration", "continuous deployment", "helm",
        "linux", "nginx", "apache", "prometheus", "grafana", "datadog", "serverless",
        "aws lambda", "cloudformation", "ec2", "s3", "rds", "sqs", "sns", "ecs", "eks"
    ],
    "architecture_concepts": [
        "rest api", "restful api", "rest apis", "microservices", "system design",
        "distributed systems", "event-driven architecture", "kafka", "rabbitmq",
        "clean architecture", "domain-driven design", "test-driven development", "tdd",
        "object-oriented programming", "oop", "data structures", "algorithms",
        "concurrency", "multithreading", "asyncio", "caching", "load balancing",
        "message queues", "etl", "data pipelines", "api design"
    ],
    "ai_ml_data": [
        "machine learning", "deep learning", "natural language processing", "nlp",
        "computer vision", "llm", "large language models", "rag", "retrieval augmented generation",
        "vector databases", "faiss", "pinecone", "chromadb", "embeddings", "transformers",
        "reinforcement learning", "feature engineering", "model deployment", "mlops",
        "fine-tuning", "prompt engineering", "sentiment analysis", "generative ai"
    ],
    "tools": [
        "git", "github", "gitlab", "jira", "postman", "swagger", "vite", "webpack",
        "pytest", "jest", "unittest", "selenium", "cypress", "playwright", "figma"
    ]
}

# Skill canonical normalization map
SYNONYM_MAP = {
    "golang": "Go",
    "k8s": "Kubernetes",
    "postgres": "PostgreSQL",
    "react.js": "React",
    "reactjs": "React",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "nextjs": "Next.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express.js": "Express",
    "sklearn": "Scikit-Learn",
    "amazon web services": "AWS",
    "google cloud platform": "GCP",
    "microsoft azure": "Azure",
    "ci/cd": "CI/CD",
    "restful api": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "llms": "Large Language Models",
    "llm": "Large Language Models",
    "rag": "RAG",
    "large language models": "Large Language Models",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "natural language processing": "NLP",
    "system design": "System Design",
    "microservices": "Microservices",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "git": "Git"
}

# Inferred Capability Rules: Pattern -> (Inferred Skill, Category, Confidence)
INFERRED_CAPABILITY_RULES = [
    (
        r"(fastapi|django|flask|express|spring boot|nestjs|ruby on rails).*(api|endpoint|route|backend|service)",
        "Backend API Architecture", "architecture_concepts", 0.90
    ),
    (
        r"(docker|container|image).*(aws|gcp|azure|kubernetes|deploy|prod|cloud)",
        "Containerized Cloud Deployment", "cloud_devops", 0.90
    ),
    (
        r"(scikit-learn|pytorch|tensorflow|keras).*(trained|model|predict|accuracy|classification|regression)",
        "Predictive Modeling & ML Pipeline", "ai_ml_data", 0.92
    ),
    (
        r"(rag|vector|embedding|retrieval|faiss|chromadb|langchain|llamaindex|llm)",
        "Applied Generative AI & RAG", "ai_ml_data", 0.94
    ),
    (
        r"(sql|query|queries|schema|relational|foreign key|index|join).*(optimi|database|perform)",
        "Relational Schema & Query Optimization", "databases", 0.88
    ),
    (
        r"(ci/cd|github actions|jenkins|pipeline).*(deploy|test|build|automat)",
        "Automated CI/CD Delivery", "cloud_devops", 0.90
    ),
    (
        r"(unittest|pytest|jest|cypress|test coverage|integration test|mock)",
        "Automated Software Testing & QA", "tools", 0.87
    ),
    (
        r"(react|vue|angular|svelte|next\.js).*(state|component|frontend|ui|ux|responsive)",
        "Modern Component-Driven Frontend", "frameworks", 0.90
    ),
    (
        r"(microservices|distributed|grpc|event-driven|kafka|rabbitmq)",
        "Distributed & Microservices Architecture", "architecture_concepts", 0.91
    ),
    (
        r"(lead|led|mentored|architected|coordinated|spearheaded|managed team)",
        "Technical Leadership & Mentorship", "soft_skills", 0.85
    )
]

# Transferable Domain Knowledge Pairs: Candidate Skill -> Transferable to Target Skill
TRANSFERABLE_MAP = {
    "PostgreSQL": ["MySQL", "Relational Databases", "SQL Server", "Oracle"],
    "MySQL": ["PostgreSQL", "Relational Databases", "MariaDB"],
    "MongoDB": ["Document Databases", "DynamoDB", "NoSQL Architecture"],
    "FastAPI": ["Flask", "Django", "Express", "REST APIs", "Backend Services"],
    "Flask": ["FastAPI", "Django", "REST APIs"],
    "Django": ["FastAPI", "Flask", "Full-Stack Web Architecture"],
    "React": ["Vue.js", "Next.js", "Component-Based UI", "Single Page Applications"],
    "Vue.js": ["React", "Component-Based UI"],
    "Angular": ["React", "TypeScript Web Applications"],
    "AWS": ["GCP", "Azure", "Cloud Infrastructure", "Cloud Computing"],
    "GCP": ["AWS", "Azure", "Cloud Infrastructure"],
    "Azure": ["AWS", "GCP", "Cloud Infrastructure"],
    "Docker": ["Containerization", "Kubernetes", "Container Orchestration"],
    "Kubernetes": ["Docker", "Container Orchestration", "Cloud Native Operations"],
    "PyTorch": ["TensorFlow", "Deep Learning Frameworks", "Neural Networks"],
    "TensorFlow": ["PyTorch", "Deep Learning Frameworks"],
    "Scikit-Learn": ["Predictive Modeling", "Machine Learning Algorithms"],
    "Kafka": ["RabbitMQ", "Event-Driven Messaging", "Message Brokers"],
    "RabbitMQ": ["Kafka", "Message Brokers"]
}

class SkillInferenceEngine:
    def __init__(self):
        self.all_keywords = set()
        for cat, skills in SKILL_TAXONOMY.items():
            for s in skills:
                self.all_keywords.add(s.lower())

    def normalize_skill(self, skill: str) -> str:
        s_clean = skill.strip().lower()
        if s_clean in SYNONYM_MAP:
            return SYNONYM_MAP[s_clean]
        # Return title case if not in synonym map
        return skill.strip().title()

    def extract_explicit_skills(self, text: str) -> List[str]:
        """Extracts skills explicitly mentioned in the text using word boundaries."""
        text_lower = text.lower()
        found_skills = set()
        for skill in self.all_keywords:
            pattern = r'(?<![a-zA-Z0-9_-])' + re.escape(skill) + r'(?![a-zA-Z0-9_-])'
            if re.search(pattern, text_lower):
                found_skills.add(self.normalize_skill(skill))
        return sorted(list(found_skills))

    def infer_hidden_capabilities(self, sentences_or_bullets: List[str]) -> List[SkillProvenance]:
        """
        Analyzes projects, experience bullets, and achievements to infer
        demonstrated engineering capability with evidence provenance.
        """
        inferred: List[SkillProvenance] = []
        seen_skills = set()

        for text in sentences_or_bullets:
            if not text or len(text.strip()) < 10:
                continue
            text_clean = text.strip()
            for pattern, capability, category, conf in INFERRED_CAPABILITY_RULES:
                if capability not in seen_skills and re.search(pattern, text_clean, re.IGNORECASE):
                    seen_skills.add(capability)
                    inferred.append(SkillProvenance(
                        skill=capability,
                        category=category,
                        source="inferred",
                        evidence=text_clean[:180] + ("..." if len(text_clean) > 180 else ""),
                        confidence=conf
                    ))
        return inferred

    def find_transferable_skills(self, explicit_skills: List[str], target_required_skills: List[str]) -> List[SkillProvenance]:
        """
        Identifies candidate capabilities that directly transfer to target requirements,
        even if the candidate did not mention the exact target tool.
        """
        transferable: List[SkillProvenance] = []
        explicit_set = {s.lower() for s in explicit_skills}
        target_lower = {t.lower() for t in target_required_skills}

        for explicit_skill in explicit_skills:
            norm_explicit = self.normalize_skill(explicit_skill)
            if norm_explicit in TRANSFERABLE_MAP:
                transferable_targets = TRANSFERABLE_MAP[norm_explicit]
                for target_skill in transferable_targets:
                    # If target role requires this or a related skill and candidate doesn't have it explicitly
                    if target_skill.lower() in target_lower and target_skill.lower() not in explicit_set:
                        transferable.append(SkillProvenance(
                            skill=f"{target_skill} (via {norm_explicit})",
                            category="transferable",
                            source="transferable",
                            evidence=f"Demonstrated proficiency in {norm_explicit} provides strong transferable foundation for {target_skill}.",
                            confidence=0.82
                        ))
                    elif not target_required_skills:
                        # General transferable representation
                        transferable.append(SkillProvenance(
                            skill=target_skill,
                            category="transferable",
                            source="transferable",
                            evidence=f"Transferable from candidate's verified {norm_explicit} experience.",
                            confidence=0.78
                        ))

        # Deduplicate by skill name
        deduped = []
        seen = set()
        for item in transferable:
            if item.skill not in seen:
                seen.add(item.skill)
                deduped.append(item)
        return deduped[:8]

skill_engine = SkillInferenceEngine()

