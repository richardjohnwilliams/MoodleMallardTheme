¦import re

file_path = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 2 content.txt"

pattern = re.compile(r"2\.\d+\.\d+")

with open(file_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if pattern.search(line):
            print(f"{i}: {line.strip()}")
¦*cascade082>file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/find_headers.py