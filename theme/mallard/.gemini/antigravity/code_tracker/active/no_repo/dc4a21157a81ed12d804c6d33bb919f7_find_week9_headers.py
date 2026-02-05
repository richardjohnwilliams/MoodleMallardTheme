ˆimport re

file_path = 'c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 9 content.txt'

with open(file_path, 'r', encoding='utf-8') as f:
    for line in f:
        if re.search(r'^(Topic \d|9\.\d\.\d|Chapter \d|Next,)', line):
            print(line.strip())
ˆ*cascade082Dfile:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/find_week9_headers.py