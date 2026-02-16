import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-flash-latest")

response = model.generate_content(
    "Say exactly: Gemini API test successful"
)

print("✅ Response from Gemini:")
print(response.text)

