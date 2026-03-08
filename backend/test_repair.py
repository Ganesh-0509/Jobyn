"""Quick test for LLM JSON repair."""
import json
from app.utils.llm_utils import parse_json_from_llm

# Test 1: raw newlines in string values (common LLM issue)
test1 = '{"skill": "python", "explanation": "Line one\nLine two\nLine three", "tip": "practice"}'
r1 = parse_json_from_llm(test1)
print(f"Test 1 (raw newlines): {'PASS' if r1 and r1.get('skill') == 'python' else 'FAIL'} -> {r1}")

# Test 2: truncated mid-string
test2 = '{"skill": "react", "detailed_content": [{"subheading": "Basics", "explanation": "React is a lib for buildi'
r2 = parse_json_from_llm(test2)
print(f"Test 2 (truncated string): {'PASS' if r2 and r2.get('skill') == 'react' else 'FAIL'} -> {type(r2)}")

# Test 3: truncated with raw newline inside  
test3 = '{"skill": "dsa", "content": [{"sub": "arrays", "code": "def sort(arr):\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[j] < ar'
r3 = parse_json_from_llm(test3)
print(f"Test 3 (truncated + raw newlines): {'PASS' if r3 and r3.get('skill') == 'dsa' else 'FAIL'} -> {type(r3)}")

# Test 4: code fences wrapping
test4 = '```json\n{"skill": "sql", "tip": "use indexes"}\n```'
r4 = parse_json_from_llm(test4)
print(f"Test 4 (code fences): {'PASS' if r4 and r4.get('skill') == 'sql' else 'FAIL'} -> {r4}")

# Test 5: valid JSON (no repair needed)
test5 = '{"skill": "java", "summary": "OOP language", "sections": [{"title": "Basics"}]}'
r5 = parse_json_from_llm(test5)
print(f"Test 5 (valid JSON): {'PASS' if r5 and r5.get('skill') == 'java' else 'FAIL'} -> {type(r5)}")

# Test 6: trailing comma + raw newline
test6 = '{"skill": "node", "items": ["express",\n"koa",\n"fastify",\n'
r6 = parse_json_from_llm(test6)
print(f"Test 6 (trailing comma + newline): {'PASS' if r6 and r6.get('skill') == 'node' else 'FAIL'} -> {r6}")

print("\nAll tests complete.")
