from django.db import migrations


def seed_skills(apps, schema_editor):
    Skill = apps.get_model("jobs", "Skill")

    category_skills = {
        "Programming Languages": [
            "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Rust", "Kotlin",
            "Swift", "Ruby", "PHP", "Scala", "Dart", "Objective-C", "MATLAB", "R", "Julia", "Groovy",
            "Bash", "Shell Scripting", "Assembly", "COBOL", "Fortran", "Elixir", "Haskell", "F#",
            "Nim", "Zig",
        ],
        "Web Development": [
            "HTML", "CSS", "SASS", "LESS", "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI",
            "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "Redux", "Zustand",
            "jQuery", "Webpack", "Vite", "Parcel", "Babel", "Three.js", "WebGL",
        ],
        "Backend Development": [
            "Django", "Flask", "FastAPI", "Node.js", "Express.js", "NestJS", "Spring Boot",
            "Ruby on Rails", "Laravel", "ASP.NET", "GraphQL", "REST API", "gRPC",
            "Microservices", "Serverless", "JWT Authentication", "OAuth",
        ],
        "Databases": [
            "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "DynamoDB",
            "Firebase", "Supabase", "CockroachDB", "MariaDB", "Oracle DB", "Neo4j",
            "ElasticSearch", "TimescaleDB",
        ],
        "Cloud & DevOps": [
            "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Helm", "Terraform",
            "Ansible", "Jenkins", "GitHub Actions", "GitLab CI/CD", "CircleCI",
            "Prometheus", "Grafana", "Nginx", "Apache", "Linux", "Ubuntu", "Debian",
            "Load Balancing", "Auto Scaling",
        ],
        "AI / ML / Data Science": [
            "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
            "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
            "Matplotlib", "Seaborn", "OpenCV", "spaCy", "NLTK", "Transformers",
            "Hugging Face", "LLMs", "LangChain", "Data Analysis", "Feature Engineering",
            "Model Deployment", "MLOps",
        ],
        "Blockchain / Web3": [
            "Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Ethers.js",
            "Hardhat", "Foundry", "IPFS", "Polygon", "DeFi", "NFT Development",
        ],
        "Mobile Development": [
            "Android", "iOS", "React Native", "Flutter", "SwiftUI", "Kotlin Multiplatform",
            "Expo", "Xamarin",
        ],
        "Testing": [
            "Unit Testing", "Integration Testing", "E2E Testing", "Jest", "Mocha", "Chai",
            "PyTest", "JUnit", "Selenium", "Cypress", "Playwright", "TestNG",
        ],
        "Security": [
            "Cybersecurity", "Ethical Hacking", "Penetration Testing", "OWASP",
            "Encryption", "SSL/TLS", "Network Security", "IAM",
        ],
        "Data / Analytics / BI": [
            "SQL", "Data Warehousing", "ETL", "Apache Spark", "Hadoop", "Airflow",
            "Power BI", "Tableau", "Looker", "BigQuery", "Snowflake",
        ],
        "Soft Skills": [
            "Problem Solving", "Communication", "Leadership", "Teamwork", "Time Management",
            "Critical Thinking", "Adaptability", "Creativity", "Decision Making",
            "Conflict Resolution",
        ],
        "Tools & Platforms": [
            "Git", "GitHub", "GitLab", "Bitbucket", "Postman", "Figma", "Jira", "Notion",
            "Slack", "VS Code", "IntelliJ", "PyCharm", "Docker Compose", "ngrok",
        ],
    }

    for category, skills in category_skills.items():
        for name in skills:
            Skill.objects.get_or_create(name=name, defaults={"category": category})


def unseed_skills(apps, schema_editor):
    # Keep data on reverse to avoid removing recruiter-managed skill records.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0004_skill_job_minimum_experience_required_job_skills"),
    ]

    operations = [
        migrations.RunPython(seed_skills, unseed_skills),
    ]
