import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Listing ALL available models:")
for m in genai.list_models():
    print(f"Name: {m.name}, Methods: {m.supported_generation_methods}")
