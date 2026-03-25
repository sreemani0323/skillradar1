// SkillRadar Data - DO NOT MODIFY
// This file contains static data for the application

const jobsData = [
  {
    id: 1,
    role: "Frontend Developer Intern",
    company: "TechCorp Solutions",
    location: "Remote",
    level: "Beginner",
    skills: ["React", "JavaScript", "CSS", "HTML"],
    source: "LinkedIn",
    postedDate: "2024-03-20"
  },
  {
    id: 2,
    role: "Backend Developer Intern",
    company: "ByteCode Labs",
    location: "Bangalore",
    level: "Intermediate",
    skills: ["Python", "Django", "PostgreSQL", "AWS"],
    source: "Internshala",
    postedDate: "2024-03-19"
  },
  {
    id: 3,
    role: "Full Stack Developer",
    company: "InnovateTech",
    location: "Remote",
    level: "Advanced",
    skills: ["React", "Node.js", "MongoDB", "Docker"],
    source: "Unstop",
    postedDate: "2024-03-18"
  },
  {
    id: 4,
    role: "Machine Learning Intern",
    company: "AI Dynamics",
    location: "Hyderabad",
    level: "Intermediate",
    skills: ["Python", "TensorFlow", "Machine Learning", "Pandas"],
    source: "LinkedIn",
    postedDate: "2024-03-17"
  },
  {
    id: 5,
    role: "DevOps Engineer Intern",
    company: "CloudFirst",
    location: "Mumbai",
    level: "Advanced",
    skills: ["AWS", "Docker", "Kubernetes", "Jenkins"],
    source: "Internshala",
    postedDate: "2024-03-16"
  },
  {
    id: 6,
    role: "Data Science Intern",
    company: "DataVision",
    location: "Remote",
    level: "Beginner",
    skills: ["Python", "Machine Learning", "SQL", "Tableau"],
    source: "Unstop",
    postedDate: "2024-03-15"
  },
  {
    id: 7,
    role: "Mobile App Developer",
    company: "AppCraft Studio",
    location: "Pune",
    level: "Intermediate",
    skills: ["React Native", "JavaScript", "Firebase", "Redux"],
    source: "LinkedIn",
    postedDate: "2024-03-14"
  },
  {
    id: 8,
    role: "Cloud Engineer Intern",
    company: "SkyTech Solutions",
    location: "Chennai",
    level: "Advanced",
    skills: ["AWS", "Terraform", "Python", "Kubernetes"],
    source: "Internshala",
    postedDate: "2024-03-13"
  },
  {
    id: 9,
    role: "UI/UX Designer Intern",
    company: "DesignHub",
    location: "Remote",
    level: "Beginner",
    skills: ["Figma", "Adobe XD", "UI Design", "Prototyping"],
    source: "Unstop",
    postedDate: "2024-03-12"
  },
  {
    id: 10,
    role: "Software Developer Intern",
    company: "CodeCraft Inc",
    location: "Delhi",
    level: "Intermediate",
    skills: ["Java", "Spring Boot", "MySQL", "Git"],
    source: "LinkedIn",
    postedDate: "2024-03-11"
  },
  {
    id: 11,
    role: "QA Automation Intern",
    company: "TestPro Labs",
    location: "Bangalore",
    level: "Beginner",
    skills: ["Selenium", "Java", "TestNG", "API Testing"],
    source: "Internshala",
    postedDate: "2024-03-10"
  },
  {
    id: 12,
    role: "Cybersecurity Analyst",
    company: "SecureNet",
    location: "Remote",
    level: "Advanced",
    skills: ["Network Security", "Penetration Testing", "SIEM", "Python"],
    source: "Unstop",
    postedDate: "2024-03-09"
  }
];

const skillDemand = {
  "Python": 85,
  "JavaScript": 78,
  "React": 72,
  "AWS": 68,
  "Node.js": 65,
  "Machine Learning": 62,
  "Docker": 58,
  "SQL": 55,
  "Java": 52,
  "Kubernetes": 48,
  "MongoDB": 45,
  "PostgreSQL": 42,
  "Django": 38,
  "TensorFlow": 35,
  "Firebase": 32,
  "Redux": 28,
  "Spring Boot": 25,
  "Figma": 22
};

const trendData = {
  "Python": [78, 80, 82, 83, 84, 85, 85],
  "JavaScript": [72, 74, 76, 77, 78, 78, 78],
  "React": [65, 67, 69, 70, 71, 72, 72],
  "AWS": [60, 62, 64, 66, 67, 68, 68],
  "Machine Learning": [55, 57, 59, 60, 61, 62, 62],
  "Docker": [50, 52, 54, 56, 57, 58, 58]
};

const applicationTracker = [
  {
    id: 1001,
    role: "Frontend Developer Intern",
    company: "TechCorp Solutions",
    status: "applied",
    date: "2024-03-15",
    salary: "₹25,000/month"
  },
  {
    id: 1002,
    role: "Backend Developer Intern",
    company: "ByteCode Labs",
    status: "interview",
    date: "2024-03-10",
    salary: "₹30,000/month"
  },
  {
    id: 1003,
    role: "Data Science Intern",
    company: "DataVision",
    status: "applied",
    date: "2024-03-18",
    salary: "₹28,000/month"
  },
  {
    id: 1004,
    role: "Full Stack Developer",
    company: "InnovateTech",
    status: "offer",
    date: "2024-03-05",
    salary: "₹35,000/month"
  }
];

const recentAlerts = [
  {
    id: "alert-1",
    title: "Weekly skill demand report",
    description: "Python demand increased by 3% this week",
    time: "2 hours ago",
    type: "trend",
    priority: "normal"
  },
  {
    id: "alert-2",
    title: "Profile completion reminder",
    description: "Add more skills to improve your match score",
    time: "1 day ago",
    type: "reminder",
    priority: "medium"
  },
  {
    id: "alert-3",
    title: "New high-demand skill detected",
    description: "Kubernetes is trending upward in job listings",
    time: "3 days ago",
    type: "skill",
    priority: "high"
  }
];