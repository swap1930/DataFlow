import cohere
import json

# Initialize Cohere Client
co = cohere.ClientV2(api_key="riyXcV8DUJGIskppNKAW9wtAg1MK21PixI3kOiSs")

# Large complex JSON (≈50 lines, nested + numerical data)
data = {
    "company": "TechNova",
    "departments": [
        {
            "name": "Research",
            "employees": [
                {"id": 101, "name": "Alice", "age": 34, "salary": 82000, "projects": [12, 15, 18]},
                {"id": 102, "name": "Bob", "age": 41, "salary": 95000, "projects": [14, 16]},
                {"id": 103, "name": "Charlie", "age": 29, "salary": 67000, "projects": [15, 19]}
            ],
            "budget": 500000
        },
        {
            "name": "Engineering",
            "employees": [
                {"id": 201, "name": "David", "age": 38, "salary": 105000, "projects": [21, 25, 27]},
                {"id": 202, "name": "Eva", "age": 33, "salary": 87000, "projects": [22, 26]},
                {"id": 203, "name": "Frank", "age": 45, "salary": 120000, "projects": [21, 28]}
            ],
            "budget": 800000
        },
        {
            "name": "Marketing",
            "employees": [
                {"id": 301, "name": "Grace", "age": 31, "salary": 72000, "projects": [31, 32]},
                {"id": 302, "name": "Hank", "age": 39, "salary": 85000, "projects": [33, 34, 35]},
                {"id": 303, "name": "Ivy", "age": 28, "salary": 68000, "projects": [31, 36]}
            ],
            "budget": 400000
        }
    ],
    "projects": [
        {"id": 12, "name": "AI Model", "cost": 120000, "duration_months": 14},
        {"id": 14, "name": "Quantum Chip", "cost": 220000, "duration_months": 22},
        {"id": 15, "name": "Neural Net Optimizer", "cost": 90000, "duration_months": 9},
        {"id": 16, "name": "Autonomous Drone", "cost": 150000, "duration_months": 18},
        {"id": 18, "name": "Smart Grid", "cost": 200000, "duration_months": 20},
        {"id": 19, "name": "Blockchain Audit", "cost": 110000, "duration_months": 12},
        {"id": 21, "name": "5G Tower Upgrade", "cost": 300000, "duration_months": 24},
        {"id": 22, "name": "Edge Computing", "cost": 95000, "duration_months": 10},
        {"id": 25, "name": "Satellite Network", "cost": 400000, "duration_months": 30},
        {"id": 26, "name": "IoT Expansion", "cost": 85000, "duration_months": 8},
        {"id": 27, "name": "Green Energy AI", "cost": 260000, "duration_months": 15},
        {"id": 28, "name": "Cyber Defense", "cost": 175000, "duration_months": 16},
        {"id": 31, "name": "Market Predictor", "cost": 120000, "duration_months": 12},
        {"id": 32, "name": "Brand AI", "cost": 78000, "duration_months": 6},
        {"id": 33, "name": "Consumer Tracker", "cost": 140000, "duration_months": 14},
        {"id": 34, "name": "Ad Optimizer", "cost": 112000, "duration_months": 9},
        {"id": 35, "name": "Sales Forecaster", "cost": 99000, "duration_months": 7},
        {"id": 36, "name": "Global Outreach", "cost": 200000, "duration_months": 18}
    ],
    "year": 2025
}

# Convert JSON to string
json_str = json.dumps(data, indent=2)

# Ask a **very complex reasoning question**
complex_question = """
From the JSON above, calculate:
1. Which department has the highest average project duration across its employees' assigned projects?
2. Considering salaries + project costs, which department is overspending its allocated budget the most?
3. Which single employee indirectly contributes to the highest total project cost, and what is that total?
Provide reasoning step by step.
"""

# Send request to Cohere
response = co.chat(
    model="command-r-08-2024",
    messages=[
        {"role": "system", "content": "You are a JSON reasoning assistant."},
        {"role": "user", "content": f"Here is my JSON:\n{json_str}\n\nNow answer this complex question:\n{complex_question}"}
    ],
    temperature=0.2
)

# ✅ Extract only text response (plain text)
answer = "".join([msg.text for msg in response.message.content])
print(answer)
